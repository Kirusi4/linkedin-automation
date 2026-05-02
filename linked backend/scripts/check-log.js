const { Client } = require('pg');
async function check() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'linkedin_automation',
        password: '1974',
        port: 5432
    });
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM post ORDER BY "createdAt" DESC LIMIT 5');
        res.rows.forEach(row => {
            console.log(`ID: ${row.id}, Status: ${row.status}, PostID: ${row.linkedinPostId}, Image: ${row.imagePath}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
check();
