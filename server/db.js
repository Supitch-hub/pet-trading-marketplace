const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root', // เปลี่ยนเป็น username ของคุณ
    password: 'Avaya_123', // เปลี่ยนเป็น password ของคุณ
    database: 'pet_trading'
});

module.exports = db;