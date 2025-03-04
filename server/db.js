const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // อนุญาตให้เชื่อมต่อโดยไม่ตรวจสอบ certificate (เหมาะกับ Supabase)
    }
});

const db = {
    query: async (text, params) => {
        try {
            const { rows } = await pool.query(text, params);
            return [rows];
        } catch (error) {
            console.error('Database query error:', error);
            throw error; // โยน error เพื่อให้ endpoint จัดการต่อ
        }
    }
};

module.exports = db;