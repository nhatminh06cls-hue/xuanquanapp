-- ============================================================
-- APP LÀNG HOA XUÂN QUAN — DATABASE SCHEMA
-- Chạy toàn bộ file này trên Supabase SQL Editor
-- ============================================================

-- Bật extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. BẢNG PROFILES (mở rộng auth.users của Supabase)
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
  full_name   TEXT,
  phone       TEXT UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Thông tin người dùng mở rộng, liên kết với auth.users';

-- Trigger tự tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. BẢNG GARDENS (Nhà vườn)
-- ============================================================
CREATE TABLE public.gardens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  address       TEXT NOT NULL,
  ward          TEXT,                  -- Khu / Thôn
  phone         TEXT,
  avatar_url    TEXT,
  cover_url     TEXT,
  lat           DOUBLE PRECISION,      -- Tọa độ GPS
  lng           DOUBLE PRECISION,
  is_open       BOOLEAN NOT NULL DEFAULT TRUE,
  rating        NUMERIC(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count  INT DEFAULT 0,
  follower_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gardens IS 'Thông tin nhà vườn. Mỗi vendor có 1 garden.';

-- ============================================================
-- 3. BẢNG CATEGORIES (Danh mục hoa)
-- ============================================================
CREATE TABLE public.categories (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  TEXT NOT NULL UNIQUE,
  icon  TEXT,                  -- Emoji hoặc URL icon
  slug  TEXT NOT NULL UNIQUE
);

-- Seed dữ liệu danh mục mặc định
INSERT INTO public.categories (name, icon, slug) VALUES
  ('Hoa chậu - Hoa thảm', '🪴', 'hoa-chau-hoa-tham'),
  ('Cây công trình',      '🌳', 'cay-cong-trinh'),
  ('Các loại hoa hồng',  '🌹', 'hoa-hong'),
  ('Cây dây leo',         '🌿', 'cay-day-leo'),
  ('Cây phong thủy',      '🎍', 'cay-phong-thuy'),
  ('Các loại cỏ',         '🌾', 'cac-loai-co'),
  ('Cây & hoa khác',      '🍀', 'cay-hoa-khac');

-- ============================================================
-- 4. BẢNG PRODUCTS (Sản phẩm)
-- ============================================================
CREATE TABLE public.products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garden_id           UUID NOT NULL REFERENCES public.gardens(id) ON DELETE CASCADE,
  category_id         UUID REFERENCES public.categories(id),
  name                TEXT NOT NULL,
  description         TEXT,
  unit                TEXT NOT NULL DEFAULT 'chậu',  -- chậu, bó, cây, kg...
  
  -- Giá lẻ
  retail_price        NUMERIC(12,0) NOT NULL CHECK (retail_price >= 0),
  original_price      NUMERIC(12,0),                  -- Giá gốc (để hiện gạch ngang)
  
  -- Giá sỉ (nullable — chỉ bật khi allow_wholesale = true)
  allow_wholesale     BOOLEAN NOT NULL DEFAULT FALSE,
  wholesale_price     NUMERIC(12,0) CHECK (wholesale_price >= 0),
  wholesale_min_qty   INT CHECK (wholesale_min_qty > 0), -- Số lượng tối thiểu để áp giá sỉ
  
  -- Kho hàng
  stock_quantity      INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 10,         -- Ngưỡng cảnh báo sắp hết
  
  -- Media
  images              TEXT[] DEFAULT '{}',             -- Mảng URL ảnh (tối đa 5)
  
  -- Trạng thái
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadata
  rating              NUMERIC(3,2) DEFAULT 0,
  review_count        INT DEFAULT 0,
  sold_count          INT DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ràng buộc logic giá sỉ
  CONSTRAINT wholesale_fields_required CHECK (
    (allow_wholesale = FALSE) OR 
    (allow_wholesale = TRUE AND wholesale_price IS NOT NULL AND wholesale_min_qty IS NOT NULL)
  )
);

COMMENT ON TABLE public.products IS 'Sản phẩm hoa. Có cơ chế giá sỉ/lẻ riêng biệt.';
COMMENT ON COLUMN public.products.allow_wholesale IS 'Toggle bán sỉ. Khi TRUE bắt buộc có wholesale_price và wholesale_min_qty.';

