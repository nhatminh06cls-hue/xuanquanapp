const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.okeemagxgofgepmjfpyr',
  password: 'XuanQuan@2026!',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  console.log('📋 Bảng trong DB:');
  res.rows.forEach(r => console.log('  ✅', r.tablename));

  const cats = await client.query("SELECT name, icon FROM public.categories");
  console.log('\n🌸 Danh mục sản phẩm:');
  cats.rows.forEach(r => console.log(`  ${r.icon} ${r.name}`));

  await client.end();
}
run().catch(console.error);
