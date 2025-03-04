const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    host: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'localhost', // ดึง hostname จาก URL
    port: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).port : 5432,
    user: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).username : undefined,
    password: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).password : undefined,
    database: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname.slice(1) : 'postgres'
});

const db = {
    query: async (text, params) => {
        try {
            const { rows } = await pool.query(text, params);
            return [rows];
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }
};

module.exports = db;