-- ============================================================
-- 5. BẢNG ORDERS (Đơn hàng)
-- ============================================================
CREATE TYPE public.order_type AS ENUM ('retail', 'wholesale');
CREATE TYPE public.order_status AS ENUM (
  'pending',      -- Chờ xác nhận
  'confirmed',    -- Đã xác nhận
  'preparing',    -- Đang chuẩn bị hàng
  'shipping',     -- Đang giao (GHTK/GHN)
  'delivered',    -- Đã giao thành công
  'cancelled',    -- Đã hủy
  'refunded'      -- Đã hoàn tiền
);
CREATE TYPE public.payment_method AS ENUM ('cod', 'bank_transfer', 'e_wallet');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');

CREATE TABLE public.orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id         UUID NOT NULL REFERENCES public.profiles(id),
  garden_id           UUID NOT NULL REFERENCES public.gardens(id),
  
  -- Phân loại đơn
  order_type          public.order_type NOT NULL DEFAULT 'retail',
  status              public.order_status NOT NULL DEFAULT 'pending',
  
  -- Địa chỉ giao hàng (snapshot tại thời điểm đặt)
  delivery_name       TEXT NOT NULL,
  delivery_phone      TEXT NOT NULL,
  delivery_address    TEXT NOT NULL,
  
  -- Tài chính
  subtotal            NUMERIC(12,0) NOT NULL,   -- Tiền hàng
  shipping_fee        NUMERIC(12,0) DEFAULT 0,
  total_amount        NUMERIC(12,0) NOT NULL,   -- Tổng thanh toán
  
  -- Thanh toán
  payment_method      public.payment_method NOT NULL DEFAULT 'cod',
  payment_status      public.payment_status NOT NULL DEFAULT 'pending',
  
  -- Vận chuyển (chỉ cho đơn lẻ)
  shipping_provider   TEXT,            -- 'GHTK', 'GHN', 'Ahamove'
  tracking_code       TEXT,
  
  -- Ghi chú
  note                TEXT,
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.orders IS 'Đơn hàng. Tách theo từng garden. Đơn sỉ không auto-dispatch ship.';

-- ============================================================
-- 6. BẢNG ORDER_ITEMS (Chi tiết đơn hàng)
-- ============================================================
CREATE TABLE public.order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id),
  
  -- Snapshot giá tại thời điểm mua
  product_name    TEXT NOT NULL,
  unit_price      NUMERIC(12,0) NOT NULL,   -- Giá áp dụng (lẻ hoặc sỉ)
  is_wholesale    BOOLEAN NOT NULL DEFAULT FALSE,
  quantity        INT NOT NULL CHECK (quantity > 0),
  subtotal        NUMERIC(12,0) NOT NULL,
  
  -- Snapshot ảnh
  product_image   TEXT
);

-- ============================================================
-- 7. BẢNG INVENTORY_LOGS (Lịch sử kho — nền cho báo cáo thuế)
-- ============================================================
CREATE TYPE public.inventory_action AS ENUM ('sale', 'restock', 'adjustment');

CREATE TABLE public.inventory_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  garden_id     UUID NOT NULL REFERENCES public.gardens(id) ON DELETE CASCADE,
  action        public.inventory_action NOT NULL,
  quantity      INT NOT NULL,              -- Dương: nhập, Âm: xuất (bán)
  unit_cost     NUMERIC(12,0),             -- Giá nhập/xuất (cho báo cáo thuế)
  reference_id  UUID,                      -- order_id nếu là sale
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.inventory_logs IS 'Log mọi biến động kho. Dùng để tổng hợp báo cáo thuế tự động.';

-- ============================================================
-- 8. BẢNG REVIEWS (Đánh giá)
-- ============================================================
CREATE TABLE public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  order_id    UUID REFERENCES public.orders(id),
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, customer_id, order_id)
);

