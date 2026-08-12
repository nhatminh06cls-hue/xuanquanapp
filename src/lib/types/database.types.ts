/**
 * Types tương ứng với database schema Supabase
 * Cập nhật file này khi thay đổi schema
 * (hoặc dùng `supabase gen types typescript` để auto-gen)
 */

export type UserRole = 'customer' | 'vendor' | 'admin';
export type OrderType = 'retail' | 'wholesale';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'e_wallet';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type InventoryAction = 'sale' | 'restock' | 'adjustment';

// ── PROFILES ──────────────────────────────────────────────
export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── GARDENS ───────────────────────────────────────────────
export interface Garden {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  address: string;
  ward: string | null;
  phone: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  lat: number | null;
  lng: number | null;
  is_open: boolean;
  rating: number;
  review_count: number;
  follower_count: number;
  created_at: string;
  updated_at: string;
}

// ── CATEGORIES ────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
}

// ── PRODUCTS ──────────────────────────────────────────────
export interface Product {
  id: string;
  garden_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  unit: string;
  retail_price: number;
  original_price: number | null;
  allow_wholesale: boolean;
  wholesale_price: number | null;
  wholesale_min_qty: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  images: string[];
  is_active: boolean;
  rating: number;
  review_count: number;
  sold_count: number;
  created_at: string;
  updated_at: string;
  // Relations (khi join)
  garden?: Garden;
  category?: Category;
}

// ── ORDERS ────────────────────────────────────────────────
export interface Order {
  id: string;
  customer_id: string;
  garden_id: string;
  order_type: OrderType;
  status: OrderStatus;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  shipping_provider: string | null;
  tracking_code: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  order_items?: OrderItem[];
  garden?: Garden;
  customer?: Profile;
}

// ── ORDER ITEMS ───────────────────────────────────────────
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  is_wholesale: boolean;
  quantity: number;
  subtotal: number;
  product_image: string | null;
  // Relations
  product?: Product;
}

// ── INVENTORY LOGS ────────────────────────────────────────
export interface InventoryLog {
  id: string;
  product_id: string;
  garden_id: string;
  action: InventoryAction;
  quantity: number;
  unit_cost: number | null;
  reference_id: string | null;
  note: string | null;
  created_at: string;
}

// ── REVIEWS ───────────────────────────────────────────────
export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  order_id: string | null;
  rating: number;
  content: string | null;
  created_at: string;
  // Relations
  customer?: Profile;
}

// ── FAVORITES ─────────────────────────────────────────────
export interface Favorite {
  customer_id: string;
  garden_id: string;
  created_at: string;
  garden?: Garden;
}

// ── ADDRESSES ─────────────────────────────────────────────
export interface Address {
  id: string;
  customer_id: string;
  full_name: string;
  phone: string;
  address: string;
  is_default: boolean;
  created_at: string;
}

// ── CART (client-side only, không lưu DB) ─────────────────
export interface CartItem {
  product: Product;
  quantity: number;
  is_wholesale: boolean;
  unit_price: number;   // Giá áp dụng (lẻ hoặc sỉ)
}

export interface CartGroup {
  garden: Garden;
  items: CartItem[];
  subtotal: number;
}

// ── HELPER TYPES ──────────────────────────────────────────
export type ProductInsert = Omit<Product, 'id' | 'rating' | 'review_count' | 'sold_count' | 'created_at' | 'updated_at'>;
export type ProductUpdate = Partial<ProductInsert>;

export type OrderInsert = Omit<Order, 'id' | 'status' | 'payment_status' | 'tracking_code' | 'shipping_provider' | 'created_at' | 'updated_at'>;

// ── Supabase Database type (dùng với createClient<Database>) ──
export type Database = {
  public: {
    Tables: {
      profiles:       { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      gardens:        { Row: Garden; Insert: Omit<Garden, 'id' | 'rating' | 'review_count' | 'follower_count' | 'created_at' | 'updated_at'>; Update: Partial<Garden> };
      categories:     { Row: Category; Insert: Omit<Category, 'id'>; Update: Partial<Category> };
      products:       { Row: Product; Insert: ProductInsert; Update: ProductUpdate };
      orders:         { Row: Order; Insert: OrderInsert; Update: Partial<Order> };
      order_items:    { Row: OrderItem; Insert: Omit<OrderItem, 'id'>; Update: Partial<OrderItem> };
      inventory_logs: { Row: InventoryLog; Insert: Omit<InventoryLog, 'id' | 'created_at'>; Update: never };
      reviews:        { Row: Review; Insert: Omit<Review, 'id' | 'created_at'>; Update: Partial<Review> };
      favorites:      { Row: Favorite; Insert: Omit<Favorite, 'created_at'>; Update: never };
      addresses:      { Row: Address; Insert: Omit<Address, 'id' | 'created_at'>; Update: Partial<Address> };
    };
    Enums: {
      user_role:         UserRole;
      order_type:        OrderType;
      order_status:      OrderStatus;
      payment_method:    PaymentMethod;
      payment_status:    PaymentStatus;
      inventory_action:  InventoryAction;
    };
  };
};
