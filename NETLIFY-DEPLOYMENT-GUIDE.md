# Deploying to Netlify with Remote MySQL Database

## Overview
This guide explains how to deploy your Next.js project monitoring system to Netlify with a remote MySQL database.

## Prerequisites
- A deployed MySQL database accessible via the internet (e.g., PlanetScale, Railway, AWS RDS, Google Cloud SQL)
- Your application code pushed to a GitHub repository

## Step 1: Set Up Remote MySQL Database

### Option A: PlanetScale (Recommended)
1. Sign up at [PlanetScale](https://planetscale.com/)
2. Create a new database
3. Create a branch (e.g., `main`)
4. Connect using the connection string provided

### Option B: Railway
1. Sign up at [Railway](https://railway.app/)
2. Create a new project
3. Add a MySQL service
4. Get the connection details from the Variables tab

### Option C: Other Providers
Any cloud MySQL provider that gives you a public connection string will work.

### Option D: Hostinger (VPS/Dedicated Server)
1. Log in to your Hostinger control panel
2. Navigate to Databases section
3. Create a new MySQL database
4. Note down the database name, username, password, and hostname
5. Make sure the database user has proper permissions
6. If needed, configure remote access for your database user
7. Get the database connection details.

## Step 2: Configure Environment Variables in Netlify

In your Netlify dashboard:

1. Go to your site settings
2. Navigate to "Build & deploy" → "Environment"
3. Add the following environment variables:

```
MYSQL_HOST=your-database-host.com
MYSQL_PORT=3306
MYSQL_USER=your_database_username
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=your_database_name
JWT_SECRET=a_very_long_random_secret_string_for_jwt_tokens
NODE_ENV=production
```

## Step 3: Update Your Build Settings

In your Netlify `Settings` → `Build & deploy` → `Build command`, use:

```bash
npm run build
```

Or if using pnpm:

```bash
pnpm run build
```

## Step 4: Ensure Proper Database Connection Handling

The application has been configured to handle environment variables properly. Make sure your `lib/db.ts` file includes:

```typescript
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'project_monitoring',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

## Step 5: Deploy to Netlify

Connect your GitHub repository to Netlify and it will automatically build and deploy your application.

## Important Security Considerations

1. **Never expose database credentials in client-side code**
2. **Use strong passwords for database access**
3. **Restrict database access by IP if possible**
   - For Hostinger: You may need to whitelist Netlify's IP ranges
   - Common Netlify build IP ranges: 3.218.129.147, 3.218.131.174, 3.218.131.204, 52.202.10.239, 52.202.10.240
4. **Use SSL connections in production**
5. **Use a strong JWT secret**
6. **Regularly rotate your database credentials**
7. **For Hostinger specifically**: Make sure remote MySQL access is enabled in your hosting control panel

## Troubleshooting

### Connection Issues
- Verify your database allows connections from external sources
- Check firewall settings on your database provider
- Ensure SSL settings are configured correctly

### Hostinger-Specific Connection Issues
- Make sure remote MySQL access is enabled in your Hostinger control panel
- Verify that your database user has permissions for external connections
- Check if your hosting plan supports remote database connections
- You may need to add Netlify's IP addresses to your database access hosts list
- Hostinger sometimes restricts external connections by default, contact support if needed

### Environment Variables Not Working
- Confirm variables are set in Netlify dashboard (not in local `.env` files)
- Restart deployment after adding environment variables

### Build Errors
- Ensure all dependencies are properly installed
- Check that the build command matches your package.json scripts

## Alternative: Serverless Database Solutions

Consider using serverless database solutions like:
- PlanetScale (MySQL)
- Neon (PostgreSQL, compatible with MySQL)
- Vercel Postgres
- Supabase (PostgreSQL)

These solutions are designed to work better with serverless functions and avoid connection pooling issues.

## Database Migration

Remember to migrate your existing data to the new remote database:

1. Export your local database schema and data
2. Import to your remote database
3. Test the connection thoroughly

For schema migration, run the SQL scripts in the `scripts/` folder on your remote database.

### Hostinger Database Migration

For Hostinger specifically:
1. Use phpMyAdmin in your Hostinger control panel to import your database
2. Or use the MySQL command line tools if you have SSH access
3. Make sure to run all the SQL migration scripts in the `scripts/` folder:
   - `001-create-schema.sql`
   - `002-row-level-security.sql`
   - `003-seed-districts.sql`
   - `004-create-profile-trigger.sql`
   - `005-storage-bucket.sql`