const jwt = require('jsonwebtoken');

const secret = 'supersecret';

// Generate a token (like the backend does)
const token = jwt.sign(
  { 
    service: 'backend',
    timestamp: Date.now() 
  }, 
  secret, 
  { expiresIn: '1h' }
);

console.log('Generated token:', token);

// Verify the token (like the OCPP gateway does)
try {
  const decoded = jwt.verify(token, secret);
  console.log('✅ Token verified successfully:', decoded);
} catch (err) {
  console.error('❌ Token verification failed:', err.message);
}

// Test with wrong secret
try {
  const decoded = jwt.verify(token, 'wrong-secret');
  console.log('This should not print');
} catch (err) {
  console.log('✅ Correctly rejected token with wrong secret');
} 