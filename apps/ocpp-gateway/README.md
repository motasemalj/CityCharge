# OCPP Gateway Setup Guide

## Do You Need Charger IP Addresses?

**Short Answer: No, you typically don't need to know charger IP addresses for OCPP communication.**

### How OCPP Communication Works

OCPP uses a **WebSocket client-server model** where:

1. **Your OCPP Gateway** acts as a WebSocket server (listening on a port)
2. **Chargers** act as WebSocket clients (connecting TO your gateway)
3. **Chargers initiate the connection** to your central system

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Charger       │   Connection     │  OCPP Gateway   │
│ (192.168.10.143)│ ──────────────► │ (Your Server)   │
│                 │    ws://...      │                 │
└─────────────────┘                  └─────────────────┘
```

## Charger Configuration

### Required Information for Each Charger

For your Siemens charger with these specs:
```
Serial No: JAAL34S021
Catalog No: 8EM1310-3EJ04-0GA0
IP address: 192.168.10.143
Rated Volts: 240
Rated Amps: 32
Maximum Amps: 32
Target group: Production
```

### What You Need in Your Database

```typescript
{
  chargePointId: "JAAL34S021",        // ✅ REQUIRED: Unique identifier
  serialNumber: "JAAL34S021",         // ✅ REQUIRED: Hardware serial
  catalogNumber: "8EM1310-3EJ04-0GA0", // ✅ For inventory/support
  vendor: "Siemens",                  // ✅ REQUIRED
  model: "8EM1310-3EJ04-0GA0",        // ✅ Helpful
  ratedVolts: 240,                    // ✅ Technical specs
  ratedAmps: 32,                      // ✅ Technical specs
  maximumAmps: 32,                    // ✅ Technical specs
  ipAddress: "192.168.10.143",        // ⚠️  OPTIONAL: For management only
  targetGroup: "Production",          // ⚠️  OPTIONAL: For grouping
  // ... location, pricing, etc.
}
```

### Charger Network Configuration

**On the charger side**, you need to configure:

1. **OCPP Server URL**: `ws://your-gateway-domain.com:3002/ocpp/JAAL34S021`
2. **Charge Point ID**: `JAAL34S021` (use the serial number)
3. **OCPP Version**: Typically 1.6 or 2.0
4. **Connection Interval**: Heartbeat frequency (usually 30-60 seconds)

### Example Charger Configuration

Most OCPP chargers have a web interface accessible via their IP address (192.168.10.143). Configure these settings:

```
OCPP Settings:
├── Central System URL: ws://your-domain.com:3002/ocpp/JAAL34S021
├── Charge Point ID: JAAL34S021
├── OCPP Version: 1.6-J
├── Heartbeat Interval: 30 seconds
└── Connection Retry Interval: 10 seconds
```

## When IP Addresses Are Useful

While not required for OCPP communication, IP addresses can be helpful for:

### 1. **Initial Setup & Configuration**
- Accessing the charger's web interface
- Configuring OCPP settings
- Firmware updates

### 2. **Network Diagnostics**
- Troubleshooting connectivity issues
- Network monitoring
- Performance analysis

### 3. **Backup Management**
- Direct communication if OCPP fails
- Configuration backup/restore
- Emergency control

## Production Deployment

### Environment Variables

```bash
# OCPP Gateway
PORT=3001                 # HTTP and WebSocket server port
JWT_SECRET=your-secret   # Authentication
BACKEND_URL=https://your-backend-domain.com
NODE_ENV=production
```

### Deployment Steps

1. **Deploy the OCPP Gateway as a separate service**
   ```bash
   # Navigate to the OCPP gateway directory
   cd apps/ocpp-gateway
   
   # Deploy to Railway (or your preferred platform)
   railway up
   ```

2. **Set Environment Variables**
   - `JWT_SECRET`: Strong secret key for authentication
   - `BACKEND_URL`: URL of your deployed backend service
   - `PORT`: 3001 (HTTP and WebSocket server)

