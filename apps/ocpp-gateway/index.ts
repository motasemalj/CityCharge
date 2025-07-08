// OCPP Gateway Microservice Entry Point

import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Load environment variables from .env
dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Store charger connections by chargePointId
const chargerConnections: Record<string, WebSocket> = {};

// Update charger connection status in backend
async function updateChargerConnectionStatus(chargePointId: string, isConnected: boolean) {
  try {
    await axios.patch(`${BACKEND_URL}/api/charger/connection-status`, {
      chargePointId,
      isConnected,
      lastSeen: new Date().toISOString(),
    });
    console.log(`[OCPP] Updated charger ${chargePointId} connection status: ${isConnected}`);
  } catch (error) {
    console.error(`[OCPP] Failed to update charger ${chargePointId} connection status:`, error);
  }
}

// --- Express REST API ---
const app = express();
app.use(cors());
app.use(express.json());

// JWT Auth middleware
function authenticateJWT(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.sendStatus(401);
    return;
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    next();
  });
}

// Health check
app.get('/health', (req, res) => { res.json({ status: 'ok' }); });

// Get connected chargers
app.get('/api/ocpp/chargers', (req, res) => {
  const connectedChargers = Object.keys(chargerConnections).map(chargePointId => ({
    chargePointId,
    isConnected: chargerConnections[chargePointId].readyState === WebSocket.OPEN,
  }));
  res.json(connectedChargers);
});

// Send OCPP command to charger
app.post('/api/ocpp/send', authenticateJWT, (req, res) => {
  const { chargePointId, command } = req.body;
  const ws = chargerConnections[chargePointId];
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    res.status(404).json({ error: 'Charger not connected' });
    return;
  }
  ws.send(JSON.stringify(command));
  res.json({ status: 'sent' });
});

// Receive OCPP event from charger (for backend to test integration)
app.post('/api/ocpp/event', (req, res) => {
  // This endpoint is called by the gateway itself when forwarding events
  // You can process/store events here if needed
  res.json({ status: 'received' });
});

// Start REST API server
const server = http.createServer(app);

// --- OCPP WebSocket Server (same port as HTTP) ---
const wss = new WebSocketServer({ server, path: '/ocpp' });
console.log(`[OCPP] WebSocket server listening on same port as HTTP (${PORT})`);

wss.on('connection', (ws: WebSocket, req: any) => {
  // Extract chargePointId from URL (e.g., ws://host/ocpp/CP123)
  const urlParts = req.url?.split('/') || [];
  const chargePointId = urlParts[urlParts.length - 1] || `cp_${Date.now()}`;
  chargerConnections[chargePointId] = ws;
  console.log(`[OCPP] Charger connected: ${chargePointId}`);

  // Update connection status in backend
  updateChargerConnectionStatus(chargePointId, true);

  ws.on('message', async (data: any) => {
    // Parse OCPP message (assume JSON for simplicity)
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      console.error('[OCPP] Invalid message:', data.toString());
      return;
    }
    console.log(`[OCPP] Message from ${chargePointId}:`, msg);

    // Forward event to backend
    try {
      await axios.post(`${BACKEND_URL}/api/ocpp/event`, {
        chargePointId,
        msg,
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
// - Set PORT, JWT_SECRET, BACKEND_URL in environment variables
// - Use /api/ocpp/send to send commands to chargers
// - OCPP message parsing/validation should be extended for production use
// - Chargers connect TO this gateway using: wss://gateway-url/ocpp/{chargePointId} 