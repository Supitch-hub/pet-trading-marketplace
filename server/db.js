const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const db = {
    query: async (text, params) => {
        const { rows } = await pool.query(text, params);
        return [rows]; // ปรับให้เข้ากับโค้ด MySQL เดิมที่คืน array
    }
};

module.exports = db;