3. **Update Backend Configuration**
   Set `OCPP_GATEWAY_URL` in your backend to point to the deployed gateway

### Railway Deployment

The gateway includes a `railway.toml` configuration file. Simply run:
```bash
railway login
railway link  # Link to your project
railway up    # Deploy
```

### Charger Connection URL Examples

Development:
```
ws://localhost:3001/ocpp/[YOUR_CHARGER_ID]
```

Production:
```
wss://ocpp-server-production.up.railway.app/ocpp/[YOUR_CHARGER_ID]
```

**Replace `[YOUR_CHARGER_ID]` with your actual charger identifier:**
- Serial number (e.g., `JAAL34S021`)
- MAC address (e.g., `00:1A:2B:3C:4D:5E`)
- Custom ID (e.g., `STATION_001`, `PARKING_LOT_A_01`)

### Configure Any OCPP Charger

Once deployed, configure your OCPP charger with:

1. **Access charger web interface**: `http://[YOUR_CHARGER_IP]`
2. **Set OCPP Configuration**:
   - **Central System URL**: `wss://ocpp-server-production.up.railway.app/ocpp/[YOUR_CHARGER_ID]`
   - **Charge Point ID**: `[YOUR_CHARGER_ID]` (e.g., serial number, MAC address, or custom ID)
   - **OCPP Version**: `1.6-J` or `2.0.1`
   - **Heartbeat Interval**: `30` seconds

**Examples:**
- Siemens: `wss://ocpp-server-production.up.railway.app/ocpp/JAAL34S021`
- ABB: `wss://ocpp-server-production.up.railway.app/ocpp/ABB_Terra_001`
- Any charger: `wss://ocpp-server-production.up.railway.app/ocpp/MY_CHARGER_123`

**That's it!** Any OCPP-compliant charger will connect automatically.

### Testing WebSocket Connections

You can test the OCPP gateway with any charger ID using the included test script:

```bash
# Test with default ID
node test-websocket.js

# Test with custom charger ID
node test-websocket.js MY_CHARGER_123
node test-websocket.js SIEMENS_001
node test-websocket.js ABB_TERRA_AC_50

# Test with your actual charger serial number
node test-websocket.js JAAL34S021
```

## Connection Flow

1. **Charger boots up** and reads its configuration
2. **Charger connects** to `wss://your-gateway.com/ocpp/JAAL34S021`
3. **Gateway extracts** chargePointId (`JAAL34S021`) from URL
4. **Gateway updates** database: `isConnected = true`
5. **OCPP messages** flow bidirectionally
6. **Gateway forwards** events to your backend
7. **On disconnect**, gateway updates: `isConnected = false`

## API Endpoints

### OCPP Gateway Endpoints

```typescript
// Send command to charger
POST /api/ocpp/send
{
  "chargePointId": "JAAL34S021",
  "command": {
    "action": "RemoteStartTransaction",
    "connectorId": 1,
    "idTag": "user123"
  }
}

// Get connected chargers
GET /api/ocpp/chargers
// Returns: [{ chargePointId: "JAAL34S021", isConnected: true }]
```

### Backend Charger Endpoints

```typescript
// Create charger
POST /api/charger
{
  "chargePointId": "JAAL34S021",
  "serialNumber": "JAAL34S021",
  "vendor": "Siemens",
  "ipAddress": "192.168.10.143",  // Optional
  // ... other fields
}

// Update connection status (called by OCPP gateway)
PATCH /api/charger/connection-status
{
  "chargePointId": "JAAL34S021",
  "isConnected": true,
  "lastSeen": "2024-01-15T10:30:00Z"
}
```

## Summary

**IP addresses are optional for OCPP** but useful for management. Focus on:

1. ✅ **Unique chargePointId** (use serial number)
2. ✅ **Proper OCPP configuration** on the charger
3. ✅ **Secure WebSocket connection** (WSS in production)
4. ⚠️ **Store IP address** for diagnostics (optional)

The charger will connect TO your gateway, not the other way around. 