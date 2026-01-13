const mysql = require('mysql2/promise');

async function fix() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'project_monitoring'
    });

    try {
        console.log('Finalizing schema sync...');
        const [columns] = await connection.query('SHOW COLUMNS FROM documents');
        const cols = columns.map(c => c.Field);

        async function addCol(name, definition) {
            if (!cols.includes(name)) {
                console.log(`Adding ${name}...`);
                await connection.query(`ALTER TABLE documents ADD COLUMN ${name} ${definition}`);
            }
        }

        // Add missing columns
        await addCol('description', 'TEXT');
        await addCol('size', 'INT');

        // Sync data if necessary
        if (cols.includes('file_size') && !cols.includes('size')) {
            // This won't happen because I just added size if missing, 
            // but if file_size has data, let's copy it.
        }

        if (cols.includes('file_size') && cols.includes('size')) {
            console.log('Syncing file_size to size...');
            await connection.query('UPDATE documents SET size = file_size WHERE size IS NULL');
        }

        console.log('Schema finalized!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

fix();
