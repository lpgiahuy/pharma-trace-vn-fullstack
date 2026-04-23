import pool from './src/config/db.js'; pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'').then(r => console.log(r.rows)).finally(() => pool.end());
