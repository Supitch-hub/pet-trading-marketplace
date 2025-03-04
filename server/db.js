const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', () => {
    console.log('Connected to Supabase database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const db = {
    query: async (text, params) => {
        try {
            const { rows } = await pool.query(text, params);
            console.log('Query executed:', text, params);
            return [rows];
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }
};

module.exports = db;