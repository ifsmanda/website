-- =========================================================================
-- SCRIPT SQL UNTUK MENAMBAH KOLOM DATA DAPODIK F-PD PADA TABEL ws_registrations
-- Salin dan jalankan script ini di menu "SQL Editor" pada dashboard Supabase Anda.
-- =========================================================================

-- Tambah Kolom Data Pribadi
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS nik VARCHAR(20);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS no_kk VARCHAR(20);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS no_akta VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS agama VARCHAR(30);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS kewarganegaraan VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS kewarganegaraan_negara VARCHAR(100);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS kebutuhan_khusus VARCHAR(100);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS alamat_jalan TEXT;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS rt VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS rw VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS dusun VARCHAR(100);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS kelurahan VARCHAR(100);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS kecamatan VARCHAR(100);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS kode_pos VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS lintang VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS bujur VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS tempat_tinggal VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS transportasi VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS anak_ke INTEGER;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS penerima_kip VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS tetap_kip VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS alasan_tolak_pip VARCHAR(100);

-- Tambah Kolom Data Ayah Kandung
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ayah_nama VARCHAR(100);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ayah_nik VARCHAR(20);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ayah_tahun_lahir VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ayah_pendidikan VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ayah_pekerjaan VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ayah_penghasilan VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ayah_kebutuhan_khusus VARCHAR(100);

-- Tambah Kolom Data Ibu Kandung
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ibu_nama VARCHAR(100);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ibu_nik VARCHAR(20);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ibu_tahun_lahir VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ibu_pendidikan VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ibu_pekerjaan VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ibu_penghasilan VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS ibu_kebutuhan_khusus VARCHAR(100);

-- Tambah Kolom Data Wali
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS wali_nama VARCHAR(100);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS wali_nik VARCHAR(20);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS wali_tahun_lahir VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS wali_pendidikan VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS wali_pekerjaan VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS wali_penghasilan VARCHAR(50);

-- Tambah Kolom Kontak Tambahan
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS telepon_rumah VARCHAR(20);

-- Tambah Kolom Data Periodik
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS tinggi_badan INTEGER;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS berat_badan INTEGER;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS lingkar_kepala INTEGER;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS jarak_sekolah VARCHAR(20);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS jarak_sekolah_km NUMERIC;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS waktu_tempuh_jam INTEGER;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS waktu_tempuh_menit INTEGER;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS jumlah_saudara INTEGER;

-- Tambah Kolom Prestasi 1-3
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_1_jenis VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_1_tingkat VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_1_nama VARCHAR(150);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_1_tahun VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_1_penyelenggara VARCHAR(150);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_1_peringkat VARCHAR(50);

ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_2_jenis VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_2_tingkat VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_2_nama VARCHAR(150);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_2_tahun VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_2_penyelenggara VARCHAR(150);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_2_peringkat VARCHAR(50);

ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_3_jenis VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_3_tingkat VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_3_nama VARCHAR(150);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_3_tahun VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_3_penyelenggara VARCHAR(150);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS prestasi_3_peringkat VARCHAR(50);

-- Tambah Kolom Beasiswa 1-2
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS beasiswa_1_jenis VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS beasiswa_1_keterangan TEXT;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS beasiswa_1_tahun_mulai VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS beasiswa_1_tahun_selesai VARCHAR(10);

ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS beasiswa_2_jenis VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS beasiswa_2_keterangan TEXT;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS beasiswa_2_tahun_mulai VARCHAR(10);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS beasiswa_2_tahun_selesai VARCHAR(10);

-- Tambah Kolom Kesejahteraan
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS kesejahteraan_jenis VARCHAR(100);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS kesejahteraan_no_kartu VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS kesejahteraan_nama_kartu VARCHAR(100);

-- Tambah Kolom Registrasi SMP
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS jenis_pendaftaran VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS nis VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS tanggal_masuk DATE;
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS sekolah_asal VARCHAR(150);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS nomor_peserta_un VARCHAR(30);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS no_seri_ijazah VARCHAR(50);
ALTER TABLE ws_registrations ADD COLUMN IF NOT EXISTS no_skhun VARCHAR(50);
