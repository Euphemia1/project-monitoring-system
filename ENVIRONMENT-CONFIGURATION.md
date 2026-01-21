# Environment Configuration Guide

This guide explains how to configure your environment variables for different deployment scenarios.

## Local Development

For local development, copy the `.env.local` file which is already configured:

```
# Database Configuration for Local Development
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=project_monitoring
MYSQL_PORT=3306

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js Environment
NODE_ENV=development
```

## Production Deployment (Hostinger)

For production deployment on Hostinger, use the `.env.production` file:

```
# Database Configuration for Hostinger Production
MYSQL_HOST=localhost
MYSQL_USER=u754414236_efilling
MYSQL_PASSWORD=@Efilling.2026
MYSQL_DATABASE=u754414236_efilling
MYSQL_PORT=3306

# JWT Secret for authentication (strong secret for production)
JWT_SECRET=3a7b9c2d5e8f1a4b6c9d2e5f8a1b4c7d9e2f5a8b1c4d7e9f2a5b8c1d4e7f9a2b

# Next.js Environment
NODE_ENV=production
```

⚠️ **Important Security Note**: The JWT_SECRET above is provided as an example. For your actual production environment, you should generate a unique, strong secret key that is at least 64 characters long.

## How It Works

The application is configured to use environment variables with fallback defaults:

- `process.env.MYSQL_HOST || 'localhost'` - Uses the HOST environment variable or defaults to localhost
- `process.env.MYSQL_USER || 'root'` - Uses the USER environment variable or defaults to root
- `process.env.MYSQL_PASSWORD || ''` - Uses the PASSWORD environment variable or defaults to empty string
- `process.env.MYSQL_DATABASE || 'project_monitoring'` - Uses the DATABASE environment variable or defaults to project_monitoring
- `process.env.MYSQL_PORT || '3306'` - Uses the PORT environment variable or defaults to 3306

## Deployment Instructions

### For Local Development:
1. Use the `.env.local` file as-is for local development
2. Run `npm run dev` to start the development server

### For Hostinger Production:
1. Update your production server with the `.env.production` settings
2. Make sure to change the `JWT_SECRET` to a strong, unique value in production
3. Run `npm run build` followed by `npm start` to start the production server

## Security Notes

⚠️ **Important Security Recommendations:**

1. **Never commit `.env` files to version control** - they are already in `.gitignore`
2. **Change the JWT_SECRET** in production to a strong, random string
3. **Use strong passwords** for database access
4. **Regularly rotate credentials** in production
5. **Ensure your database user has minimal required permissions**

## Troubleshooting

### Connection Issues
- Verify that your database credentials are correct
- Check that the database server is running and accessible
- Ensure your database user has the necessary permissions

### Environment Variables Not Loading
- Make sure you're using the correct environment file for your deployment
- Verify that your hosting environment supports environment variables
- Check that the file is named correctly (`.env`, `.env.local`, `.env.production`, etc.)