import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Fallback for local development if DATABASE_URL is not set
    user: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
    password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
    host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
    port: process.env.DATABASE_URL ? undefined : process.env.DB_PORT,
    database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,
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