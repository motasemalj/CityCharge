// Test OCPP WebSocket connection
// Usage: node test-websocket.js [CHARGER_ID]
// Example: node test-websocket.js MY_CHARGER_001

const WebSocket = require('ws');

const chargerId = process.argv[2] || 'TEST_CHARGER_001';
const ws = new WebSocket(`wss://ocpp-server-production.up.railway.app/ocpp/${chargerId}`);

ws.on('open', function open() {
  console.log('✅ WebSocket connection opened successfully!');
  console.log(`Connected as charger: ${chargerId}`);
  
  // Send a test OCPP message
  const testMessage = {
    messageTypeId: 2,
    messageId: "test123",
    action: "Heartbeat",
    payload: {}
  };
  
  ws.send(JSON.stringify(testMessage));
  console.log('📤 Sent test message:', testMessage);
});

ws.on('message', function message(data) {
  console.log('📥 Received message:', data.toString());
});

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed');
  process.exit(0);
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
  process.exit(1);
});

// Close connection after 5 seconds
setTimeout(() => {
  ws.close();
}, 5000); 