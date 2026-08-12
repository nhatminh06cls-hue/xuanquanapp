-- Thêm 2 cột câu chuyện vào bảng gardens
-- Chạy trên Supabase SQL Editor
ALTER TABLE public.gardens
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS story   TEXT,
  ADD COLUMN IF NOT EXISTS open_hours TEXT,
  ADD COLUMN IF NOT EXISTS specialty TEXT;

COMMENT ON COLUMN public.gardens.tagline IS 'Slogan ngắn của vườn, ví dụ: "Ba thế hệ gắn bó với hoa"';
COMMENT ON COLUMN public.gardens.story   IS 'Câu chuyện dài hơn về lịch sử, con người, đam mê của vườn';
COMMENT ON COLUMN public.gardens.specialty IS 'Chuyên môn chính, ví dụ: "Chuyên hoa hồng nhập khẩu"';
COMMENT ON COLUMN public.gardens.open_hours IS 'Giờ mở cửa, ví dụ: "6:00 - 20:00 hàng ngày"';
