const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        require: true
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // Add retry logic
    retryDelay: 2000,
    maxRetries: 3
});

// Add connection test function
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Database connection test successful');
        client.release();
        return true;
    } catch (err) {
        console.error('Database connection test failed:', err.message);
        return false;
    }
};

pool.on('connect', () => {
    console.log('Connected to Supabase database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit process immediately, try to recover
    if (err.code === 'SASL_SIGNATURE_MISMATCH') {
        console.log('Attempting to reconnect...');
        testConnection();
    } else {
        process.exit(-1);
    }
});

const db = {
    query: async (text, params) => {
        try {
            const { rows } = await pool.query(text, params);
            return [rows];
        } catch (error) {
            console.error('Database query error:', error);
            // If it's a connection error, try to reconnect
            if (error.code === 'SASL_SIGNATURE_MISMATCH') {
                await testConnection();
            }
            throw error;
        }
    }
};

// Test connection on startup
testConnection();

module.exports = db;