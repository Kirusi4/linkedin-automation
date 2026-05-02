const { Client } = require('pg');

async function setup() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: '1974',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('Connected to postgres!');

        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'linkedin_automation'");
        if (res.rowCount === 0) {
            await client.query('CREATE DATABASE linkedin_automation');
            console.log('Database "linkedin_automation" created successfully!');
        } else {
            console.log('Database "linkedin_automation" already exists.');
        }
    } catch (err) {
        console.error('Error setting up database:', err.message);
    } finally {
        await client.end();
    }
}

setup();
