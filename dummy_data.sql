-- Masukkan data Kandang
INSERT INTO kandang (id, nama_kandang, jenis_kandang, kapasitas) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'K-IND-01', 'Indukan', 10),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'K-PEJ-01', 'Pejantan', 5),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'K-ANAK-01', 'Anak', 30);

-- Masukkan data Babi (Referensi ke ID Kandang di atas)
INSERT INTO babi (id, kode_babi, jenis_kelamin, tanggal_lahir, kandang_id, status_kesehatan, status_reproduksi) VALUES
  ('11111111-1111-1111-1111-111111111111', 'IND-1001', 'Betina', '2025-01-15', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Sehat', 'Bunting'),
  ('22222222-2222-2222-2222-222222222222', 'IND-1002', 'Betina', '2025-02-20', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Sehat', 'Menyusui'),
  ('33333333-3333-3333-3333-333333333333', 'PEJ-5001', 'Jantan', '2024-11-10', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Sehat', 'Siap Kawin'),
  ('44444444-4444-4444-4444-444444444444', 'ANAK-3001', 'Jantan', '2026-05-01', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Sakit Ringan', 'Belum Kawin'),
  ('55555555-5555-5555-5555-555555555555', 'ANAK-3002', 'Betina', '2026-05-01', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Sehat', 'Belum Kawin');

-- Masukkan data Reproduksi
INSERT INTO reproduksi (babi_betina_id, babi_jantan_id, tanggal_kawin, status_bunting, estimasi_lahir) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '2026-03-01', true, '2026-06-23');

-- Masukkan data Kesehatan
INSERT INTO kesehatan (babi_id, tanggal_sakit, penyakit, obat_diberikan, status, catatan) VALUES
  ('44444444-4444-4444-4444-444444444444', '2026-06-05', 'Diare Ringan', 'Oralit Hewan', 'Ringan', 'Pantau nafsu makan');

-- Masukkan data Vaksinasi
INSERT INTO vaksinasi (babi_id, jenis_vaksin, tanggal_vaksin, tanggal_berikutnya, catatan) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Hog Cholera', '2026-05-15', '2026-08-15', 'Dosis 2ml'),
  ('55555555-5555-5555-5555-555555555555', 'Hog Cholera', '2026-05-15', '2026-08-15', 'Dosis 2ml');

-- Masukkan data Sanitasi
INSERT INTO sanitasi (kandang_id, tanggal_semprot, jenis_disinfektan, tanggal_berikutnya) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-06-01', 'Formades', '2026-06-15'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', '2026-06-01', 'Formades', '2026-06-15');
