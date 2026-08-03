-- ========================================================================================
-- SCRIPT: Aktifkan Row-Level Security (RLS) di Supabase
-- Tujuan: Mengunci database agar 'anon' (publik) tidak bisa sembarangan baca/tulis data
-- ========================================================================================

-- 1. AKTIFKAN RLS PADA TABEL INTI
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES UNTUK PROFILES (Hanya pemilik yang bisa akses profilnya sendiri)
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. POLICIES UNTUK ORDERS (Pelanggan hanya bisa melihat & membuat pesanannya sendiri)
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" 
ON orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" 
ON orders FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. POLICIES UNTUK PAYMENTS (Akses melalui relasi order_id)
CREATE POLICY "Users can view own payments" 
ON payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = payments.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- 5. POLICIES UNTUK PRODUCTS (Semua orang bisa melihat produk)
-- (Catatan: Aksi Create/Update/Delete produk di admin panel akan menggunakan SERVICE_ROLE key yang mem-bypass RLS, jadi tidak perlu didefinisikan di sini).
CREATE POLICY "Public products are viewable by everyone" 
ON products FOR SELECT 
USING (true);
