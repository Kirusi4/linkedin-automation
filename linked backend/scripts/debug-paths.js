const { Client } = require('pg');
async function check() {
    const client = new Client({
        user: 'postgres', host: 'localhost', database: 'linkedin_automation', password: '1974', port: 5432
    });
    try {
        await client.connect();
        const res = await client.query('SELECT id, "imagePath", status FROM post WHERE status = \'success\'');
        console.log('--- DB Data ---');
        res.rows.forEach(r => {
            console.log(`ID: ${r.id} | Status: ${r.status} | Path: [${r.imagePath}]`);
        });
    } catch (err) { console.error(err); } finally { await client.end(); }
}
check();
