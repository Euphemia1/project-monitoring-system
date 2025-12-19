# MySQL Database Setup for Project Monitoring System

This guide explains how to set up the MySQL database for the Project Monitoring System.

## Prerequisites

1. MySQL Server 8.0 or higher installed
2. MySQL client or command-line tool
3. Appropriate permissions to create databases and tables

## Database Schema

The database schema includes the following tables:
- `districts` - Zambian districts
- `user_roles` - User role definitions
- `users` - User accounts and profiles
- `projects` - Project information
- `project_sections` - Sections within projects
- `trades` - Trades within sections
- `progress_reports` - Progress reporting data
- `trade_progress` - Detailed trade progress
- `document_types` - Types of documents
- `documents` - Document storage information

## Installation Steps

1. **Connect to MySQL Server:**
   ```bash
   mysql -u root -p
   ```

2. **Run the installation script:**
   ```sql
   SOURCE install-mysql-db.sql;
   ```

   Alternatively, you can run the schema directly:
   ```sql
   SOURCE mysql-schema.sql;
   ```

3. **Verify Installation:**
   After running the script, you should see output showing the counts of seeded data:
   - 10 districts
   - 4 user roles
   - 12 document types

## Database Connection Configuration

To connect your application to the MySQL database, you'll need to configure your connection string with:
- Host: localhost (or your MySQL server host)
- Port: 3306 (default MySQL port)
- Database: project_monitoring
- Username: Your MySQL username
- Password: Your MySQL password

## Notes

- The schema uses foreign key constraints to maintain data integrity
- Timestamps are automatically managed with `created_at` and `updated_at` fields
- Indexes are created on frequently queried columns for better performance
- The schema includes sample data for districts, user roles, and document types

## Troubleshooting

If you encounter any issues during installation:

1. Ensure MySQL server is running
2. Check that you have sufficient privileges to create databases and tables
3. Verify that the SQL syntax is compatible with your MySQL version
4. Make sure there are no existing tables with the same names (or drop them first)

For any errors, check the MySQL error log for more detailed information.