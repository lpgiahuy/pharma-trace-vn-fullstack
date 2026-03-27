import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    max: 20,
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