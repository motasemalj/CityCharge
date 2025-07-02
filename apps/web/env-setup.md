# Environment Variables Setup

✅ **COMPLETED**: A `.env.local` file has been created in the `apps/web` directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:43219
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibW90YXNlbTk4IiwiYSI6ImNtY2FsOTF4dDA0YjEycnI5MWk0dWhmanEifQ.sCrxzxaF0a7HmQAMdfUzDg
```

The hardcoded environment variables have been removed from `next.config.ts` and moved to the `.env.local` file for better security and configuration management.

## Environment Variables Reference

- `NEXT_PUBLIC_API_URL`: Backend API URL (currently set to localhost:43219)
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox access token for map functionality

## Getting a New Mapbox Token (Optional)

If you need to replace the current token:

1. Sign up for a free account at https://mapbox.com
2. Go to your account settings
3. Create a new access token
4. Replace the token value in `.env.local` 