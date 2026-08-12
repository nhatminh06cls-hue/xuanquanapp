const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.okeemagxgofgepmjfpyr',
  password: 'XuanQuan@2026!',
  ssl: { rejectUnauthorized: false },
});

// Drop schema cũ rồi tạo mới hoàn toàn
const resetSQL = `
-- Xóa toàn bộ tables cũ (nếu có)
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.plants CASCADE;
DROP TABLE IF EXISTS public.garden_managers CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.inventory_logs CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.gardens CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.inventory_action CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.payment_method CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.order_type CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.decrement_stock_on_order CASCADE;
`;

const schemaSQL = fs.readFileSync('./supabase_schema.sql', 'utf8');

async function run() {
  try {
    await client.connect();
    console.log('✅ Kết nối OK. Đang reset schema...');

    await client.query(resetSQL);
    console.log('🗑️  Đã xóa tables cũ');

    await client.query(schemaSQL);
    console.log('✅ Schema mới đã tạo xong!');

    const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    console.log('\n📋 Bảng trong DB:');
    res.rows.forEach(r => console.log('  ✅', r.tablename));

    const cats = await client.query("SELECT name, icon FROM public.categories ORDER BY name");
    console.log('\n🌸 Danh mục:');
    cats.rows.forEach(r => console.log(`  ${r.icon} ${r.name}`));

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await client.end();
  }
}
run();
