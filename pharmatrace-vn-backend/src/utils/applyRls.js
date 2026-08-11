import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.ADMIN_DATABASE_URL || 'postgresql://postgres:HuyLe%40574406@localhost:5432/pharmatrace-vn-db?schema=public';

const pool = new Pool({ connectionString });

export async function applyRLS() {
    console.log('--- Applying Row Level Security (RLS) Policies ---');
    try {
        const sqlPath = path.join(__dirname, '../../../database/rls_policies.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        const client = await pool.connect();
        try {
            await client.query(sqlContent);
            console.log('[SUCCESS] RLS Policies applied successfully to PostgreSQL database!');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('[ERROR] Error applying RLS policies:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    applyRLS();
}
