const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        require: true
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    retryDelay: 2000,
    maxRetries: 5,
    // เพิ่มการตั้งค่าเพื่อบังคับใช้ IPv4
    family: 4
});

// เพิ่มฟังก์ชันทดสอบการเชื่อมต่อแบบละเอียด
const testConnection = async () => {
    let client;
    try {
        client = await pool.connect();
        await client.query('SELECT NOW()');
        console.log('เชื่อมต่อฐานข้อมูลสำเร็จ');
        return true;
    } catch (err) {
        console.error('เชื่อมต่อฐานข้อมูลล้มเหลว:', err.message);
        if (err.code === 'ENETUNREACH') {
            console.log('กำลังลองเชื่อมต่อใหม่ผ่าน IPv4...');
        }
        return false;
    } finally {
        if (client) {
            client.release();
        }
    }
};

pool.on('connect', () => {
    console.log('เชื่อมต่อกับ Supabase สำเร็จ');
});

pool.on('error', async (err) => {
    console.error('เกิดข้อผิดพลาดที่ client:', err);
    try {
        await testConnection();
    } catch (error) {
        console.error('ไม่สามารถเชื่อมต่อใหม่ได้:', error);
        process.exit(-1);
    }
});

const db = {
    query: async (text, params) => {
        let retries = 0;
        const maxRetries = 3;

        while (retries < maxRetries) {
            try {
                const { rows } = await pool.query(text, params);
                return [rows];
            } catch (error) {
                console.error(`การเชื่อมต่อล้มเหลว ครั้งที่ ${retries + 1}:`, error);
                retries++;
                if (retries === maxRetries) {
                    throw error;
                }
                // รอก่อนลองใหม่
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
};

// ทดสอบการเชื่อมต่อตอนเริ่มต้น
testConnection().catch(err => {
    console.error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', err);
    process.exit(1);
});

module.exports = db;