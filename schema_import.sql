-- =========================================================================
-- SCRIPT SQL UNTUK MENAMBAH KOLOM DATA DAPODIK PADA TABEL ws_accepted_students
-- Salin dan jalankan script ini di menu "SQL Editor" pada dashboard Supabase Anda.
-- =========================================================================

-- Tambah Kolom Data Pribadi & Alamat untuk Pre-fill
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS nik VARCHAR(20);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS no_kk VARCHAR(20);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS alamat_jalan TEXT;
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS rt VARCHAR(10);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS rw VARCHAR(10);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS dusun VARCHAR(100);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS kelurahan VARCHAR(100);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS kecamatan VARCHAR(100);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS kode_pos VARCHAR(10);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS lintang VARCHAR(50);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS bujur VARCHAR(50);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS pilihan_diterima VARCHAR(100);

-- Tambah Kolom Kontak & Sekolah Asal untuk Pre-fill
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS sekolah_asal VARCHAR(150);

-- Tambah Kolom Orang Tua Kandung untuk Pre-fill
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS ayah_nama VARCHAR(100);
ALTER TABLE ws_accepted_students ADD COLUMN IF NOT EXISTS ibu_nama VARCHAR(100);

-- Tambah Constraint Unique pada kolom nisn agar bisa digunakan untuk query upsert (onConflict)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ws_accepted_students_nisn_key'
    ) THEN
        ALTER TABLE ws_accepted_students ADD CONSTRAINT ws_accepted_students_nisn_key UNIQUE (nisn);
    END IF;
END $$;
