// OCPP Gateway Microservice – fixed version
// -----------------------------------------------------------
// ❶ Listens on the dynamic PORT Railway injects
// ❷ Echoes the exact ocpp1.6 sub‑protocol even when ABB sends “ocpp1.6, ocpp1.5”
// ❸ Accepts either /ocpp/{id} or /webServices/ocpp/{id} paths
// ❹ Removes duplicate 'close' handlers
// -----------------------------------------------------------

import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';

dotenv.config();

// -- Environment -------------------------------------------------------------
const PORT = parseInt(process.env.PORT ?? '3000', 10);       // ❶ dynamic
const JWT_SECRET =
  process.env.OCPP_GATEWAY_JWT || process.env.JWT_SECRET || 'supersecret';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// -- State -------------------------------------------------------------------
const chargerConnections: Record<string, WebSocket> = {};

// -- Helpers -----------------------------------------------------------------
async function updateChargerConnectionStatus(
  chargePointId: string,
  isConnected: boolean,
) {
  try {
    await axios.patch(`${BACKEND_URL}/api/charger/connection-status`, {
      chargePointId,
      isConnected,
      lastSeen: new Date().toISOString(),
    });
    console.log(
      `[OCPP] Updated charger ${chargePointId} connection status: ${isConnected}`,
    );
  } catch (error) {
    console.error(
      `[OCPP] Failed to update charger ${chargePointId} connection status:`,
      error,
    );
  }
}

// -- Express REST API --------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// JWT middleware
function authenticateJWT(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) return void res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err) => (err ? res.sendStatus(403) : next()));
}

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.get('/api/ocpp/chargers', (_, res) =>
  res.json(
    Object.keys(chargerConnections).map((id) => ({
      chargePointId: id,
      isConnected: chargerConnections[id].readyState === WebSocket.OPEN,
    })),
  ),
);

app.post('/api/ocpp/send', authenticateJWT, (req, res) => {
  const { chargePointId, command } = req.body;
  const ws = chargerConnections[chargePointId];
  if (!ws || ws.readyState !== WebSocket.OPEN)
    return void res.status(404).json({ error: 'Charger not connected' });
  ws.send(JSON.stringify(command));
  res.json({ status: 'sent' });
});

app.post('/api/ocpp/event', (_, res) => res.json({ status: 'received' }));

const server = http.createServer(app);

// -- WebSocket (OCPP‑J) -------------------------------------------------------
const wss = new WebSocketServer({
  server,
  handleProtocols: (protocols) => {
    // ❷ trim() ensures “ocpp1.6” is matched even when combined headers are sent
    for (const p of protocols) if (p.trim() === 'ocpp1.6') return 'ocpp1.6';
    return false; // incompatible
  },
});

console.log(`[OCPP] WebSocket server listening on ${PORT}`);

wss.on('connection', (ws: WebSocket, req: any) => {
  // ❸ Allow both ABB default and custom paths
  if (
    !req.url ||
    !(req.url.startsWith('/ocpp/') || req.url.startsWith('/webServices/ocpp/'))
  ) {
    console.log(`[OCPP] Invalid WebSocket path: ${req.url}`);
    ws.close(1000, 'Invalid path – use /ocpp/{chargePointId}');
    return;
  }

  const chargePointId = req.url.split('/').pop() || `cp_${Date.now()}`;
  chargerConnections[chargePointId] = ws;
  console.log(`[OCPP] Charger connected: ${chargePointId}`);

  updateChargerConnectionStatus(chargePointId, true);

  ws.on('message', async (data: any) => {
    let frame: any;
    try {
      frame = JSON.parse(data.toString());
    } catch {
      return console.error('[OCPP] Invalid JSON frame:', data.toString());
    }
    if (!Array.isArray(frame) || frame.length < 3)
      return console.error('[OCPP] Malformed OCPP frame:', frame);

    console.log(`[OCPP] Frame from ${chargePointId}:`, frame);

    const [typeId, uniqueId] = frame;

    // -- Respond to CALLs -----------------------------------------------------
    if (typeId === 2 /* CALL */) {
      const action = frame[2];
      let payload: any = {};
      switch (action) {
        case 'BootNotification':
          payload = {
            status: 'Accepted',
            currentTime: new Date().toISOString(),
            interval: 300,
          };
          break;
        case 'Heartbeat':
          payload = { currentTime: new Date().toISOString() };
          break;
        case 'StatusNotification':
          payload = {};
          break;
        default:
          payload = {};
      }
      ws.send(JSON.stringify([3 /* CALLRESULT */, uniqueId, payload]));
    }

    // -- Mirror to backend ----------------------------------------------------
    try {
      await axios.post(`${BACKEND_URL}/api/ocpp/event`, {
        chargePointId,
        msg: frame,
      });
    } catch (err) {
      console.error('[OCPP] Failed to forward event:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[OCPP] Charger disconnected: ${chargePointId}`);
    delete chargerConnections[chargePointId];
    updateChargerConnectionStatus(chargePointId, false);
  });

  // Heartbeat (keep‑alive for proxies)
  const hb = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
    else clearInterval(hb);
  }, 30_000);
});

server.listen(PORT, () => {
  console.log(`[REST] HTTP API listening on :${PORT}`);
  console.log(
    `[OCPP] WS endpoint ready at wss://<host>/ocpp/{chargePointId} (or /webServices/ocpp/{id})`,
  );
});

// ---------------------------------------------------------------------------
// Deployment checklist
//   • Remove PORT and WSS_PORT variables in Railway; let it inject PORT.
//   • Use TerraConfig endpoint: wss://ocpp-server-production.up.railway.app/ocpp/TACW2241224T0192
//   • Redeploy, reboot charger, verify /api/ocpp/chargers shows the device.
// ---------------------------------------------------------------------------
