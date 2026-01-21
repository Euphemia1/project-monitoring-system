# Deploying to Hostinger with Hostinger MySQL Database

## Overview
This guide explains how to deploy your Next.js project monitoring system to Hostinger with a MySQL database hosted on Hostinger.

## Prerequisites
- Hostinger hosting account (VPS, dedicated server, or shared hosting that supports Node.js)
- FTP/SFTP access or file manager access to your Hostinger account
- Database access through Hostinger control panel

## Step 1: Prepare Your Application for Hostinger Deployment

### Build Your Application
1. Build your Next.js application locally:
```bash
npm run build
```

2. Export as a static site (if using shared hosting without Node.js support):
```bash
npm run export
```

For a full Next.js application with API routes, you'll need a VPS or hosting plan that supports Node.js.

## Step 2: Upload Files to Hostinger

### Option A: Shared Hosting with Node.js Support
1. Upload your entire project files (excluding node_modules) to your Hostinger hosting directory via FTP
2. Or use the file manager in your Hostinger control panel

### Option B: VPS/Dedicated Server
1. SSH into your Hostinger VPS
2. Clone your repository or upload files using SCP
3. Install dependencies:
```bash
npm install
```

## Step 3: Set Up Database on Hostinger

1. Log in to your Hostinger control panel
2. Navigate to the "Databases" section
3. Create a new MySQL database
4. Create a database user and assign it to your database
5. Note down:
   - Database name
   - Username
   - Password
   - Hostname (usually localhost or something like mysql.hostinger.com)

## Step 4: Configure Environment Variables

Create a `.env` file in your project root on the Hostinger server with the following (using your specific Hostinger database details):

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=u754414236_efilling
MYSQL_PASSWORD=@Efilling.2026
MYSQL_DATABASE=u754414236_efilling
JWT_SECRET=3a7b9c2d5e8f1a4b6c9d2e5f8a1b4c7d9e2f5a8b1c4d7e9f2a5b8c1d4e7f9a2b
NODE_ENV=production
```

⚠️ **Important Security Note**: The JWT_SECRET above is a sample. For production, generate a unique, strong secret key that is at least 32 characters long.

## Step 5: Database Migration

1. Access your Hostinger database using phpMyAdmin in the control panel
2. Create the required tables by running the SQL scripts in the `scripts/` folder:
   - `001-create-schema.sql`
   - `002-row-level-security.sql`
   - `003-seed-districts.sql`
   - `004-create-profile-trigger.sql`
   - `005-storage-bucket.sql`

Alternatively, you can run these scripts via command line if you have SSH access:
```bash
mysql -u your_username -p your_database_name < scripts/001-create-schema.sql
mysql -u your_username -p your_database_name < scripts/002-row-level-security.sql
# ... and so on for other scripts
```

## Step 6: Configure Node.js Application (VPS/Dedicated Server)

If using VPS or a hosting plan with Node.js support:

1. Navigate to your project directory
2. Install PM2 for process management:
```bash
npm install -g pm2
```

3. Start your application:
```bash
pm2 start npm --name "project-monitoring" -- run start
```

4. Set up auto-start on reboot:
```bash
pm2 startup
pm2 save
```

## Step 7: Configure Domain and SSL

1. In your Hostinger control panel, point your domain to your application
2. Enable SSL certificate for your domain
3. If using a reverse proxy, configure it to forward requests to your Node.js application

## Step 8: Set Up Process Management (VPS/Dedicated Server)

For production deployment on a VPS, use a process manager:

```bash
# Install PM2 globally
npm install -g pm2

# Start your application
pm2 start npm --name "project-monitoring" -- run start

# Save the process list
pm2 save

# Set PM2 to start on boot
pm2 startup
```

## Important Considerations for Hostinger

### Performance Optimization
- Optimize your database queries
- Use connection pooling (already configured in the app)
- Implement caching where appropriate

### Security
- Change your JWT secret to a strong, random string
- Regularly update your application dependencies
- Monitor database access logs
- Use strong passwords for database users

### Database Connection Settings
Your application is already configured to handle Hostinger's database connections:
- Connection pooling is enabled
- SSL is configured for production
- Timeouts are properly set

### Troubleshooting Common Issues

#### Application Won't Start
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check file permissions

#### Database Connection Issues
- Ensure the database user has proper permissions
- Verify database credentials in your .env file
- Check if your hosting plan supports external database connections
- Make sure the database server is running

#### Build Issues
- Ensure you have enough disk space
- Check Node.js and npm versions
- Verify all required build tools are installed

## Alternative: Using Subdomain for API

If you're having issues with the monolithic deployment, consider:

1. Deploy the frontend as a static site
2. Deploy the API as a separate Node.js application on a subdomain (api.yourdomain.com)
3. Configure CORS appropriately in your Next.js application

## Maintenance

Regular maintenance tasks:
- Backup your database regularly
- Update application dependencies
- Monitor application logs
- Scale database connections based on traffic

## Support

If you encounter issues with your Hostinger deployment:
- Check Hostinger's documentation for Node.js applications
- Contact Hostinger support about database connectivity
- Verify that your hosting plan supports the required features