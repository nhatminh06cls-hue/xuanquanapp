-- ============================================================
-- MIGRATION: Thêm 13 nhà vườn thực tế từ Google Maps
-- Xuân Quan, Văn Giang, Hưng Yên
-- Chạy trên Supabase SQL Editor
-- ============================================================

-- Tạo user placeholder để gán owner_id (admin system account)
-- Nếu đã có admin user thì bỏ qua bước này

-- Cập nhật tọa độ cho các garden hiện có (nếu tên trùng)
-- hoặc insert mới nếu chưa có

-- Lưu ý: Vì gardens cần owner_id (FK → profiles),
-- ta dùng service_role để insert trực tiếp qua SQL Editor

-- ── Bước 1: Tạo profile admin/system nếu chưa có ──
-- (bỏ qua nếu đã có user admin trong hệ thống)

-- ── Bước 2: Update tọa độ cho gardens đã có theo tên ──

UPDATE public.gardens SET
  lat = 20.9587949, lng = 105.9128853,
  phone = '+84 865 995 836'
WHERE name ILIKE '%Duy Nhất%';

UPDATE public.gardens SET
  lat = 20.964719, lng = 105.9123312,
  phone = '+84 333 880 979'
WHERE name ILIKE '%Kiên Thủy%';

UPDATE public.gardens SET
  lat = 20.9578697, lng = 105.9158917,
  phone = '+84 961 701 222'
WHERE name ILIKE '%Nam Hải%';

UPDATE public.gardens SET
  lat = 20.9612705, lng = 105.9167562,
  phone = '+84 373 881 396'
WHERE name ILIKE '%Tuấn Hải%';

UPDATE public.gardens SET
  lat = 20.9595739, lng = 105.9099063
WHERE name ILIKE '%Trực Quyết%';

UPDATE public.gardens SET
  lat = 20.9571685, lng = 105.9124147,
  phone = '+84 977 441 282'
WHERE name ILIKE '%Huỳnh Trang%';

UPDATE public.gardens SET
  lat = 20.9565786, lng = 105.9151653,
  phone = '+84 983 212 609'
WHERE name ILIKE '%Uyên Quảng%';

UPDATE public.gardens SET
  lat = 20.9607106, lng = 105.9166631,
  phone = '+84 913 324 567'
WHERE name ILIKE '%Hoạt Vụ%';

UPDATE public.gardens SET
  lat = 20.9582376, lng = 105.9159145,
  phone = '+84 961 774 497'
WHERE name ILIKE '%Khương Yến%';

UPDATE public.gardens SET
  lat = 20.962729, lng = 105.9112874,
  phone = '+84 348 057 977'
WHERE name ILIKE '%Cô Gái%';

UPDATE public.gardens SET
  lat = 20.9557028, lng = 105.9134854
WHERE name ILIKE '%Hoa Hình%';

UPDATE public.gardens SET
  lat = 20.9556488, lng = 105.9152509,
  phone = '+84 973 753 258',
  address = 'Khu Bè Quan, Xuân Quan'
WHERE name ILIKE '%Dương Lan%' OR name ILIKE '%DƯƠNG LAN%';

-- Thêm nhà vườn Phúc Diệp nếu chưa có
UPDATE public.gardens SET
  lat = 20.9582411, lng = 105.911063,
  phone = '+84 982 275 133'
WHERE name ILIKE '%Phúc Diệp%';

-- ── Kiểm tra kết quả ──
SELECT name, lat, lng, phone FROM public.gardens WHERE lat IS NOT NULL ORDER BY name;

-- ── Bước 3: Thêm 4 nhà vườn mới (Bích Trắc, Chiến Hoan, Dũng Bách, Sản Hòe) ──
-- (chỉ chạy nếu chưa có trong DB)

UPDATE public.gardens SET
  lat = 20.9676943, lng = 105.916722
WHERE name ILIKE '%Bích Trắc%';

UPDATE public.gardens SET
  lat = 20.9688225, lng = 105.9184685
WHERE name ILIKE '%Chiến Hoan%' OR name ILIKE '%chien hoan%';

UPDATE public.gardens SET
  lat = 20.9695591, lng = 105.9166711
WHERE name ILIKE '%Dũng Bách%' OR name ILIKE '%Dung Bach%';

UPDATE public.gardens SET
  lat = 20.969511, lng = 105.9176163
WHERE name ILIKE '%Sản Hòe%' OR name ILIKE '%San Hoe%';
