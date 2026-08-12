const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, 'supabase_schema.sql'), 'utf8');

// Supabase connection via transaction pooler (port 6543)
const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.okeemagxgofgepmjfpyr',
  password: 'XuanQuan@2026!',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    console.log('🔌 Đang kết nối Supabase...');
    await client.connect();
    console.log('✅ Kết nối thành công!');
    
    console.log('📦 Đang chạy schema SQL...');
    await client.query(sql);
    console.log('✅ Schema đã được tạo thành công!');
    
    // Verify
    const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    console.log('📋 Các bảng đã tạo:');
    res.rows.forEach(r => console.log('  -', r.tablename));
    
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    if (err.detail) console.error('   Detail:', err.detail);
  } finally {
    await client.end();
    console.log('🔌 Đã ngắt kết nối');
  }
}

run();
