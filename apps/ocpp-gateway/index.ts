// src/index.ts
// OCPP Gateway – hardened for ABB quirks

import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';

dotenv.config();

// ---- ENV -------------------------------------------------------------------
const PORT = Number(process.env.PORT ?? 3000); // Railway injects this
const JWT_SECRET =
  process.env.OCPP_GATEWAY_JWT || process.env.JWT_SECRET || 'supersecret';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// ---- STATE -----------------------------------------------------------------
const chargerConnections: Record<string, WebSocket> = {};

// Map ws => chargePointId for reverse lookup
const wsIds = new WeakMap<WebSocket, string>();

// ---- HELPERS ---------------------------------------------------------------
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

function rebindConnectionId(oldId: string, newId: string, ws: WebSocket) {
  if (oldId === newId) return;
  console.log(`[OCPP] Rebinding connection ${oldId} -> ${newId}`);
  delete chargerConnections[oldId];
  chargerConnections[newId] = ws;
  wsIds.set(ws, newId);
  // Tell backend about the change
  updateChargerConnectionStatus(oldId, false);
  updateChargerConnectionStatus(newId, true);
}

// ---- EXPRESS ---------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

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

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/ocpp/chargers', (_req, res) => {
  const out = Object.keys(chargerConnections).map((id) => ({
    chargePointId: id,
    isConnected: chargerConnections[id].readyState === WebSocket.OPEN,
  }));
  res.json(out);
});

app.post('/api/ocpp/send', authenticateJWT, (req, res) => {
  const { chargePointId, command } = req.body;
  const ws = chargerConnections[chargePointId];
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return void res.status(404).json({ error: 'Charger not connected' });
  }
  ws.send(JSON.stringify(command));
  res.json({ status: 'sent' });
});

// Backend self-callback (optional)
app.post('/api/ocpp/event', (_req, res) => res.json({ status: 'received' }));

const server = http.createServer(app);

// ---- VISIBILITY: log raw upgrades & headers --------------------------------
server.on('upgrade', (req, _socket) => {
  console.log('[UPGRADE]', req.url, req.headers.host, req.headers['sec-websocket-protocol']);
});

// ---- WEBSOCKET SERVER ------------------------------------------------------
const wss = new WebSocketServer({
  server,
  handleProtocols: (protocols) => {
    for (const p of protocols) {
      if (p.trim() === 'ocpp1.6') return 'ocpp1.6';
    }
    // Accept anyway? Return false to be strict. ABB should send ocpp1.6.
    return false;
  },
});

wss.on('headers', (headers, req) => {
  console.log('[WS HEADERS OUT]', req.url, headers);
});

console.log(`[OCPP] WebSocket server listening on ${PORT}`);

wss.on('connection', (ws: WebSocket, req: any) => {
  const url = req.url || '';
  // Accept /ocpp/{id}, /webServices/ocpp/{id}, or /ocpp
  const prefixOk =
    url.startsWith('/ocpp') || url.startsWith('/webServices/ocpp');
  if (!prefixOk) {
    console.log(`[OCPP] Invalid path: ${url}`);
    ws.close(1000, 'Invalid path – use /ocpp/{id}');
    return;
  }

  let chargePointId =
    url.split('/').pop() ||
    `temp_${Date.now()}`; // temp until BootNotification reveals real ID

  chargerConnections[chargePointId] = ws;
  wsIds.set(ws, chargePointId);
  console.log(`[OCPP] Charger connected: ${chargePointId} (${url})`);

  updateChargerConnectionStatus(chargePointId, true);

  ws.on('message', async (data: any) => {
    let frame: any;
    try {
      frame = JSON.parse(data.toString());
    } catch {
      console.error('[OCPP] Invalid JSON frame:', data.toString());
      return;
    }
    if (!Array.isArray(frame) || frame.length < 3) {
      console.error('[OCPP] Malformed OCPP frame:', frame);
      return;
    }

    console.log(`[OCPP] Frame from ${chargePointId}:`, frame);

    const [messageTypeId, uniqueId] = frame;

    // Handle CALL
    if (messageTypeId === 2) {
      const action = frame[2];
      const payload = frame[3] || {};
      let responsePayload: any = {};

      switch (action) {
        case 'BootNotification': {
          responsePayload = {
            status: 'Accepted',
            currentTime: new Date().toISOString(),
            interval: 300,
          };

          // Try to promote real ID from payload
          const newId =
            payload.chargePointSerialNumber ||
            payload.chargeBoxSerialNumber ||
            payload.chargePointModel ||
            payload.chargePointVendor;
          if (newId) rebindConnectionId(chargePointId, newId, ws);
          chargePointId = wsIds.get(ws)!; // refresh local var
          break;
        }
        case 'Heartbeat':
          responsePayload = { currentTime: new Date().toISOString() };
          break;
        case 'StatusNotification':
          responsePayload = {};
          break;
        default:
          responsePayload = {};
      }

      ws.send(JSON.stringify([3, uniqueId, responsePayload]));
    }

    // Forward every frame to backend
    try {
      await axios.post(`${BACKEND_URL}/api/ocpp/event`, {
        chargePointId,
        msg: frame,
      });
    } catch (err) {
      console.error('[OCPP] Failed to forward event to backend:', err);
    }
  });

  ws.on('close', () => {
    const id = wsIds.get(ws) || chargePointId;
    console.log(`[OCPP] Charger disconnected: ${id}`);
    delete chargerConnections[id];
    updateChargerConnectionStatus(id, false);
  });

  // Keep-alive for proxies
  const hb = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
    else clearInterval(hb);
  }, 30_000);
});

// ---- START -----------------------------------------------------------------
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[REST] HTTP API listening on :${PORT}`);
  console.log(
    `[OCPP] WS endpoint at wss://<host>/ocpp/{chargePointId} (or /webServices/ocpp/{id})`,
  );
});
