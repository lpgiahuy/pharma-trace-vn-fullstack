const { Client } = require('pg');
const fs = require('fs');

async function restoreWindowsPostgres() {
  console.log('Connecting to PostgreSQL on 127.0.0.1:5432...');
  const client = new Client({
    connectionString: 'postgresql://postgres:HuyLe%40574406@127.0.0.1:5432/pharmatrace-vn-db',
  });
  await client.connect();

  console.log('Resetting schema public on 127.0.0.1:5432/pharmatrace-vn-db...');
  await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');

  // Ensure app_user exists and has rights
  try {
    await client.query("CREATE ROLE app_user WITH LOGIN PASSWORD 'HuyLe@574406' SUPERUSER;");
  } catch (e) {
    try {
      await client.query("ALTER ROLE app_user WITH LOGIN PASSWORD 'HuyLe@574406' SUPERUSER;");
    } catch (err) {}
  }
  await client.query('GRANT ALL ON SCHEMA public TO app_user; GRANT ALL ON SCHEMA public TO postgres;');

  console.log('Reading full legacy init.sql...');
  const rawSql = fs.readFileSync('D:/Personal/Project/pharma-trace-vn-fullstack/database/init.sql', 'utf8');

  // Filter out psql meta commands starting with \ (like \restrict)
  const cleanedLines = rawSql
    .split('\n')
    .filter(line => !line.trim().startsWith('\\'))
    .join('\n');

  console.log('Executing legacy SQL dump on Windows PostgreSQL...');
  await client.query(cleanedLines);

  console.log('Granting permissions to app_user...');
  await client.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;');
  await client.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;');
  await client.query('GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO app_user;');

  const duocPham = await client.query('SELECT count(*) FROM duocpham;');
  console.log('SUCCESS! duocpham count on localhost:5432:', duocPham.rows[0].count);

  const nhanVien = await client.query('SELECT count(*) FROM nhanvien;');
  console.log('SUCCESS! nhanvien count on localhost:5432:', nhanVien.rows[0].count);

  await client.end();
}

restoreWindowsPostgres().catch(console.error);
