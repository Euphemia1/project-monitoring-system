const mysql = require('mysql2/promise');

async function clean() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'project_monitoring'
    });

    try {
        console.log('Cleaning up documents table...');

        // 1. Drop the legacy foreign key constraint
        try {
            console.log('Dropping legacy foreign key constraint documents_ibfk_3...');
            await connection.query('ALTER TABLE documents DROP FOREIGN KEY documents_ibfk_3');
        } catch (e) {
            console.log('Constraint documents_ibfk_3 not found or already dropped.');
        }

        // 2. Drop the legacy columns
        const columnsToDrop = ['document_type_id', 'file_path', 'file_size'];
        for (const col of columnsToDrop) {
            try {
                console.log(`Dropping column ${col}...`);
                await connection.query(`ALTER TABLE documents DROP COLUMN ${col}`);
            } catch (e) {
                console.log(`Column ${col} not found or already dropped.`);
            }
        }

        // 3. Ensure columns exist and have correct types (from mysql-schema.sql)
        console.log('Ensuring all columns match mysql-schema.sql...');

        // We already added these in previous steps, but let's make sure they are NOT NULL if required
        await connection.query('ALTER TABLE documents MODIFY COLUMN document_type VARCHAR(100) NOT NULL');
        await connection.query('ALTER TABLE documents MODIFY COLUMN url TEXT NOT NULL');
        await connection.query('ALTER TABLE documents MODIFY COLUMN title VARCHAR(255) NOT NULL');

        console.log('Cleanup complete!');
    } catch (err) {
        console.error('Error during cleanup:', err);
    } finally {
        await connection.end();
    }
}

clean();
