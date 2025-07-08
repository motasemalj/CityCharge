# Backend Environment Variables

## Required Environment Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string

### OCPP Gateway Integration
- `OCPP_GATEWAY_URL` - URL of the deployed OCPP gateway
  - **Production**: `https://ocpp-server-production.up.railway.app`
  - **Development**: `http://localhost:3001`

- `OCPP_GATEWAY_JWT` - JWT secret for OCPP gateway authentication
  - **Must match the JWT_SECRET in the OCPP gateway deployment**
  - **Default**: `supersecret` (change in production)

### JWT Authentication (for user auth)
- `JWT_SECRET` - Secret for user authentication tokens
- `JWT_EXPIRES_IN` - Token expiration time (default: 1h)

### Stripe (Payment Processing)
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret

## Example .env file

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# OCPP Gateway
OCPP_GATEWAY_URL=https://ocpp-server-production.up.railway.app
OCPP_GATEWAY_JWT=your-shared-jwt-secret

# Authentication
JWT_SECRET=your-user-auth-secret
JWT_EXPIRES_IN=1h

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Railway Deployment

Make sure these environment variables are set in your Railway backend service:

1. Go to your Railway project
2. Select the backend service
3. Go to Variables tab
4. Add the required environment variables listed above 