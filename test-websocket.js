const WebSocket = require('ws');

const ws = new WebSocket('wss://ocpp-server-production.up.railway.app/ocpp/');

ws.on('open', function open() {
  console.log('✅ WebSocket connection opened successfully!');
  console.log('Connected to: wss://ocpp-server-production.up.railway.app/ocpp/');
  
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