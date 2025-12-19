-- Installation script for Project Monitoring System MySQL Database
-- This script will create the database and all necessary tables

-- Source the main schema file
SOURCE mysql-schema.sql;

-- Verification queries to confirm successful installation
SELECT 'Database installation completed successfully!' AS message;

SELECT COUNT(*) AS districts_count FROM districts;
SELECT COUNT(*) AS user_roles_count FROM user_roles;
SELECT COUNT(*) AS document_types_count FROM document_types;