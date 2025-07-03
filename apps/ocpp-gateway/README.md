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
PORT=3001                 # REST API port
WSS_PORT=3002            # WebSocket server port
JWT_SECRET=your-secret   # Authentication
BACKEND_URL=http://backend:3000

# For production, use WSS (secure WebSocket)
WSS_PORT=443             # Standard HTTPS port
USE_SSL=true
```

### Charger Connection URL Examples

Development:
```
ws://localhost:3002/ocpp/JAAL34S021
```

Production:
```
wss://your-ocpp-gateway.com/ocpp/JAAL34S021
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