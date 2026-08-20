import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

let connectionString = process.env.DATABASE_URL;
if (connectionString && process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
    connectionString = connectionString.replace(/@([^/:]+):/, `@${process.env.DB_HOST}:`);
}

const pool = new Pool({
    connectionString,
    // Fallback for local development if DATABASE_URL is not set
    user: connectionString ? undefined : process.env.DB_USER,
    password: connectionString ? undefined : process.env.DB_PASSWORD,
    host: connectionString ? undefined : process.env.DB_HOST,
    port: connectionString ? undefined : process.env.DB_PORT,
    database: connectionString ? undefined : process.env.DB_NAME,
    max: 20,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const connectToDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log('Đã kết nối thành công tới PostgreSQL');
        client.release();
    } catch (err) {
        console.error('Lỗi kết nối Database:', err.message);
        throw err;
    }
};

export default pool;