-- ============================================================
-- 9. BẢNG FAVORITES (Nhà vườn yêu thích)
-- ============================================================
CREATE TABLE public.favorites (
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  garden_id   UUID NOT NULL REFERENCES public.gardens(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (customer_id, garden_id)
);

-- ============================================================
-- 10. BẢNG ADDRESSES (Địa chỉ giao hàng đã lưu)
-- ============================================================
CREATE TABLE public.addresses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  address     TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — Tăng tốc query thường gặp
-- ============================================================
CREATE INDEX idx_products_garden_id   ON public.products(garden_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_active   ON public.products(is_active);
CREATE INDEX idx_orders_customer_id   ON public.orders(customer_id);
CREATE INDEX idx_orders_garden_id     ON public.orders(garden_id);
CREATE INDEX idx_orders_status        ON public.orders(status);
CREATE INDEX idx_orders_order_type    ON public.orders(order_type);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_inventory_logs_garden_id ON public.inventory_logs(garden_id);
CREATE INDEX idx_inventory_logs_created_at ON public.inventory_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Bật RLS cho tất cả bảng
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gardens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses       ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "Tự xem profile của mình" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Tự cập nhật profile của mình" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profile của vendor công khai để xem" ON public.profiles
  FOR SELECT USING (role = 'vendor');

-- ── GARDENS ──
CREATE POLICY "Garden công khai — ai cũng xem được" ON public.gardens
  FOR SELECT USING (TRUE);

CREATE POLICY "Vendor tạo garden của mình" ON public.gardens
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Vendor sửa garden của mình" ON public.gardens
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Vendor xóa garden của mình" ON public.gardens
  FOR DELETE USING (auth.uid() = owner_id);

-- ── CATEGORIES ──
CREATE POLICY "Categories công khai" ON public.categories
  FOR SELECT USING (TRUE);

-- ── PRODUCTS ──
CREATE POLICY "Sản phẩm active công khai" ON public.products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Vendor xem tất cả sản phẩm của mình (kể cả inactive)" ON public.products
  FOR SELECT USING (
    garden_id IN (SELECT id FROM public.gardens WHERE owner_id = auth.uid())
  );

CREATE POLICY "Vendor thêm sản phẩm vào garden của mình" ON public.products
  FOR INSERT WITH CHECK (
    garden_id IN (SELECT id FROM public.gardens WHERE owner_id = auth.uid())
  );

CREATE POLICY "Vendor sửa sản phẩm của mình" ON public.products
  FOR UPDATE USING (
    garden_id IN (SELECT id FROM public.gardens WHERE owner_id = auth.uid())
  );

CREATE POLICY "Vendor xóa sản phẩm của mình" ON public.products
  FOR DELETE USING (
    garden_id IN (SELECT id FROM public.gardens WHERE owner_id = auth.uid())
  );

-- ── ORDERS ──
CREATE POLICY "Khách xem đơn hàng của mình" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Vendor xem đơn hàng về garden của mình" ON public.orders
  FOR SELECT USING (
    garden_id IN (SELECT id FROM public.gardens WHERE owner_id = auth.uid())
  );

CREATE POLICY "Khách tạo đơn hàng" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Vendor cập nhật trạng thái đơn của mình" ON public.orders
  FOR UPDATE USING (
    garden_id IN (SELECT id FROM public.gardens WHERE owner_id = auth.uid())
  );

-- ── ORDER ITEMS ──
CREATE POLICY "Xem order items theo quyền xem order" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE customer_id = auth.uid()
         OR garden_id IN (SELECT id FROM public.gardens WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Tạo order items khi tạo đơn" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
  );

-- ── INVENTORY LOGS ──
CREATE POLICY "Vendor xem log kho của mình" ON public.inventory_logs
  FOR SELECT USING (
    garden_id IN (SELECT id FROM public.gardens WHERE owner_id = auth.uid())
  );

CREATE POLICY "Vendor ghi log kho" ON public.inventory_logs
  FOR INSERT WITH CHECK (
    garden_id IN (SELECT id FROM public.gardens WHERE owner_id = auth.uid())
  );

-- ── REVIEWS ──
CREATE POLICY "Reviews công khai" ON public.reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "Khách viết review của mình" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Khách sửa review của mình" ON public.reviews
  FOR UPDATE USING (auth.uid() = customer_id);

-- ── FAVORITES ──
CREATE POLICY "Khách xem favorites của mình" ON public.favorites
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Khách thêm/xóa favorites" ON public.favorites
  FOR ALL USING (auth.uid() = customer_id);

-- ── ADDRESSES ──
CREATE POLICY "Khách xem địa chỉ của mình" ON public.addresses
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Khách quản lý địa chỉ của mình" ON public.addresses
  FOR ALL USING (auth.uid() = customer_id);

-- ============================================================
-- FUNCTIONS / TRIGGERS hữu ích
-- ============================================================

-- Trigger updated_at tự động
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_gardens_updated_at BEFORE UPDATE ON public.gardens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function giảm stock khi tạo order (gọi sau khi insert order_items)
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - NEW.quantity,
      sold_count = sold_count + NEW.quantity
  WHERE id = NEW.product_id;

  -- Ghi inventory log
  INSERT INTO public.inventory_logs (product_id, garden_id, action, quantity, unit_cost, reference_id)
  SELECT NEW.product_id, p.garden_id, 'sale', -NEW.quantity, NEW.unit_price, NEW.order_id
  FROM public.products p WHERE p.id = NEW.product_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_order();
