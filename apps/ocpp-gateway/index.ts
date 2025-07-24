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
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080; // Railway injects this
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

// Log all incoming HTTP requests
server.on('request', (req, res) => {
  console.log('[HTTP]', req.method, req.url, 'from', req.socket.remoteAddress);
});

// Log all connection events
server.on('connection', (socket) => {
  console.log('[TCP] New connection from', socket.remoteAddress, socket.remotePort);
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

console.log(`[OCPP] WebSocket server listening on same port as HTTP (${PORT})`);

wss.on('connection', (ws: WebSocket, req: any) => {
  // Check if this is an OCPP connection (URL should start with /ocpp/)
  if (!req.url || !req.url.startsWith('/ocpp/')) {
    console.log(`[OCPP] Invalid WebSocket path: ${req.url}`);
    ws.close(1000, 'Invalid path - OCPP connections must use /ocpp/{chargePointId}');
    return;
  }

  // Extract chargePointId from URL (e.g., ws://host/ocpp/CP123)
  const urlParts = req.url.split('/');
  const chargePointId = urlParts[2] || `cp_${Date.now()}`; // /ocpp/CHARGER_ID
  chargerConnections[chargePointId] = ws;
  console.log(`[OCPP] Charger connected: ${chargePointId} (from ${req.url})`);

  // Update connection status in backend
  updateChargerConnectionStatus(chargePointId, true);

  ws.on('message', async (data: any) => {
    // OCPP-J frames are pure JSON arrays.       
    let frame: any;
    try {
      frame = JSON.parse(data.toString());
    } catch (e) {
      console.error('[OCPP] Invalid JSON frame:', data.toString());
      return;
    }

    if (!Array.isArray(frame) || frame.length < 3) {
      console.error('[OCPP] Malformed OCPP frame:', frame);
      return;
    }

    console.log(`[OCPP] Frame from ${chargePointId}:`, frame);

    const [messageTypeId, uniqueId] = frame;

    // Handle CALL messages from charger that require immediate CALLRESULT response
    if (messageTypeId === 2 /* CALL */) {
      const action = frame[2];

      let responsePayload: any = {};
      switch (action) {
        case 'BootNotification':
          responsePayload = {
            status: 'Accepted',
            currentTime: new Date().toISOString(),
            interval: 300, // seconds until next Heartbeat
          };
          break;
        case 'Heartbeat':
          responsePayload = {
            currentTime: new Date().toISOString(),
          };
          break;
        case 'StatusNotification':
          responsePayload = {};
          break;
        default:
          // For unsupported actions we still have to reply with an empty payload to acknowledge.
          responsePayload = {};
      }

      const callResult = [3 /* CALLRESULT */, uniqueId, responsePayload];
      ws.send(JSON.stringify(callResult));
    }

    // Forward every frame (raw) to backend for persistence/analytics.
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
    console.log(`[OCPP] Charger disconnected: ${chargePointId}`);
    delete chargerConnections[chargePointId];
    
    // Update connection status in backend
    updateChargerConnectionStatus(chargePointId, false);
  });

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
      updateChargerConnectionStatus(chargePointId, true);
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  ws.on('close', () => {
    clearInterval(heartbeatInterval);
  });
});

server.listen(PORT, () => {
  console.log(`[REST] API server listening on http://localhost:${PORT}`);
  console.log(`[OCPP] WebSocket server ready at ws://localhost:${PORT}/ocpp/`);
});

// --- Notes ---
// - Use HTTPS/WSS in production (Railway will provide SSL termination)
// - Set PORT, OCPP_GATEWAY_JWT, BACKEND_URL in environment variables
// - Use /api/ocpp/send to send commands to chargers
// - OCPP message parsing/validation should be extended for production use
// - Chargers connect TO this gateway using: ws://gateway-url/ocpp/{chargePointId}