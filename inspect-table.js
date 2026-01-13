const mysql = require('mysql2/promise');

async function run() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'project_monitoring'
    });
    const [rows] = await conn.execute('SHOW CREATE TABLE documents');
    console.log(rows[0]['Create Table']);
    await conn.end();
}
run().catch(console.error);
