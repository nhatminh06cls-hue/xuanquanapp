const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.okeemagxgofgepmjfpyr',
  password: 'XuanQuan@2026!',
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  await client.connect();
  console.log('🌱 Bắt đầu seed dữ liệu mẫu...');

  // 1. Tạo profile vendor giả (bypass auth.users trigger)
  await client.query(`
    INSERT INTO auth.users (id, email, role, created_at, updated_at, raw_user_meta_data)
    VALUES 
      ('00000000-0000-0000-0000-000000000001', 'vuon1@xuanquan.vn', 'authenticated', NOW(), NOW(), '{"full_name": "Vườn Hồng Đức"}'),
      ('00000000-0000-0000-0000-000000000002', 'vuon2@xuanquan.vn', 'authenticated', NOW(), NOW(), '{"full_name": "Vườn Bích Ngọc"}'),
      ('00000000-0000-0000-0000-000000000003', 'vuon3@xuanquan.vn', 'authenticated', NOW(), NOW(), '{"full_name": "Vườn Minh Tuấn"}')
    ON CONFLICT (id) DO NOTHING;
  `);

  await client.query(`
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES
      ('00000000-0000-0000-0000-000000000001', 'vendor', 'Vườn Hồng Đức', '0912111001'),
      ('00000000-0000-0000-0000-000000000002', 'vendor', 'Vườn Bích Ngọc', '0912111002'),
      ('00000000-0000-0000-0000-000000000003', 'vendor', 'Vườn Minh Tuấn', '0912111003')
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('✅ Profiles vendor');

  // 2. Tạo gardens
  const gardenRes = await client.query(`
    INSERT INTO public.gardens (id, owner_id, name, description, address, ward, phone, lat, lng, is_open, rating, review_count)
    VALUES
      ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
       'Vườn Hồng Đức', 'Chuyên hoa hồng cao cấp nhập khẩu và nội địa. Hơn 200 giống hoa hồng đặc sắc.',
       'Thôn Xuân Quan, Văn Giang, Hưng Yên', 'Xuân Quan', '0912111001',
       20.9892, 105.9312, true, 4.8, 127),
      ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
       'Vườn Bích Ngọc', 'Hoa chậu, hoa thảm đủ màu sắc. Cung cấp số lượng lớn cho công trình.',
       'Thôn Xuân Quan, Văn Giang, Hưng Yên', 'Xuân Quan', '0912111002',
       20.9901, 105.9298, true, 4.6, 89),
      ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
       'Vườn Minh Tuấn', 'Cây cảnh phong thủy, cây nội thất, lan hồ điệp cao cấp.',
       'Thôn Xuân Quan, Văn Giang, Hưng Yên', 'Xuân Quan', '0912111003',
       20.9878, 105.9325, true, 4.7, 203)
    ON CONFLICT (id) DO NOTHING
    RETURNING id;
  `);
  console.log('✅ Gardens:', gardenRes.rowCount);

  // 3. Lấy category IDs
  const catRes = await client.query('SELECT id, slug FROM public.categories');
  const cats = {};
  catRes.rows.forEach(r => cats[r.slug] = r.id);

  // 4. Seed products
  await client.query(`
    INSERT INTO public.products 
      (garden_id, category_id, name, description, unit, retail_price, original_price, allow_wholesale, wholesale_price, wholesale_min_qty, stock_quantity, low_stock_threshold, images, rating, review_count, sold_count)
    VALUES
      -- Vườn Hồng Đức
      ('10000000-0000-0000-0000-000000000001', '${cats['hoa-hong']}',
       'Hoa Hồng Ecuador Đỏ Nhung', 'Hoa hồng Ecuador nhập khẩu, cành dài 60-80cm, bông to, màu đỏ nhung sang trọng. Tươi 7-10 ngày.',
       'bó 20 cành', 280000, 350000, true, 220000, 5, 45, 10,
       ARRAY['https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&q=80'],
       4.9, 45, 312),
      ('10000000-0000-0000-0000-000000000001', '${cats['hoa-hong']}',
       'Hoa Hồng Môn Vàng', 'Hoa hồng màu vàng champagne, hương thơm nhẹ, phù hợp trang trí nội thất.',
       'bó 10 cành', 180000, null, false, null, null, 32, 8,
       ARRAY['https://images.unsplash.com/photo-1559003377-a8c9f3f25698?w=400&q=80'],
       4.7, 23, 187),
      ('10000000-0000-0000-0000-000000000001', '${cats['hoa-chau-hoa-tham']}',
       'Hoa Hồng Chậu Leo Sân Vườn', 'Hồng leo cổ điển, thích hợp làm giàn leo ban công, sân vườn. Hoa nở quanh năm.',
       'chậu', 450000, 520000, true, 380000, 3, 18, 5,
       ARRAY['https://images.unsplash.com/photo-1591757261971-52f7693c4f0b?w=400&q=80'],
       4.8, 67, 234),
      
      -- Vườn Bích Ngọc
      ('10000000-0000-0000-0000-000000000002', '${cats['hoa-chau-hoa-tham']}',
       'Hoa Cúc Vàng Chậu Mini', 'Cúc vàng chậu nhỏ xinh, thích hợp để bàn làm việc hoặc ban công.',
       'chậu', 65000, 80000, true, 52000, 10, 78, 15,
       ARRAY['https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=400&q=80'],
       4.5, 112, 567),
      ('10000000-0000-0000-0000-000000000002', '${cats['hoa-chau-hoa-tham']}',
       'Hoa Dạ Yên Thảo Mix Màu', 'Hoa thảm nhiều màu sắc rực rỡ, thích hợp trồng thảm sân vườn hay ban công.',
       'khay 9 cây', 95000, null, true, 78000, 5, 56, 10,
       ARRAY['https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=400&q=80'],
       4.6, 78, 423),
      ('10000000-0000-0000-0000-000000000002', '${cats['cay-cong-trinh']}',
       'Cây Sanh Thế Bonsai', 'Cây sanh thế nghệ thuật, tuổi đời 5-7 năm, phù hợp trang trí văn phòng, phòng khách.',
       'cây', 1850000, 2200000, false, null, null, 5, 2,
       ARRAY['https://images.unsplash.com/photo-1599598425947-5202edd56bdb?w=400&q=80'],
       4.9, 34, 28),
      
      -- Vườn Minh Tuấn
      ('10000000-0000-0000-0000-000000000003', '${cats['cay-phong-thuy']}',
       'Lan Hồ Điệp Trắng 2 Cành', 'Lan hồ điệp trắng thuần khiết, 2 cành 8-12 nụ. Thích hợp làm quà tặng, trang trí.',
       'chậu', 380000, 450000, false, null, null, 23, 5,
       ARRAY['https://images.unsplash.com/photo-1593691509543-c55fb32e8de7?w=400&q=80'],
       4.9, 156, 892),
      ('10000000-0000-0000-0000-000000000003', '${cats['cay-phong-thuy']}',
       'Cây Kim Tiền Vàng', 'Cây phong thủy may mắn, lá tròn bóng mượt, sinh trưởng tốt trong nhà.',
       'chậu', 120000, null, true, 95000, 5, 67, 10,
       ARRAY['https://images.unsplash.com/photo-1622673902165-4a9df39f44f2?w=400&q=80'],
       4.6, 89, 445),
      ('10000000-0000-0000-0000-000000000003', '${cats['cay-day-leo']}',
       'Dây Leo Hoa Giấy Tím', 'Hoa giấy tím Nhật Bản, leo giàn đẹp, hoa nở rực rỡ mùa khô.',
       'cây', 145000, 180000, true, 120000, 3, 41, 8,
       ARRAY['https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&q=80'],
       4.7, 67, 289)
    ON CONFLICT DO NOTHING;
  `);
  console.log('✅ Products seeded (9 sản phẩm)');

  const prodCount = await client.query('SELECT COUNT(*) FROM public.products');
  console.log(`\n📦 Tổng: ${prodCount.rows[0].count} sản phẩm`);
  console.log('\n🎉 Seed hoàn tất! App sẵn sàng sử dụng.');
  await client.end();
}

seed().catch(e => { console.error('❌', e.message); client.end(); });
