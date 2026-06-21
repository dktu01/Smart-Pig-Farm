-- ================================================================
-- MIGRATION: Tambahkan kolom user_email yang mungkin belum ada
-- Jalankan di Supabase Dashboard > SQL Editor
-- Script ini aman dijalankan berulang kali (IF NOT EXISTS)
-- ================================================================

-- Tambah user_email ke tabel kandang (jika belum ada)
ALTER TABLE public.kandang
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Tambah user_email ke tabel babi (jika belum ada)
ALTER TABLE public.babi
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Tambah user_email ke tabel sanitasi (jika belum ada)
ALTER TABLE public.sanitasi
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Tambah user_email ke tabel vaksinasi (jika belum ada)
ALTER TABLE public.vaksinasi
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Tambah user_email ke tabel reproduksi (jika belum ada)
ALTER TABLE public.reproduksi
  ADD COLUMN IF NOT EXISTS user_email TEXT;


-- ================================================================
-- Buat atau perbarui RLS Policy agar Multi-tenant bekerja benar
-- ================================================================

-- Drop dan buat ulang policy kandang
DROP POLICY IF EXISTS "Tenant access kandang" ON public.kandang;
CREATE POLICY "Tenant access kandang" ON public.kandang FOR ALL
  USING (user_email = coalesce(auth.jwt() ->> 'email', ''))
  WITH CHECK (user_email = coalesce(auth.jwt() ->> 'email', ''));

-- Drop dan buat ulang policy babi
DROP POLICY IF EXISTS "Tenant access babi" ON public.babi;
CREATE POLICY "Tenant access babi" ON public.babi FOR ALL
  USING (user_email = coalesce(auth.jwt() ->> 'email', ''))
  WITH CHECK (user_email = coalesce(auth.jwt() ->> 'email', ''));

-- Drop dan buat ulang policy sanitasi
DROP POLICY IF EXISTS "Tenant access sanitasi" ON public.sanitasi;
CREATE POLICY "Tenant access sanitasi" ON public.sanitasi FOR ALL
  USING (user_email = coalesce(auth.jwt() ->> 'email', ''))
  WITH CHECK (user_email = coalesce(auth.jwt() ->> 'email', ''));

-- Drop dan buat ulang policy vaksinasi
DROP POLICY IF EXISTS "Tenant access vaksinasi" ON public.vaksinasi;
CREATE POLICY "Tenant access vaksinasi" ON public.vaksinasi FOR ALL
  USING (user_email = coalesce(auth.jwt() ->> 'email', ''))
  WITH CHECK (user_email = coalesce(auth.jwt() ->> 'email', ''));

-- Drop dan buat ulang policy reproduksi
DROP POLICY IF EXISTS "Tenant access reproduksi" ON public.reproduksi;
CREATE POLICY "Tenant access reproduksi" ON public.reproduksi FOR ALL
  USING (user_email = coalesce(auth.jwt() ->> 'email', ''))
  WITH CHECK (user_email = coalesce(auth.jwt() ->> 'email', ''));

