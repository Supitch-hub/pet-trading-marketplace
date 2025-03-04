const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        require: true // บังคับใช้ SSL
    },
    max: 20, // จำนวน connection สูงสุด
    idleTimeoutMillis: 30000, // ปิด connection ถ้าว่างนานเกิน 30 วินาที
    connectionTimeoutMillis: 2000 // Timeout ถ้าเชื่อมต่อไม่ได้ใน 2 วินาที
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