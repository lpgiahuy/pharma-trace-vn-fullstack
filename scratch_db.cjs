const { Client } = require('pg');

async function run() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'pharmachain',
    password: 'root',
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT tk.don_vi_id, dv.loai_don_vi, tk.so_luong_ton 
      FROM TonKho tk 
      JOIN DonVi dv ON tk.don_vi_id = dv.id 
      WHERE tk.duoc_pham_id = 9
    `);
    console.log('Stock for Product 9:', res.rows);
  } catch (err) {
    console.error('DB Error:', err);
  } finally {
    await client.end();
  }
}
run();
