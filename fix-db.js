const mysql = require('mysql2/promise');

async function fix() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'project_monitoring'
    });

    try {
        console.log('Detecting columns...');
        const [columns] = await connection.query('SHOW COLUMNS FROM documents');
        const cols = columns.map(c => c.Field);
        console.log('Current columns:', cols.join(', '));

        // Helper to add column if missing
        async function addCol(name, definition) {
            if (!cols.includes(name)) {
                console.log(`Adding ${name}...`);
                try {
                    await connection.query(`ALTER TABLE documents ADD COLUMN ${name} ${definition}`);
                } catch (e) {
                    console.error(`Failed to add ${name}:`, e.message);
                }
            }
        }

        await addCol('document_type', 'VARCHAR(100) DEFAULT "other_report" NOT NULL');
        await addCol('url', 'TEXT');
        await addCol('uploaded_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        await addCol('status', 'VARCHAR(20) DEFAULT "pending"');
        await addCol('action_required', 'TEXT');
        await addCol('action_assignee_id', 'INT');
        await addCol('action_status', 'VARCHAR(20) DEFAULT "pending"');
        await addCol('action_response', 'TEXT');
        await addCol('is_locked', 'BOOLEAN DEFAULT FALSE');

        // Rename file_path to url if url is empty
        if (cols.includes('file_path') && cols.includes('url')) {
            console.log('Mapping file_path to url...');
            await connection.query('UPDATE documents SET url = file_path WHERE url IS NULL OR url = ""');
        }

        // Map created_at to uploaded_at
        if (cols.includes('created_at') && cols.includes('uploaded_at')) {
            console.log('Mapping created_at to uploaded_at...');
            await connection.query('UPDATE documents SET uploaded_at = created_at WHERE uploaded_at IS NULL');
        }

        console.log('Fix complete!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

fix();
