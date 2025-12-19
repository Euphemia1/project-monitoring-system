const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupDatabase() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    console.log('Connected to MySQL server');

    // Create database
    await connection.query('CREATE DATABASE IF NOT EXISTS project_monitoring');
    console.log('Database created successfully');

    // Use database
    await connection.query('USE project_monitoring');

    // Read schema file
    const schema = fs.readFileSync('./mysql-schema.sql', 'utf8');
    
    // Execute schema
    await connection.query(schema);
    console.log('Schema executed successfully');

    // Close connection
    await connection.end();
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();