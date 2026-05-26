-- =========================================================================
-- SCRIPT SQL UNTUK MEMBUAT TABEL ANTREAN KONSULTASI PPID DI SUPABASE
-- Salin dan jalankan script ini di menu "SQL Editor" pada dashboard Supabase Anda.
--
-- JIKA TABEL SUDAH ADA, CUKUP JALANKAN PERINTAH BERIKUT UNTUK UPDATE:
-- ALTER TABLE ws_ppid_consultations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
-- ALTER TABLE ws_ppid_consultations ADD COLUMN IF NOT EXISTS notes TEXT;
-- =========================================================================

-- 1. Membuat tabel ws_ppid_consultations
CREATE TABLE IF NOT EXISTS ws_ppid_consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL, -- Orang Tua / Calon Siswa / Umum
  phone VARCHAR(20) NOT NULL,
  topic VARCHAR(100) NOT NULL, -- Jalur Seleksi, Kendala Dokumen, SI Sekolah, Lainnya
  consultation_date DATE NOT NULL,
  session VARCHAR(100) NOT NULL, -- Sesi Pagi (08:00 - 12:00 WIB) / Sesi Siang (13:00 - 14:30 WIB)
  queue_number VARCHAR(10) NOT NULL, -- A-01, A-02, B-01, dst.
  status VARCHAR(20) DEFAULT 'Pending' NOT NULL, -- Pending, Calling, Completed, No Show
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT
);

-- 2. Membuat index untuk performa pencarian antrean real-time per tanggal & sesi
CREATE INDEX IF NOT EXISTS idx_ppid_date_session ON ws_ppid_consultations(consultation_date, session);

-- 3. Mengatur RLS (Row Level Security) agar tabel dapat diakses
-- Catatan: Untuk kemudahan integrasi SPMB saat ini, pastikan kebijakan akses RLS dikonfigurasi sesuai kebutuhan keamanan Anda.
ALTER TABLE ws_ppid_consultations ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses (Policies)
-- Kebijakan 1: Memperbolehkan siapa saja untuk memasukkan data baru (INSERT)
CREATE POLICY "Allow public insert for ppid consultations" 
ON ws_ppid_consultations FOR INSERT 
WITH CHECK (true);

-- Kebijakan 2: Memperbolehkan siapa saja membaca data (SELECT) untuk mengecek jumlah antrean sesi
CREATE POLICY "Allow public read for ppid consultations" 
ON ws_ppid_consultations FOR SELECT 
USING (true);

-- Kebijakan 3: Memperbolehkan admin melakukan update/delete (ALL)
-- Jika Anda menggunakan Service Role Key / API Key Admin pada backend, bypass RLS otomatis aktif.
CREATE POLICY "Allow all actions for admin" 
ON ws_ppid_consultations FOR ALL 
USING (true) 
WITH CHECK (true);
