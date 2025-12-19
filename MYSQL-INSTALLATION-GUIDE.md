# MySQL Database Installation Guide

This guide will help you set up the MySQL database for the Project Monitoring System.

## Prerequisites

Before installing the database, ensure you have:
1. MySQL Server 5.7 or higher installed
2. MySQL Command Line Client or a MySQL GUI tool (like MySQL Workbench)
3. Administrative access to create databases and tables

## Installation Steps

### Step 1: Connect to MySQL Server

Open your command prompt or terminal and connect to your MySQL server:

```bash
mysql -u root -p
```

Enter your MySQL root password when prompted.

### Step 2: Create and Use the Database

Run the following commands to create and select the database:

```sql
CREATE DATABASE IF NOT EXISTS project_monitoring;
USE project_monitoring;
```

### Step 3: Execute the Schema Script

Execute the provided MySQL schema script:

```sql
SOURCE mysql-schema.sql;
```

Alternatively, you can copy and paste the contents of the `mysql-schema.sql` file directly into your MySQL client.

### Step 4: Verify Installation

After running the script, verify that all tables were created successfully:

```sql
SHOW TABLES;
```

You should see the following tables:
- districts
- document_types
- documents
- progress_reports
- project_sections
- projects
- trade_progress
- trades
- user_roles
- users

Check that the initial data was inserted:

```sql
SELECT COUNT(*) FROM districts;      -- Should return 10
SELECT COUNT(*) FROM user_roles;     -- Should return 4
SELECT COUNT(*) FROM document_types; -- Should return 12
```

## Database Schema Overview

The database consists of 10 tables with the following relationships:

1. **districts** - Contains the 10 Zambian districts
2. **user_roles** - Defines user roles in the system
3. **users** - User accounts and profiles
4. **projects** - Project information
5. **project_sections** - Sections within projects
6. **trades** - Individual trades within sections
7. **progress_reports** - Progress reports for projects
8. **trade_progress** - Progress details for each trade
9. **document_types** - Types of documents that can be stored
10. **documents** - Document metadata and storage information

## Connection Configuration

To connect your application to this database, use the following configuration:
- Host: localhost (or your MySQL server IP)
- Port: 3306 (default MySQL port)
- Database: project_monitoring
- Username: Your MySQL username
- Password: Your MySQL password

## Troubleshooting

If you encounter any issues during installation:

1. **Permission Errors**: Ensure your MySQL user has CREATE and INSERT privileges
2. **Foreign Key Constraint Errors**: Make sure you're executing the schema in the correct order
3. **Syntax Errors**: Check that your MySQL version supports the syntax used in the schema

For additional help, consult the MySQL documentation or reach out to your database administrator.