/**
 * SMAN 2 BANDUNG — SPMB 2026 EXPRESS BACKEND SERVER
 * Handles static routing, file uploads to Supabase Storage, Supabase queries, QR receipt generation, and Excel exports.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const qrCode = require('qrcode');
const ExcelJS = require('exceljs');
const supabase = require('./db');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8000;

// Admin Authentication Config
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'smanda2026admin';
const PPID_USERNAME = process.env.PPID_USERNAME || 'admin_ppid';
const PPID_PASSWORD = process.env.PPID_PASSWORD || 'smandappid2026';
const SESSION_SECRET = process.env.SESSION_SECRET || 'smanda-secure-session-hash-key-2026';

/**
 * Token Helpers for Stateless Secure Admin Session
 */
function generateToken(username) {
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const data = `${username}|${expires}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
  return `${data}|${signature}`;
}

function verifyToken(token) {
  if (!token) return false;
  const parts = token.split('|');
  if (parts.length !== 3) return false;
  const [username, expires, signature] = parts;
  
  if (parseInt(expires) < Date.now()) return false;
  
  const data = `${username}|${expires}`;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
  if (signature !== expectedSignature) return false;
  
  return username;
}

/**
 * Middleware: Verify Daftar Ulang Admin Authentication (Checks role explicitly)
 */
function requireDaftarUlang(req, res, next) {
  const cookies = req.headers.cookie ? Object.fromEntries(req.headers.cookie.split('; ').map(c => c.split('='))) : {};
  const token = cookies.admin_token;
  const username = verifyToken(token);
  
  if (username === ADMIN_USERNAME) {
    req.adminUsername = username;
    next();
  } else if (username === PPID_USERNAME) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ error: 'Akses ditolak. Akun Anda adalah Administrator PPID.' });
    }
    res.redirect('/admin_ppid.html');
  } else {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Sesi verifikator tidak sah atau berakhir. Silakan login kembali.' });
    }
    res.redirect('/login.html');
  }
}

/**
 * Middleware: Verify PPID & Humas Admin Authentication (Checks role explicitly)
 */
function requirePpid(req, res, next) {
  const cookies = req.headers.cookie ? Object.fromEntries(req.headers.cookie.split('; ').map(c => c.split('='))) : {};
  const token = cookies.admin_token;
  const username = verifyToken(token);
  
  if (username === PPID_USERNAME) {
    req.adminUsername = username;
    next();
  } else if (username === ADMIN_USERNAME) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ error: 'Akses ditolak. Akun Anda adalah Administrator Daftar Ulang.' });
    }
    res.redirect('/admin.html');
  } else {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Sesi administrator tidak sah atau berakhir. Silakan login kembali.' });
    }
    res.redirect('/login.html');
  }
}

// Express Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Protected Admin Page Routes (Serve from private folder)
app.get('/admin.html', requireDaftarUlang, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});
app.get('/admin', requireDaftarUlang, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});
app.get('/admin_ppid.html', requirePpid, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin_ppid.html'));
});
app.get('/admin_ppid', requirePpid, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin_ppid.html'));
});

// Admin Authentication API Endpoints
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken(username);
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);
    return res.status(200).json({ success: true, message: 'Login berhasil.', redirectUrl: '/admin.html' });
  } else if (username === PPID_USERNAME && password === PPID_PASSWORD) {
    const token = generateToken(username);
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);
    return res.status(200).json({ success: true, message: 'Login berhasil.', redirectUrl: '/admin_ppid.html' });
  } else {
    return res.status(400).json({ error: 'Nama pengguna atau kata sandi salah.' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'admin_token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
  return res.status(200).json({ success: true, message: 'Logout berhasil.' });
});

// Serve static frontend files from 'public/'
app.use(express.static(path.join(__dirname, 'public')));

// Serve legacy uploaded files statically under /uploads (if any local folder exists)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Storage Configuration using Memory Storage for Supabase uploads
const storage = multer.memoryStorage();

// Multer File Filter Constraints
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format berkas tidak valid! Hanya diperbolehkan berkas PDF, JPG, JPEG, atau PNG.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // limit: 2MB per file
});

/**
 * Helper function to upload file buffer to Supabase Storage
 */
async function uploadToSupabaseStorage(bucketName, file, prefixName) {
  const extension = path.extname(file.originalname).toLowerCase();
  const cleanPrefix = prefixName.toString().replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `${cleanPrefix}-${file.fieldname}-${Date.now()}${extension}`;
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });
    
  if (error) {
    throw new Error(`Gagal mengunggah file ke Supabase Storage: ${error.message}`);
  }
  
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);
    
  return publicUrlData.publicUrl;
}

// ==========================================
// 1. API: CHECK ELIGIBILITY (GET /api/check-nisn/:nisn)
// ==========================================
app.get('/api/check-nisn/:nisn', async (req, res) => {
  let { nisn } = req.params;

  if (!/^\d+$/.test(nisn)) {
    return res.status(400).json({ error: 'Format NISN tidak valid! NISN harus berupa deretan angka.' });
  }

  // Auto-pad leading zero if 9 digits
  if (nisn.length === 9) {
    nisn = '0' + nisn;
  }

  try {
    // Check if the student is accepted based on accepted_students list
    const { data: student, error: studentError } = await supabase
      .from('ws_accepted_students')
      .select('*')
      .eq('nisn', nisn)
      .maybeSingle();

    if (studentError) throw studentError;

    if (!student) {
      return res.status(404).json({ 
        error: 'NISN tidak terdaftar di database kelulusan SMAN 2 Bandung berdasarkan hasil PPDB Dinas Pendidikan.' 
      });
    }

    // Check PPDB selection status (only 'diterima' or 'lulus' are allowed if status is present)
    if (student.status) {
      const statusClean = student.status.toString().trim().toLowerCase();
      if (statusClean !== 'diterima' && statusClean !== 'lulus') {
        return res.status(403).json({ 
          error: `Pendaftaran Ulang Online tidak dapat dilanjutkan. Status seleksi PPDB Anda adalah "${student.status}". Anda hanya diperbolehkan daftar ulang jika berstatus "Diterima".` 
        });
      }
    }

    // Check PPDB selection school (must be SMAN 2 Bandung if pilihan_diterima is present)
    if (student.pilihan_diterima) {
      const schoolClean = student.pilihan_diterima.toString().trim().toLowerCase();
      if (!schoolClean.includes('sman 2 bandung')) {
        return res.status(403).json({ 
          error: `Pendaftaran Ulang Online tidak dapat dilanjutkan. Pilihan sekolah diterima Anda adalah "${student.pilihan_diterima}". Anda hanya diperbolehkan daftar ulang jika diterima di SMAN 2 Bandung.` 
        });
      }
    }

    // Check if they have already submitted a re-registration
    const { data: registration, error: regError } = await supabase
      .from('ws_registrations')
      .select('*')
      .eq('nisn', nisn)
      .maybeSingle();

    if (regError) throw regError;

    if (registration) {
      return res.status(200).json({
        alreadyRegistered: true,
        status: registration.status,
        name: registration.name,
        queue_session: registration.queue_session,
        message: `NISN ini sudah melakukan daftar ulang sebelumnya dengan status verifikasi: [${registration.status}].`
      });
    }

    // If eligible and not registered yet
    return res.status(200).json({ 
      eligible: true, 
      name: student.name,
      studentData: student
    });

  } catch (err) {
    console.error('Cek NISN Error:', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem dalam pengecekan database.' });
  }
});

// ==========================================
// 2. API: SUBMIT RE-REGISTRATION (POST /api/register)
// ==========================================
app.post('/api/register', async (req, res) => {
  const {
    nisn,
    name,
    gender,
    nik,
    no_kk,
    tempat_lahir,
    tanggal_lahir,
    no_akta,
    agama,
    kewarganegaraan,
    kewarganegaraan_negara,
    kebutuhan_khusus,
    alamat_jalan,
    rt,
    rw,
    dusun,
    kelurahan,
    kecamatan,
    kode_pos,
    lintang,
    bujur,
    tempat_tinggal,
    transportasi,
    anak_ke,
    penerima_kip,
    tetap_kip,
    alasan_tolak_pip,
    email,
    phone,
    telepon_rumah,
    uniform_size,
    address,

    // Father
    ayah_nama,
    ayah_nik,
    ayah_tahun_lahir,
    ayah_pendidikan,
    ayah_pekerjaan,
    ayah_penghasilan,
    ayah_kebutuhan_khusus,

    // Mother
    ibu_nama,
    ibu_nik,
    ibu_tahun_lahir,
    ibu_pendidikan,
    ibu_pekerjaan,
    ibu_penghasilan,
    ibu_kebutuhan_khusus,

    // Wali
    wali_nama,
    wali_nik,
    wali_tahun_lahir,
    wali_pendidikan,
    wali_pekerjaan,
    wali_penghasilan,

    // Periodik & Registrasi
    tinggi_badan,
    berat_badan,
    lingkar_kepala,
    jumlah_saudara,
    jarak_sekolah,
    jarak_sekolah_km,
    waktu_tempuh_jam,
    waktu_tempuh_menit,

    jenis_pendaftaran,
    nis,
    tanggal_masuk,
    sekolah_asal,
    nomor_peserta_un,
    no_seri_ijazah,
    no_skhun,

    kesejahteraan_jenis,
    kesejahteraan_no_kartu,
    kesejahteraan_nama_kartu,

    // Prestasi
    prestasi_1_jenis,
    prestasi_1_tingkat,
    prestasi_1_nama,
    prestasi_1_tahun,
    prestasi_1_penyelenggara,
    prestasi_1_peringkat,

    prestasi_2_jenis,
    prestasi_2_tingkat,
    prestasi_2_nama,
    prestasi_2_tahun,
    prestasi_2_penyelenggara,
    prestasi_2_peringkat,

    prestasi_3_jenis,
    prestasi_3_tingkat,
    prestasi_3_nama,
    prestasi_3_tahun,
    prestasi_3_penyelenggara,
    prestasi_3_peringkat,

    // Beasiswa
    beasiswa_1_jenis,
    beasiswa_1_keterangan,
    beasiswa_1_tahun_mulai,
    beasiswa_1_tahun_selesai,

    beasiswa_2_jenis,
    beasiswa_2_keterangan,
    beasiswa_2_tahun_mulai,
    beasiswa_2_tahun_selesai
  } = req.body;

  // Basic required fields validation (including new F-PD fields, excluding uniform and address)
  if (!nisn || !name || !gender || !nik || !no_kk || !tempat_lahir || !tanggal_lahir || !no_akta || !agama || !kewarganegaraan ||
      !alamat_jalan || !rt || !rw || !kelurahan || !kecamatan || !kode_pos || !tempat_tinggal || !transportasi ||
      !anak_ke || !email || !phone ||
      !ayah_nama || !ayah_nik || !ayah_tahun_lahir || !ayah_pendidikan || !ayah_pekerjaan || !ayah_penghasilan ||
      !ibu_nama || !ibu_nik || !ibu_tahun_lahir || !ibu_pendidikan || !ibu_pekerjaan || !ibu_penghasilan ||
      !tinggi_badan || !berat_badan || !lingkar_kepala || !jumlah_saudara || !jarak_sekolah ||
      !jenis_pendaftaran || !tanggal_masuk || !sekolah_asal) {
    return res.status(400).json({ error: 'Semua isian formulir wajib diisi!' });
  }


  try {
    // Check eligibility again
    const { data: student, error: studentError } = await supabase
      .from('ws_accepted_students')
      .select('*')
      .eq('nisn', nisn)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student) {
      return res.status(404).json({ error: 'NISN tidak terdaftar di database kelulusan PPDB.' });
    }

    // Check status eligibility
    if (student.status) {
      const statusClean = student.status.toString().trim().toLowerCase();
      if (statusClean !== 'diterima' && statusClean !== 'lulus') {
        return res.status(403).json({ error: 'Status seleksi PPDB Anda tidak diperbolehkan untuk melakukan daftar ulang.' });
      }
    }

    // Check school selection eligibility
    if (student.pilihan_diterima) {
      const schoolClean = student.pilihan_diterima.toString().trim().toLowerCase();
      if (!schoolClean.includes('sman 2 bandung')) {
        return res.status(403).json({ error: 'Pilihan sekolah diterima Anda tidak diperbolehkan untuk daftar ulang di SMAN 2 Bandung.' });
      }
    }

    // Check duplicate
    const { data: checkDuplicate, error: dupError } = await supabase
      .from('ws_registrations')
      .select('*')
      .eq('nisn', nisn)
      .maybeSingle();

    if (dupError) throw dupError;
    if (checkDuplicate) {
      return res.status(400).json({ error: 'NISN ini sudah didaftarkan sebelumnya!' });
    }

    // No files uploaded anymore
    const kkPath = "";
    const ppdbPath = "";
    const regDate = new Date().toISOString();

    // Auto-allocate queue session based on registration count
    const { count, error: countError } = await supabase
      .from('ws_registrations')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    const seq = (count || 0) + 1;
    let queueSession = '';

    if (seq <= 250) {
      queueSession = 'Sesi 1: Rabu, 1 Juli 2026 (08:00 - 11:00 WIB)';
    } else if (seq <= 500) {
      queueSession = 'Sesi 2: Rabu, 1 Juli 2026 (13:00 - 15:00 WIB)';
    } else if (seq <= 750) {
      queueSession = 'Sesi 3: Kamis, 2 Juli 2026 (08:00 - 11:00 WIB)';
    } else {
      queueSession = 'Sesi 4: Kamis, 2 Juli 2026 (13:00 - 15:00 WIB)';
    }

    // Insert record
    const { error: insertError } = await supabase
      .from('ws_registrations')
      .insert({
        nisn,
        name,
        gender,
        nik,
        no_kk,
        tempat_lahir,
        tanggal_lahir,
        no_akta,
        agama,
        kewarganegaraan,
        kewarganegaraan_negara: kewarganegaraan === 'WNA' ? kewarganegaraan_negara : null,
        kebutuhan_khusus,
        alamat_jalan,
        rt,
        rw,
        dusun: dusun || null,
        kelurahan,
        kecamatan,
        kode_pos,
        lintang: lintang || null,
        bujur: bujur || null,
        tempat_tinggal,
        transportasi,
        anak_ke: parseInt(anak_ke) || null,
        penerima_kip,
        tetap_kip: penerima_kip === 'Ya' ? tetap_kip : null,
        alasan_tolak_pip: penerima_kip === 'Tidak' ? alasan_tolak_pip : null,
        email,
        phone,
        telepon_rumah: telepon_rumah || null,
        uniform_size: uniform_size || '',
        address: address || '',
        kk_file_path: kkPath,
        ppdb_file_path: ppdbPath,
        registration_date: regDate,
        status: 'Pending',
        queue_session: queueSession,

        // Father
        ayah_nama,
        ayah_nik,
        ayah_tahun_lahir,
        ayah_pendidikan,
        ayah_pekerjaan,
        ayah_penghasilan,
        ayah_kebutuhan_khusus,

        // Mother
        ibu_nama,
        ibu_nik,
        ibu_tahun_lahir,
        ibu_pendidikan,
        ibu_pekerjaan,
        ibu_penghasilan,
        ibu_kebutuhan_khusus,

        // Wali
        wali_nama: wali_nama || null,
        wali_nik: wali_nik || null,
        wali_tahun_lahir: wali_tahun_lahir || null,
        wali_pendidikan: wali_pendidikan || null,
        wali_pekerjaan: wali_pekerjaan || null,
        wali_penghasilan: wali_penghasilan || null,

        // Periodik & Registrasi
        tinggi_badan: parseInt(tinggi_badan) || null,
        berat_badan: parseInt(berat_badan) || null,
        lingkar_kepala: parseInt(lingkar_kepala) || null,
        jumlah_saudara: parseInt(jumlah_saudara) || null,
        jarak_sekolah,
        jarak_sekolah_km: jarak_sekolah === 'Lebih dari 1 km' ? parseFloat(jarak_sekolah_km) : null,
        waktu_tempuh_jam: parseInt(waktu_tempuh_jam) || 0,
        waktu_tempuh_menit: parseInt(waktu_tempuh_menit) || 0,

        jenis_pendaftaran,
        nis: nis || null,
        tanggal_masuk,
        sekolah_asal,
        nomor_peserta_un: nomor_peserta_un || null,
        no_seri_ijazah: no_seri_ijazah || null,
        no_skhun: no_skhun || null,

        kesejahteraan_jenis: kesejahteraan_jenis || 'Tidak Menerima',
        kesejahteraan_no_kartu: kesejahteraan_no_kartu || null,
        kesejahteraan_nama_kartu: kesejahteraan_nama_kartu || null,

        // Prestasi 1-3
        prestasi_1_jenis: prestasi_1_jenis || null,
        prestasi_1_tingkat: prestasi_1_tingkat || null,
        prestasi_1_nama: prestasi_1_nama || null,
        prestasi_1_tahun: prestasi_1_tahun || null,
        prestasi_1_penyelenggara: prestasi_1_penyelenggara || null,
        prestasi_1_peringkat: prestasi_1_peringkat || null,

        prestasi_2_jenis: prestasi_2_jenis || null,
        prestasi_2_tingkat: prestasi_2_tingkat || null,
        prestasi_2_nama: prestasi_2_nama || null,
        prestasi_2_tahun: prestasi_2_tahun || null,
        prestasi_2_penyelenggara: prestasi_2_penyelenggara || null,
        prestasi_2_peringkat: prestasi_2_peringkat || null,

        prestasi_3_jenis: prestasi_3_jenis || null,
        prestasi_3_tingkat: prestasi_3_tingkat || null,
        prestasi_3_nama: prestasi_3_nama || null,
        prestasi_3_tahun: prestasi_3_tahun || null,
        prestasi_3_penyelenggara: prestasi_3_penyelenggara || null,
        prestasi_3_peringkat: prestasi_3_peringkat || null,

        // Beasiswa 1-2
        beasiswa_1_jenis: beasiswa_1_jenis || null,
        beasiswa_1_keterangan: beasiswa_1_keterangan || null,
        beasiswa_1_tahun_mulai: beasiswa_1_tahun_mulai || null,
        beasiswa_1_tahun_selesai: beasiswa_1_tahun_selesai || null,

        beasiswa_2_jenis: beasiswa_2_jenis || null,
        beasiswa_2_keterangan: beasiswa_2_keterangan || null,
        beasiswa_2_tahun_mulai: beasiswa_2_tahun_mulai || null,
        beasiswa_2_tahun_selesai: beasiswa_2_tahun_selesai || null
      });

    if (insertError) throw insertError;

    // Generate QR Code data (incorporating name and unique verification signature)
    const qrData = JSON.stringify({
      code: `SMANDA-PPDB-2026-${nisn}`,
      name: name,
      nisn: nisn,
      session: queueSession
    });

    const qrBase64 = await qrCode.toDataURL(qrData);

    return res.status(200).json({
      success: true,
      message: 'Pra-Daftar ulang berhasil disimpan!',
      data: {
        nisn,
        name,
        email,
        phone,
        address,
        uniform_size,
        queue_session: queueSession,
        registration_date: regDate,
        registration_number: `SMANDA-PPDB-2026-${nisn}`,
        qr_code: qrBase64
      }
    });

  } catch (err) {
    console.error('Register Error:', err.message);
    return res.status(500).json({ error: 'Gagal memproses pendaftaran. Terjadi kesalahan server.' });
  }
});

// ==========================================
// 3. API: GET RECEIPT DATA (GET /api/receipt/:nisn)
// ==========================================
app.get('/api/receipt/:nisn', async (req, res) => {
  const { nisn } = req.params;

  try {
    const { data: reg, error: regError } = await supabase
      .from('ws_registrations')
      .select('*')
      .eq('nisn', nisn)
      .maybeSingle();

    if (regError) throw regError;
    if (!reg) {
      return res.status(404).json({ error: 'Data registrasi daftar ulang tidak ditemukan.' });
    }

    const qrData = JSON.stringify({
      code: `SMANDA-PPDB-2026-${nisn}`,
      name: reg.name,
      nisn: reg.nisn,
      session: reg.queue_session
    });

    const qrBase64 = await qrCode.toDataURL(qrData);

    return res.status(200).json({
      success: true,
      data: {
        ...reg,
        registration_number: `SMANDA-PPDB-2026-${nisn}`,
        qr_code: qrBase64
      }
    });
  } catch (err) {
    console.error('Receipt Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengambil data tanda bukti.' });
  }
});

// ==========================================
// 4. API: ADMIN - GET ALL REGISTRANTS (GET /api/admin/registrants)
// ==========================================
app.get('/api/admin/registrants', requireDaftarUlang, async (req, res) => {
  try {
    const { data: registrants, error: regError } = await supabase
      .from('ws_registrations')
      .select('*')
      .order('registration_date', { ascending: false });

    if (regError) throw regError;
    const formatted = registrants.map(r => ({
      ...r,
      registration_number: `SMANDA-PPDB-2026-${r.nisn}`
    }));
    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Admin Registrants Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengambil database pendaftar.' });
  }
});

// ==========================================
// 5. API: ADMIN - VERIFY REGISTRATION (POST /api/admin/verify/:nisn)
// ==========================================
app.post('/api/admin/verify/:nisn', requireDaftarUlang, async (req, res) => {
  const { nisn } = req.params;
  const { status, notes } = req.body;

  if (!status || !['Verified', 'Rejected', 'Pending'].includes(status)) {
    return res.status(400).json({ error: 'Status verifikasi tidak valid!' });
  }

  try {
    const verifyDate = new Date().toISOString();
    const { data, error } = await supabase
      .from('ws_registrations')
      .update({
        status,
        verification_date: verifyDate,
        verification_notes: notes || ''
      })
      .eq('nisn', nisn)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Data pendaftar tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, message: `Status pendaftaran berhasil diubah ke: ${status}` });
  } catch (err) {
    console.error('Verify Error:', err.message);
    return res.status(500).json({ error: 'Gagal melakukan verifikasi berkas.' });
  }
});

// ==========================================
app.get('/api/admin/export', requireDaftarUlang, async (req, res) => {
  try {
    const { data: rows, error: rowsError } = await supabase
      .from('ws_registrations')
      .select('*')
      .eq('status', 'Verified')
      .order('name', { ascending: true });

    if (rowsError) throw rowsError;
    
    // Create new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Daftar Ulang Terverifikasi');
    
    // Define columns
    worksheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'Nama Lengkap', key: 'name', width: 25 },
      { header: 'Jenis Kelamin', key: 'gender', width: 15 },
      { header: 'NIK Siswa', key: 'nik', width: 20 },
      { header: 'No. KK', key: 'no_kk', width: 20 },
      { header: 'Tempat Lahir', key: 'tempat_lahir', width: 20 },
      { header: 'Tanggal Lahir', key: 'tanggal_lahir', width: 15 },
      { header: 'No. Akta Lahir', key: 'no_akta', width: 20 },
      { header: 'Agama', key: 'agama', width: 15 },
      { header: 'Kewarganegaraan', key: 'kewarganegaraan', width: 15 },
      { header: 'Negara (Jika WNA)', key: 'kewarganegaraan_negara', width: 20 },
      { header: 'Kebutuhan Khusus', key: 'kebutuhan_khusus', width: 20 },
      { header: 'Alamat Jalan', key: 'alamat_jalan', width: 30 },
      { header: 'RT', key: 'rt', width: 8 },
      { header: 'RW', key: 'rw', width: 8 },
      { header: 'Dusun', key: 'dusun', width: 15 },
      { header: 'Kelurahan', key: 'kelurahan', width: 20 },
      { header: 'Kecamatan', key: 'kecamatan', width: 20 },
      { header: 'Kode Pos', key: 'kode_pos', width: 10 },
      { header: 'Lintang', key: 'lintang', width: 15 },
      { header: 'Bujur', key: 'bujur', width: 15 },
      { header: 'Tempat Tinggal', key: 'tempat_tinggal', width: 20 },
      { header: 'Moda Transportasi', key: 'transportasi', width: 20 },
      { header: 'Anak Ke', key: 'anak_ke', width: 10 },
      { header: 'Penerima KIP', key: 'penerima_kip', width: 12 },
      { header: 'Tetap Menerima KIP', key: 'tetap_kip', width: 15 },
      { header: 'Alasan Menolak PIP', key: 'alasan_tolak_pip', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'No. HP / WA', key: 'phone', width: 18 },
      { header: 'Telepon Rumah', key: 'telepon_rumah', width: 18 },
      { header: 'Ukuran Baju', key: 'uniform_size', width: 12 },
      { header: 'Alamat Rumah Lengkap', key: 'address', width: 40 },
      { header: 'Nomor Pendaftaran', key: 'registration_number', width: 25 },
      { header: 'Tanggal Daftar', key: 'registration_date', width: 25 },
      { header: 'Status Verifikasi', key: 'status', width: 15 },
      { header: 'Catatan Verifikator', key: 'verification_notes', width: 30 },

      // Father
      { header: 'Nama Ayah', key: 'ayah_nama', width: 25 },
      { header: 'NIK Ayah', key: 'ayah_nik', width: 20 },
      { header: 'Tahun Lahir Ayah', key: 'ayah_tahun_lahir', width: 15 },
      { header: 'Pendidikan Ayah', key: 'ayah_pendidikan', width: 20 },
      { header: 'Pekerjaan Ayah', key: 'ayah_pekerjaan', width: 20 },
      { header: 'Penghasilan Ayah', key: 'ayah_penghasilan', width: 20 },
      { header: 'Kebutuhan Khusus Ayah', key: 'ayah_kebutuhan_khusus', width: 20 },

      // Mother
      { header: 'Nama Ibu', key: 'ibu_nama', width: 25 },
      { header: 'NIK Ibu', key: 'ibu_nik', width: 20 },
      { header: 'Tahun Lahir Ibu', key: 'ibu_tahun_lahir', width: 15 },
      { header: 'Pendidikan Ibu', key: 'ibu_pendidikan', width: 20 },
      { header: 'Pekerjaan Ibu', key: 'ibu_pekerjaan', width: 20 },
      { header: 'Penghasilan Ibu', key: 'ibu_penghasilan', width: 20 },
      { header: 'Kebutuhan Khusus Ibu', key: 'ibu_kebutuhan_khusus', width: 20 },

      // Wali
      { header: 'Nama Wali', key: 'wali_nama', width: 25 },
      { header: 'NIK Wali', key: 'wali_nik', width: 20 },
      { header: 'Tahun Lahir Wali', key: 'wali_tahun_lahir', width: 15 },
      { header: 'Pendidikan Wali', key: 'wali_pendidikan', width: 20 },
      { header: 'Pekerjaan Wali', key: 'wali_pekerjaan', width: 20 },
      { header: 'Penghasilan Wali', key: 'wali_penghasilan', width: 20 },

      // Periodik
      { header: 'Tinggi Badan (cm)', key: 'tinggi_badan', width: 15 },
      { header: 'Berat Badan (kg)', key: 'berat_badan', width: 15 },
      { header: 'Lingkar Kepala (cm)', key: 'lingkar_kepala', width: 15 },
      { header: 'Jumlah Saudara', key: 'jumlah_saudara', width: 12 },
      { header: 'Jarak Sekolah', key: 'jarak_sekolah', width: 20 },
      { header: 'Jarak (km)', key: 'jarak_sekolah_km', width: 12 },
      { header: 'Waktu Tempuh (Jam)', key: 'waktu_tempuh_jam', width: 15 },
      { header: 'Waktu Tempuh (Menit)', key: 'waktu_tempuh_menit', width: 15 },

      // Registrasi
      { header: 'Jenis Pendaftaran', key: 'jenis_pendaftaran', width: 20 },
      { header: 'NIS', key: 'nis', width: 15 },
      { header: 'Tanggal Masuk', key: 'tanggal_masuk', width: 15 },
      { header: 'Sekolah Asal', key: 'sekolah_asal', width: 25 },
      { header: 'Nomor Peserta UN', key: 'nomor_peserta_un', width: 25 },
      { header: 'No Seri Ijazah', key: 'no_seri_ijazah', width: 20 },
      { header: 'No Seri SKHUN', key: 'no_skhun', width: 20 },

      // Kesejahteraan
      { header: 'Jenis Kesejahteraan', key: 'kesejahteraan_jenis', width: 25 },
      { header: 'No Kartu Kesejahteraan', key: 'kesejahteraan_no_kartu', width: 25 },
      { header: 'Nama Kartu Kesejahteraan', key: 'kesejahteraan_nama_kartu', width: 25 },

      // Prestasi 1
      { header: 'Prestasi 1 (Jenis)', key: 'prestasi_1_jenis', width: 15 },
      { header: 'Prestasi 1 (Tingkat)', key: 'prestasi_1_tingkat', width: 15 },
      { header: 'Prestasi 1 (Nama)', key: 'prestasi_1_nama', width: 20 },
      { header: 'Prestasi 1 (Tahun)', key: 'prestasi_1_tahun', width: 12 },
      { header: 'Prestasi 1 (Penyelenggara)', key: 'prestasi_1_penyelenggara', width: 20 },
      { header: 'Prestasi 1 (Peringkat)', key: 'prestasi_1_peringkat', width: 15 },

      // Prestasi 2
      { header: 'Prestasi 2 (Jenis)', key: 'prestasi_2_jenis', width: 15 },
      { header: 'Prestasi 2 (Tingkat)', key: 'prestasi_2_tingkat', width: 15 },
      { header: 'Prestasi 2 (Nama)', key: 'prestasi_2_nama', width: 20 },
      { header: 'Prestasi 2 (Tahun)', key: 'prestasi_2_tahun', width: 12 },
      { header: 'Prestasi 2 (Penyelenggara)', key: 'prestasi_2_penyelenggara', width: 20 },
      { header: 'Prestasi 2 (Peringkat)', key: 'prestasi_2_peringkat', width: 15 },

      // Prestasi 3
      { header: 'Prestasi 3 (Jenis)', key: 'prestasi_3_jenis', width: 15 },
      { header: 'Prestasi 3 (Tingkat)', key: 'prestasi_3_tingkat', width: 15 },
      { header: 'Prestasi 3 (Nama)', key: 'prestasi_3_nama', width: 20 },
      { header: 'Prestasi 3 (Tahun)', key: 'prestasi_3_tahun', width: 12 },
      { header: 'Prestasi 3 (Penyelenggara)', key: 'prestasi_3_penyelenggara', width: 20 },
      { header: 'Prestasi 3 (Peringkat)', key: 'prestasi_3_peringkat', width: 15 },

      // Beasiswa 1
      { header: 'Beasiswa 1 (Jenis)', key: 'beasiswa_1_jenis', width: 18 },
      { header: 'Beasiswa 1 (Keterangan)', key: 'beasiswa_1_keterangan', width: 25 },
      { header: 'Beasiswa 1 (Tahun Mulai)', key: 'beasiswa_1_tahun_mulai', width: 15 },
      { header: 'Beasiswa 1 (Tahun Selesai)', key: 'beasiswa_1_tahun_selesai', width: 15 },

      // Beasiswa 2
      { header: 'Beasiswa 2 (Jenis)', key: 'beasiswa_2_jenis', width: 18 },
      { header: 'Beasiswa 2 (Keterangan)', key: 'beasiswa_2_keterangan', width: 25 },
      { header: 'Beasiswa 2 (Tahun Mulai)', key: 'beasiswa_2_tahun_mulai', width: 15 },
      { header: 'Beasiswa 2 (Tahun Selesai)', key: 'beasiswa_2_tahun_selesai', width: 15 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0A2E73' } // SMAN 2 Navy theme
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    rows.forEach((student, index) => {
      worksheet.addRow({
        no: index + 1,
        nisn: student.nisn,
        name: student.name,
        gender: student.gender || '',
        nik: student.nik || '',
        no_kk: student.no_kk || '',
        tempat_lahir: student.tempat_lahir || '',
        tanggal_lahir: student.tanggal_lahir ? new Date(student.tanggal_lahir).toLocaleDateString('id-ID') : '',
        no_akta: student.no_akta || '',
        agama: student.agama || '',
        kewarganegaraan: student.kewarganegaraan || '',
        kewarganegaraan_negara: student.kewarganegaraan_negara || '',
        kebutuhan_khusus: student.kebutuhan_khusus || '',
        alamat_jalan: student.alamat_jalan || '',
        rt: student.rt || '',
        rw: student.rw || '',
        dusun: student.dusun || '',
        kelurahan: student.kelurahan || '',
        kecamatan: student.kecamatan || '',
        kode_pos: student.kode_pos || '',
        lintang: student.lintang || '',
        bujur: student.bujur || '',
        tempat_tinggal: student.tempat_tinggal || '',
        transportasi: student.transportasi || '',
        anak_ke: student.anak_ke || '',
        penerima_kip: student.penerima_kip || '',
        tetap_kip: student.tetap_kip || '',
        alasan_tolak_pip: student.alasan_tolak_pip || '',
        email: student.email,
        phone: student.phone,
        telepon_rumah: student.telepon_rumah || '',
        uniform_size: student.uniform_size,
        address: student.address,
        registration_number: student.registration_number || `SMANDA-PPDB-2026-${student.nisn}`,
        registration_date: new Date(student.registration_date).toLocaleString('id-ID'),
        status: student.status || '',
        verification_notes: student.verification_notes || '',

        // Father
        ayah_nama: student.ayah_nama || '',
        ayah_nik: student.ayah_nik || '',
        ayah_tahun_lahir: student.ayah_tahun_lahir || '',
        ayah_pendidikan: student.ayah_pendidikan || '',
        ayah_pekerjaan: student.ayah_pekerjaan || '',
        ayah_penghasilan: student.ayah_penghasilan || '',
        ayah_kebutuhan_khusus: student.ayah_kebutuhan_khusus || '',

        // Mother
        ibu_nama: student.ibu_nama || '',
        ibu_nik: student.ibu_nik || '',
        ibu_tahun_lahir: student.ibu_tahun_lahir || '',
        ibu_pendidikan: student.ibu_pendidikan || '',
        ibu_pekerjaan: student.ibu_pekerjaan || '',
        ibu_penghasilan: student.ibu_penghasilan || '',
        ibu_kebutuhan_khusus: student.ibu_kebutuhan_khusus || '',

        // Wali
        wali_nama: student.wali_nama || '',
        wali_nik: student.wali_nik || '',
        wali_tahun_lahir: student.wali_tahun_lahir || '',
        wali_pendidikan: student.wali_pendidikan || '',
        wali_pekerjaan: student.wali_pekerjaan || '',
        wali_penghasilan: student.wali_penghasilan || '',

        // Periodik
        tinggi_badan: student.tinggi_badan || '',
        berat_badan: student.berat_badan || '',
        lingkar_kepala: student.lingkar_kepala || '',
        jumlah_saudara: student.jumlah_saudara || '',
        jarak_sekolah: student.jarak_sekolah || '',
        jarak_sekolah_km: student.jarak_sekolah_km || '',
        waktu_tempuh_jam: student.waktu_tempuh_jam !== undefined ? student.waktu_tempuh_jam : '',
        waktu_tempuh_menit: student.waktu_tempuh_menit !== undefined ? student.waktu_tempuh_menit : '',

        // Registrasi
        jenis_pendaftaran: student.jenis_pendaftaran || '',
        nis: student.nis || '',
        tanggal_masuk: student.tanggal_masuk ? new Date(student.tanggal_masuk).toLocaleDateString('id-ID') : '',
        sekolah_asal: student.sekolah_asal || '',
        nomor_peserta_un: student.nomor_peserta_un || '',
        no_seri_ijazah: student.no_seri_ijazah || '',
        no_skhun: student.no_skhun || '',

        // Kesejahteraan
        kesejahteraan_jenis: student.kesejahteraan_jenis || '',
        kesejahteraan_no_kartu: student.kesejahteraan_no_kartu || '',
        kesejahteraan_nama_kartu: student.kesejahteraan_nama_kartu || '',

        // Prestasi 1
        prestasi_1_jenis: student.prestasi_1_jenis || '',
        prestasi_1_tingkat: student.prestasi_1_tingkat || '',
        prestasi_1_nama: student.prestasi_1_nama || '',
        prestasi_1_tahun: student.prestasi_1_tahun || '',
        prestasi_1_penyelenggara: student.prestasi_1_penyelenggara || '',
        prestasi_1_peringkat: student.prestasi_1_peringkat || '',

        // Prestasi 2
        prestasi_2_jenis: student.prestasi_2_jenis || '',
        prestasi_2_tingkat: student.prestasi_2_tingkat || '',
        prestasi_2_nama: student.prestasi_2_nama || '',
        prestasi_2_tahun: student.prestasi_2_tahun || '',
        prestasi_2_penyelenggara: student.prestasi_2_penyelenggara || '',
        prestasi_2_peringkat: student.prestasi_2_peringkat || '',

        // Prestasi 3
        prestasi_3_jenis: student.prestasi_3_jenis || '',
        prestasi_3_tingkat: student.prestasi_3_tingkat || '',
        prestasi_3_nama: student.prestasi_3_nama || '',
        prestasi_3_tahun: student.prestasi_3_tahun || '',
        prestasi_3_penyelenggara: student.prestasi_3_penyelenggara || '',
        prestasi_3_peringkat: student.prestasi_3_peringkat || '',

        // Beasiswa 1
        beasiswa_1_jenis: student.beasiswa_1_jenis || '',
        beasiswa_1_keterangan: student.beasiswa_1_keterangan || '',
        beasiswa_1_tahun_mulai: student.beasiswa_1_tahun_mulai || '',
        beasiswa_1_tahun_selesai: student.beasiswa_1_tahun_selesai || '',

        // Beasiswa 2
        beasiswa_2_jenis: student.beasiswa_2_jenis || '',
        beasiswa_2_keterangan: student.beasiswa_2_keterangan || '',
        beasiswa_2_tahun_mulai: student.beasiswa_2_tahun_mulai || '',
        beasiswa_2_tahun_selesai: student.beasiswa_2_tahun_selesai || ''
      });
    });

    // Add styling grid borders to all data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle' };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'CCCCCC' } },
            left: { style: 'thin', color: { argb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
            right: { style: 'thin', color: { argb: 'CCCCCC' } }
          };
        });
      }
    });

    // Set Response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Daftar_Ulang_SMANDA_2026.xlsx');

    // Write buffer and send
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Export Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengekspor data ke Excel.' });
  }
});

// ==========================================
// API: IMPORT ACCEPTED STUDENTS FROM EXCEL (POST /api/admin/import-accepted-students)
// ==========================================
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Hanya berkas spreadsheet Excel (.xlsx atau .xls) yang diperbolehkan.'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/api/admin/import-accepted-students', requireDaftarUlang, uploadExcel.single('excel_file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada berkas Excel yang diunggah.' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    // Pemetaan header kolom ke kolom database ws_accepted_students
    const headerMapping = {
      'nisn': 'nisn',
      'nama': 'name',
      'namalengkap': 'name',
      'namapeserta': 'name',
      'name': 'name',
      
      'jeniskelamin': 'gender',
      'jk': 'gender',
      'gender': 'gender',
      
      'nik': 'nik',
      
      'nokk': 'no_kk',
      'nomorkk': 'no_kk',
      'no_kk': 'no_kk',
      
      'tempatlahir': 'tempat_lahir',
      'tanggallahir': 'tanggal_lahir',
      
      'alamatlengkap': 'alamat_jalan',
      'alamat': 'alamat_jalan',
      'alamatjalan': 'alamat_jalan',
      
      'rt': 'rt',
      'rw': 'rw',
      'dusun': 'dusun',
      'kelurahan': 'kelurahan',
      'desa': 'kelurahan',
      'kecamatan': 'kecamatan',
      'kodepos': 'kode_pos',
      
      'asalsekolah': 'sekolah_asal',
      'sekolahasal': 'sekolah_asal',
      'smpasal': 'sekolah_asal',
      
      'namaayah': 'ayah_nama',
      'ayah': 'ayah_nama',
      'namaibu': 'ibu_nama',
      'ibu': 'ibu_nama',
      
      'nohp': 'phone',
      'phone': 'phone',
      'kontakorangtua': 'phone',
      'notelepon': 'phone',
      
      'titikkoordinat': 'titikkoordinat',
      'status': 'status',
      'pilihanditerima': 'pilihan_diterima',
      'email': 'email'
    };

    const studentsToUpsert = [];
    const errors = [];
    let totalRows = 0;
    let totalSheetsImported = 0;

    workbook.worksheets.forEach((worksheet) => {
      const headers = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value ? cell.value.toString().trim().toLowerCase().replace(/[\s_.\/()]+/g, '') : '';
      });

      // Validasi keberadaan kolom NISN di sheet ini. Jika tidak ada, lewati sheet (bisa jadi sheet instruksi/kosong)
      const nisnColIndex = headers.indexOf('nisn');
      if (nisnColIndex === -1) {
        return; // Lewati sheet ini secara aman
      }

      totalSheetsImported++;
      totalRows += Math.max(0, worksheet.rowCount - 1);

      // Baca baris data (mulai baris kedua)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Lewati header

        const studentData = {};
        let hasData = false;

        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (!header) return;

          const dbField = headerMapping[header];
          if (!dbField) return;

          let cellValue = cell.value;
          
          // Bersihkan data jika berupa object (formula, rich text, dll.)
          if (cellValue && typeof cellValue === 'object') {
            if (cellValue.text) {
              cellValue = cellValue.text;
            } else if (cellValue.result !== undefined) {
              cellValue = cellValue.result;
            } else {
              cellValue = cellValue.toString();
            }
          }

          if (cellValue !== null && cellValue !== undefined) {
            let val = cellValue.toString().trim();
            if (val !== '') {
              studentData[dbField] = val;
              hasData = true;
            }
          }
        });

        if (!hasData) return; // Lewati baris kosong

        // Validasi & Standarisasi NISN pada baris (pad leading zero jika Excel menghilangkan angka 0 di depan)
        let nisnVal = studentData.nisn;
        if (!nisnVal) {
          errors.push(`[Sheet: ${worksheet.name}] Baris ${rowNumber}: Kolom NISN kosong.`);
          return;
        }

        // Bersihkan spasi/karakter non-digit
        nisnVal = nisnVal.replace(/\D/g, '');

        // Jika 9 digit, tambahkan 0 di depan
        if (nisnVal.length === 9) {
          nisnVal = '0' + nisnVal;
        }

        studentData.nisn = nisnVal;
        
        if (!/^\d{10}$/.test(nisnVal)) {
          errors.push(`[Sheet: ${worksheet.name}] Baris ${rowNumber}: Format NISN "${studentData.nisn}" tidak valid (harus 10 digit angka).`);
          return;
        }

        // Standarisasi Gender jika ada
        if (studentData.gender) {
          const genVal = studentData.gender.toLowerCase();
          if (genVal === 'l' || genVal === 'laki-laki' || genVal === 'laki' || genVal === 'pria' || genVal === 'male') {
            studentData.gender = 'Laki-laki';
          } else if (genVal === 'p' || genVal === 'perempuan' || genVal === 'pr' || genVal === 'wanita' || genVal === 'female') {
            studentData.gender = 'Perempuan';
          }
        }

        // Standarisasi NIK & No KK jika diisi (harus dibersihkan menjadi string angka biasa)
        if (studentData.nik) {
          studentData.nik = studentData.nik.replace(/\D/g, '');
        }
        if (studentData.no_kk) {
          studentData.no_kk = studentData.no_kk.replace(/\D/g, '');
        }

        // Standarisasi Tanggal Lahir jika ada
        if (studentData.tanggal_lahir) {
          try {
            const dateCellIndex = headers.indexOf('tanggallahir');
            const dateCell = row.getCell(dateCellIndex);
            let d = null;
            if (dateCell && dateCell.value instanceof Date) {
              d = dateCell.value;
            } else {
              const cleanedDate = studentData.tanggal_lahir.replace(/[\/\.]/g, '-');
              const parts = cleanedDate.split('-');
              if (parts.length === 3) {
                if (parts[0].length === 4) {
                  d = new Date(parts[0], parts[1] - 1, parts[2]);
                } else if (parts[2].length === 4) {
                  d = new Date(parts[2], parts[1] - 1, parts[0]);
                }
              }
            }
            if (d && !isNaN(d.getTime())) {
              studentData.tanggal_lahir = d.toISOString().split('T')[0];
            } else {
              const parsed = new Date(studentData.tanggal_lahir);
              if (!isNaN(parsed.getTime())) {
                studentData.tanggal_lahir = parsed.toISOString().split('T')[0];
              } else {
                delete studentData.tanggal_lahir;
              }
            }
          } catch (err) {
            delete studentData.tanggal_lahir;
          }
        }

        // Standarisasi Titik Koordinat (ambil Lintang dan Bujur dari format "-6.9015, 107.6186")
        if (studentData.titikkoordinat) {
          const cleanedCoords = studentData.titikkoordinat.replace(/[()\[\]]/g, '');
          const coords = cleanedCoords.split(/[;,]/);
          if (coords.length >= 2) {
            studentData.lintang = coords[0].trim();
            studentData.bujur = coords[1].trim();
          } else {
            const spaceCoords = cleanedCoords.trim().split(/\s+/);
            if (spaceCoords.length >= 2) {
              studentData.lintang = spaceCoords[0].trim();
              studentData.bujur = spaceCoords[1].trim();
            } else if (coords.length === 1) {
              studentData.lintang = coords[0].trim();
            }
          }
          delete studentData.titikkoordinat;
        }

        studentsToUpsert.push(studentData);
      });
    });

    if (studentsToUpsert.length === 0) {
      return res.status(400).json({ error: 'Tidak ada baris data valid yang siap diimpor dari berkas Excel.', details: errors });
    }

    // Lakukan upsert secara batch ke Supabase
    const { error: upsertError } = await supabase
      .from('ws_accepted_students')
      .upsert(studentsToUpsert, { onConflict: 'nisn' });

    if (upsertError) {
      console.error('Database Upsert Error:', upsertError.message);
      return res.status(500).json({ error: 'Gagal menyimpan data siswa ke database.', dbError: upsertError.message });
    }

    return res.status(200).json({
      success: true,
      message: `Impor berkas Excel berhasil dari ${totalSheetsImported} sheet.`,
      stats: {
        totalSheets: totalSheetsImported,
        totalRows: totalRows,
        imported: studentsToUpsert.length,
        failed: errors.length
      },
      details: errors
    });

  } catch (err) {
    console.error('Import Accepted Students Error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat membaca berkas Excel.' });
  }
});



// ==========================================
// 7. API: INSTAGRAM POSTS — PUBLIC (GET /api/instagram-posts)
// ==========================================
app.get('/api/instagram-posts', async (req, res) => {
  try {
    const { data: posts, error: postsError } = await supabase
      .from('ws_instagram_posts')
      .select('id, post_url, caption, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (postsError) throw postsError;
    return res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error('Get Instagram Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengambil data postingan Instagram.' });
  }
});

// ==========================================
// 8. API: INSTAGRAM oembed PROXY (GET /api/instagram-oembed?url=...)
// ==========================================
app.get('/api/instagram-oembed', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.includes('instagram.com/p/')) {
    return res.status(400).json({ error: 'URL postingan Instagram tidak valid.' });
  }

  try {
    const https = require('https');
    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`;

    https.get(oembedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (igRes) => {
      let data = '';
      igRes.on('data', chunk => { data += chunk; });
      igRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.json({ success: true, html: parsed.html, thumbnail: parsed.thumbnail_url, author: parsed.author_name });
        } catch {
          res.status(520).json({ error: 'Respons oEmbed Instagram tidak valid.' });
        }
      });
    }).on('error', (e) => {
      res.status(502).json({ error: `Gagal menghubungi Instagram oEmbed: ${e.message}` });
    });

  } catch (err) {
    console.error('oEmbed Error:', err.message);
    return res.status(500).json({ error: 'Gagal proxy oEmbed Instagram.' });
  }
});

// ==========================================
// 9. API: ADMIN — GET ALL INSTAGRAM POSTS (GET /api/admin/instagram-posts)
// ==========================================
app.get('/api/admin/instagram-posts', requirePpid, async (req, res) => {
  try {
    const { data: posts, error: postsError } = await supabase
      .from('ws_instagram_posts')
      .select('*')
      .order('display_order', { ascending: true });

    if (postsError) throw postsError;
    return res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error('Admin Instagram Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengambil daftar postingan Instagram.' });
  }
});

// ==========================================
// 10. API: ADMIN — ADD/UPDATE INSTAGRAM POST (POST /api/admin/instagram-posts)
// ==========================================
app.post('/api/admin/instagram-posts', requirePpid, async (req, res) => {
  const { post_url, caption, display_order, id } = req.body;

  if (!post_url || !post_url.includes('instagram.com/p/')) {
    return res.status(400).json({ error: 'URL postingan Instagram tidak valid. Pastikan formatnya: https://www.instagram.com/p/XXXX/' });
  }

  try {
    if (id) {
      // Update existing
      const { error: updateError } = await supabase
        .from('ws_instagram_posts')
        .update({
          post_url: post_url.trim(),
          caption: caption || '',
          display_order: parseInt(display_order) || 0
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return res.status(200).json({ success: true, message: 'Postingan Instagram berhasil diperbarui.' });
    } else {
      // Insert new
      const { data: insertData, error: insertError } = await supabase
        .from('ws_instagram_posts')
        .insert({
          post_url: post_url.trim(),
          caption: caption || '',
          display_order: parseInt(display_order) || 0,
          is_active: true
        })
        .select();

      if (insertError) throw insertError;
      return res.status(200).json({ success: true, message: 'Postingan Instagram berhasil ditambahkan.', id: insertData[0].id });
    }
  } catch (err) {
    if (err.code === '23505' || (err.message && err.message.toLowerCase().includes('duplicate'))) {
      return res.status(400).json({ error: 'URL postingan ini sudah ada di database.' });
    }
    console.error('Save Instagram Error:', err.message);
    return res.status(500).json({ error: 'Gagal menyimpan postingan Instagram.' });
  }
});

// ==========================================
// 11. API: ADMIN — TOGGLE ACTIVE / DELETE INSTAGRAM POST
// ==========================================
app.post('/api/admin/instagram-posts/:id/toggle', requirePpid, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: post, error: getError } = await supabase
      .from('ws_instagram_posts')
      .select('is_active')
      .eq('id', id)
      .maybeSingle();

    if (getError) throw getError;
    if (!post) return res.status(404).json({ error: 'Postingan tidak ditemukan.' });

    const newState = !post.is_active;
    const { error: updateError } = await supabase
      .from('ws_instagram_posts')
      .update({ is_active: newState })
      .eq('id', id);

    if (updateError) throw updateError;
    return res.status(200).json({ success: true, is_active: newState ? 1 : 0 });
  } catch (err) {
    console.error('Toggle Instagram Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengubah status postingan.' });
  }
});

app.delete('/api/admin/instagram-posts/:id', requirePpid, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('ws_instagram_posts')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Postingan tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Postingan berhasil dihapus.' });
  } catch (err) {
    console.error('Delete Instagram Error:', err.message);
    return res.status(500).json({ error: 'Gagal menghapus postingan.' });
  }
});

// ==========================================
// 12. API: DYNAMIC TESTIMONIALS (GET /api/testimonials & POST /api/testimonials)
// ==========================================

const HATE_SPEECH_BLACKLIST = [
  'anjing', 'babi', 'bangsat', 'goblok', 'tolol', 'bajingan', 'kontol', 'memek', 
  'ngentot', 'perek', 'lonte', 'jancok', 'pantek', 'brengsek', 'bego', 'idiot', 
  'kafir', 'pki', 'bencong', 'banci', 'pelacur', 'sundal', 'ajg', 'bgsd',
  'mampus', 'keparat', 'modar', 'fuck', 'shit', 'bitch', 'asshole'
];

function containsHateSpeech(text) {
  if (!text) return false;
  
  // Normalize leetspeak / simple obfuscations
  let normalized = text.toLowerCase()
    .replace(/[0oO]/g, 'o')
    .replace(/[1iI!]/g, 'i')
    .replace(/[3eE]/g, 'e')
    .replace(/[4aA@]/g, 'a')
    .replace(/[5sS]/g, 's')
    .replace(/[7tT]/g, 't')
    .replace(/[^a-z0-9\s]/g, '');

  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (HATE_SPEECH_BLACKLIST.includes(word)) {
      return true;
    }
  }

  for (const blacklisted of HATE_SPEECH_BLACKLIST) {
    const regex = new RegExp(`\\b${blacklisted}\\b`, 'i');
    if (regex.test(normalized) || regex.test(text.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

app.get('/api/testimonials', async (req, res) => {
  try {
    const { data: testimonials, error: testError } = await supabase
      .from('ws_testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (testError) throw testError;
    return res.status(200).json({ success: true, data: testimonials });
  } catch (err) {
    console.error('Get Testimonials Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengambil data testimoni.' });
  }
});

app.post('/api/testimonials', upload.single('avatar'), async (req, res) => {
  const { name, role, message } = req.body;

  if (!name || !role || !message) {
    return res.status(400).json({ error: 'Semua isian testimoni wajib diisi!' });
  }

  if (name.length > 50 || role.length > 80 || message.length > 500) {
    return res.status(400).json({ error: 'Panjang teks melebihi batas karakter yang ditentukan.' });
  }

  if (containsHateSpeech(name) || containsHateSpeech(role) || containsHateSpeech(message)) {
    return res.status(400).json({ 
      error: 'Testimoni ditolak karena mengandung kata-kata yang tidak pantas atau ujaran kebencian.' 
    });
  }

  // Extra check: only images allowed for avatar (not PDF)
  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext === '.pdf') {
      return res.status(400).json({ error: 'Foto profil harus berupa gambar (JPG, JPEG, PNG).' });
    }
  }

  try {
    let avatarPath = 'assets/avatar_default.png';
    if (req.file) {
      avatarPath = await uploadToSupabaseStorage('avatars', req.file, name.trim().replace(/\s+/g, '_'));
    }

    const { data: newTestimonial, error: insertError } = await supabase
      .from('ws_testimonials')
      .insert({
        name: name.trim(),
        role: role.trim(),
        message: message.trim(),
        avatar: avatarPath
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      message: 'Testimoni Anda berhasil ditambahkan!',
      data: newTestimonial
    });
  } catch (err) {
    console.error('Post Testimonial Error:', err.message);
    return res.status(500).json({ error: 'Gagal menyimpan testimoni Anda.' });
  }
});

app.delete('/api/admin/testimonials/:id', requirePpid, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('ws_testimonials')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Testimoni tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Testimoni berhasil dihapus.' });
  } catch (err) {
    console.error('Delete Testimonial Error:', err.message);
    return res.status(500).json({ error: 'Gagal menghapus testimoni.' });
  }
});

// ==========================================
// 13. API: CONTACT MESSAGES — KIRIM PERTANYAAN (GET, POST, DELETE)
// ==========================================

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nama, email, dan detail pertanyaan wajib diisi.' });
  }
  
  if (name.length > 100 || email.length > 100 || message.length > 1000) {
    return res.status(400).json({ error: 'Panjang input melebihi batas karakter yang ditentukan.' });
  }
  
  if (containsHateSpeech(name) || containsHateSpeech(message)) {
    return res.status(400).json({ 
      error: 'Pertanyaan Anda ditolak karena mengandung kata-kata yang tidak pantas atau ujaran kebencian.' 
    });
  }
  
  try {
    const { error: insertError } = await supabase
      .from('ws_contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim(),
        message: message.trim()
      });

    if (insertError) throw insertError;

    return res.status(200).json({ 
      success: true, 
      message: 'Pertanyaan Anda berhasil terkirim! Panitia helpdesk kami akan segera menghubungi Anda melalui email.' 
    });
  } catch (err) {
    console.error('Post Contact Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengirimkan pertanyaan Anda.' });
  }
});

app.get('/api/admin/contact-messages', requirePpid, async (req, res) => {
  try {
    const { data: messages, error: messagesError } = await supabase
      .from('ws_contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;
    return res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error('Admin Contact Messages Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengambil data pesan kontak.' });
  }
});

app.delete('/api/admin/contact-messages/:id', requirePpid, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('ws_contact_messages')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Pesan berhasil dihapus.' });
  } catch (err) {
    console.error('Delete Contact Error:', err.message);
    return res.status(500).json({ error: 'Gagal menghapus pesan.' });
  }
});

app.post('/api/admin/contact-messages/:id/reply', requirePpid, async (req, res) => {
  const { id } = req.params;
  const { reply_message } = req.body;
  
  if (!reply_message || !reply_message.trim()) {
    return res.status(400).json({ error: 'Isi jawaban tidak boleh kosong.' });
  }
  
  try {
    const { data, error } = await supabase
      .from('ws_contact_messages')
      .update({
        reply_message: reply_message.trim(),
        status: 'Replied'
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Jawaban berhasil disimpan.' });
  } catch (err) {
    console.error('Reply Contact Error:', err.message);
    return res.status(500).json({ error: 'Gagal menyimpan jawaban.' });
  }
});


// ==========================================
// 14. API: PPID — GET SESSION COUNT (GET /api/ppid/session-count)
// ==========================================
app.get('/api/ppid/session-count', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Parameter tanggal (date) wajib disertakan.' });
  }

  try {
    // Count Sesi Pagi
    const { count: pagiCount, error: pagiError } = await supabase
      .from('ws_ppid_consultations')
      .select('*', { count: 'exact', head: true })
      .eq('consultation_date', date)
      .eq('session', 'Sesi Pagi (08:00 - 12:00 WIB)');

    if (pagiError) throw pagiError;

    // Count Sesi Siang
    const { count: siangCount, error: siangError } = await supabase
      .from('ws_ppid_consultations')
      .select('*', { count: 'exact', head: true })
      .eq('consultation_date', date)
      .eq('session', 'Sesi Siang (13:00 - 14:30 WIB)');

    if (siangError) throw siangError;

    return res.status(200).json({
      success: true,
      pagi: pagiCount || 0,
      siang: siangCount || 0
    });
  } catch (err) {
    console.error('Session Count Error:', err.message);
    return res.status(500).json({ error: 'Gagal menghitung kepadatan sesi.' });
  }
});

// Helper to parse queue number for numerical sorting (e.g. "A-01" -> {prefix: "A", num: 1})
function parseQueueNumber(qNum) {
  if (!qNum) return { prefix: '', num: 0 };
  const parts = qNum.split('-');
  if (parts.length === 2) {
    return {
      prefix: parts[0],
      num: parseInt(parts[1], 10) || 0
    };
  }
  return { prefix: qNum, num: 0 };
}

// Helper to recursively fetch all consultations from Supabase to bypass the 1000 row limit
async function getAllConsultations(date = null) {
  let allData = [];
  let from = 0;
  let to = 999;
  let keepFetching = true;
  
  while (keepFetching) {
    let query = supabase
      .from('ws_ppid_consultations')
      .select('*')
      .range(from, to)
      .order('consultation_date', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (date) {
      query = query.eq('consultation_date', date);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    allData = allData.concat(data || []);
    if (!data || data.length < 1000) {
      keepFetching = false;
    } else {
      from += 1000;
      to += 1000;
    }
  }
  return allData;
}

// Helper to sort consultations: date DESC, session ASC, queue_number ASC (numerical)
function sortConsultationsList(list) {
  return [...list].sort((a, b) => {
    // 1. Sort by consultation_date DESC
    const dateA = a.consultation_date || '';
    const dateB = b.consultation_date || '';
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }

    // 2. Sort by session ASC (Pagi first, then Siang)
    const aSession = a.session.includes('Pagi') ? 1 : 2;
    const bSession = b.session.includes('Pagi') ? 1 : 2;
    if (aSession !== bSession) {
      return aSession - bSession;
    }

    // 3. Sort by queue_number numerically
    const qa = parseQueueNumber(a.queue_number);
    const qb = parseQueueNumber(b.queue_number);
    if (qa.prefix !== qb.prefix) {
      return qa.prefix.localeCompare(qb.prefix);
    }
    return qa.num - qb.num;
  });
}

// ==========================================
// 14b. API: PPID — GET LIVE QUEUE FOR DISPLAY BOARD (GET /api/ppid/live)
// ==========================================
app.get('/api/ppid/live', async (req, res) => {
  try {
    // Get current date in WIB timezone (Bandung, Indonesia)
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

    // Determine current session based on local time in Jakarta
    const nowJakarta = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const currentHour = nowJakarta.getHours() + (nowJakarta.getMinutes() / 60);
    // Sesi Pagi ends at 12:00, Sesi Siang starts at 13:00. Threshold is set at 12.5 (12:30).
    const currentSession = currentHour < 12.5 ? 'Pagi' : 'Siang';

    // Fetch all consultations for today
    const { data: consultations, error } = await supabase
      .from('ws_ppid_consultations')
      .select('*')
      .eq('consultation_date', todayStr)
      .order('queue_number', { ascending: true });

    if (error) throw error;

    // Filter status
    const callingList = (consultations || [])
      .filter(c => c.status === 'Calling')
      // Sort so the latest updated_at (recently called) is first
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

    const upcomingList = (consultations || [])
      .filter(c => c.status === 'Pending')
      .sort((a, b) => {
        // Prioritize the current active session
        const aIsCurrent = a.session.includes(currentSession) ? 0 : 1;
        const bIsCurrent = b.session.includes(currentSession) ? 0 : 1;
        if (aIsCurrent !== bIsCurrent) return aIsCurrent - bIsCurrent;

        // If both are current or both are not current, sort Sesi Pagi first, then Sesi Siang
        const aSession = a.session.includes('Pagi') ? 1 : 2;
        const bSession = b.session.includes('Pagi') ? 1 : 2;
        if (aSession !== bSession) return aSession - bSession;

        // Sort by queue_number numerically
        const qa = parseQueueNumber(a.queue_number);
        const qb = parseQueueNumber(b.queue_number);
        if (qa.prefix !== qb.prefix) {
          return qa.prefix.localeCompare(qb.prefix);
        }
        return qa.num - qb.num;
      })
      .slice(0, 5);

    // Mask name for privacy (e.g. "Budi Santoso" -> "Budi S.")
    const maskName = (fullName) => {
      if (!fullName) return '';
      const parts = fullName.trim().split(/\s+/);
      if (parts.length <= 1) return fullName;
      return `${parts[0]} ${parts[1][0]}.`;
    };

    const stats = {
      total: (consultations || []).length,
      pending: (consultations || []).filter(c => c.status === 'Pending').length,
      calling: (consultations || []).filter(c => c.status === 'Calling').length,
      completed: (consultations || []).filter(c => c.status === 'Completed').length
    };

    return res.status(200).json({
      success: true,
      date: todayStr,
      calling: callingList.map(c => ({
        id: c.id,
        queue_number: c.queue_number,
        name: maskName(c.name),
        session: c.session.includes('Pagi') ? 'Pagi' : 'Siang'
      })),
      upcoming: upcomingList.map(c => ({
        id: c.id,
        queue_number: c.queue_number,
        name: maskName(c.name),
        session: c.session.includes('Pagi') ? 'Pagi' : 'Siang'
      })),
      stats
    });

  } catch (err) {
    console.error('Live Queue API Error:', err.message);
    return res.status(500).json({ error: 'Gagal memuat status live antrean.' });
  }
});

let ppidLock = Promise.resolve();

async function acquirePpidLock() {
  let release;
  const nextLock = new Promise(resolve => {
    release = resolve;
  });
  const currentLock = ppidLock;
  ppidLock = nextLock;
  await currentLock;
  return release;
}

// ==========================================
// 15. API: PPID — REGISTER CONSULTATION (POST /api/ppid/register)
// ==========================================
app.post('/api/ppid/register', async (req, res) => {
  const { name, role, phone, topic, consultation_date, session } = req.body;

  if (!name || !role || !phone || !topic || !consultation_date || !session) {
    return res.status(400).json({ error: 'Semua isian formulir wajib diisi!' });
  }

  if (name.length > 50 || phone.length > 20) {
    return res.status(400).json({ error: 'Panjang input nama atau nomor telepon melebihi batas.' });
  }

  if (containsHateSpeech(name) || containsHateSpeech(topic)) {
    return res.status(400).json({ error: 'Input ditolak karena mengandung kata-kata yang tidak pantas.' });
  }

  // Validate date is not in the past
  const todayStr = new Date().toISOString().split('T')[0];
  if (consultation_date < todayStr) {
    return res.status(400).json({ error: 'Tanggal konsultasi tidak boleh di masa lalu.' });
  }

  // Validate session format
  if (!['Sesi Pagi (08:00 - 12:00 WIB)', 'Sesi Siang (13:00 - 14:30 WIB)'].includes(session)) {
    return res.status(400).json({ error: 'Pilihan sesi waktu tidak valid.' });
  }

  // Acquire lock to prevent race conditions on sequence number generation
  const release = await acquirePpidLock();

  try {
    // 1. Fetch existing queue numbers for this date and session
    const { data: existing, error: fetchError } = await supabase
      .from('ws_ppid_consultations')
      .select('queue_number')
      .eq('consultation_date', consultation_date)
      .eq('session', session);

    if (fetchError) throw fetchError;

    // Check if session is full (limit: 500)
    if (existing && existing.length >= 500) {
      return res.status(400).json({ error: 'Mohon maaf, kuota antrean untuk sesi ini sudah penuh (maksimal 500 pendaftar).' });
    }

    // 2. Parse and determine the maximum sequence number (avoiding duplicates even after deletions)
    let maxSeq = 0;
    if (existing && existing.length > 0) {
      for (const row of existing) {
        if (row.queue_number) {
          const parts = row.queue_number.split('-');
          if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        }
      }
    }

    const seq = maxSeq + 1;
    const formattedSeq = String(seq).padStart(2, '0');
    const prefix = session.includes('Pagi') ? 'A' : 'B';
    const queueNumber = `${prefix}-${formattedSeq}`;

    // 3. Insert record
    const { data: newConsultation, error: insertError } = await supabase
      .from('ws_ppid_consultations')
      .insert({
        name: name.trim(),
        role: role.trim(),
        phone: phone.trim(),
        topic: topic.trim(),
        consultation_date,
        session,
        queue_number: queueNumber,
        status: 'Pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    if (!newConsultation) {
      throw new Error('Gagal menyimpan data pendaftaran antrean.');
    }

    // Generate QR Code containing verification URL/details
    const qrData = JSON.stringify({
      code: `SMANDA-PPID-${newConsultation.id}`,
      name: newConsultation.name,
      queue_number: newConsultation.queue_number,
      date: consultation_date,
      session: session
    });

    const qrBase64 = await qrCode.toDataURL(qrData);

    return res.status(200).json({
      success: true,
      message: 'Pendaftaran antrean PPID berhasil!',
      data: {
        ...newConsultation,
        qr_code: qrBase64
      }
    });

  } catch (err) {
    console.error('PPID Register Error:', err.message);
    return res.status(500).json({ error: 'Gagal memproses pendaftaran antrean. Terjadi kesalahan server.' });
  } finally {
    // Release the lock for the next concurrent request
    release();
  }
});

// ==========================================
// 16. API: PPID ADMIN — GET ALL CONSULTATIONS (GET /api/admin/ppid/consultations)
// ==========================================
app.get('/api/admin/ppid/consultations', requirePpid, async (req, res) => {
  try {
    const { date } = req.query;
    const consultations = await getAllConsultations(date);

    // Sort the list using numerical sorting for queue numbers
    const sortedConsultations = sortConsultationsList(consultations || []);

    return res.status(200).json({ success: true, consultations: sortedConsultations });
  } catch (err) {
    console.error('Fetch PPID Consultations Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengambil database antrean PPID.' });
  }
});

// ==========================================
// 17. API: PPID ADMIN — UPDATE STATUS (POST /api/admin/ppid/update-status/:id)
// ==========================================
app.post('/api/admin/ppid/update-status/:id', requirePpid, async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status || !['Pending', 'Calling', 'Completed', 'No Show'].includes(status)) {
    return res.status(400).json({ error: 'Status pelayanan tidak valid!' });
  }

  try {
    const { data, error } = await supabase
      .from('ws_ppid_consultations')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Data antrean tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, message: `Status antrean berhasil diubah ke: ${status}` });
  } catch (err) {
    console.error('Update PPID Status Error:', err.message);
    return res.status(500).json({ error: 'Gagal memperbarui status antrean.' });
  }
});

// ==========================================
// 18. API: PPID ADMIN — EXPORT LOGS (GET /api/admin/ppid/export)
// ==========================================
app.get('/api/admin/ppid/export', requirePpid, async (req, res) => {
  try {
    const fetchedRows = await getAllConsultations();

    // Sort the rows using the same custom numerical sorting function
    const rows = sortConsultationsList(fetchedRows || []);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Log Konsultasi PPID');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama Lengkap', key: 'name', width: 25 },
      { header: 'Kategori / Peran', key: 'role', width: 18 },
      { header: 'No. WhatsApp', key: 'phone', width: 18 },
      { header: 'Topik Konsultasi', key: 'topic', width: 25 },
      { header: 'Tanggal Rencana Datang', key: 'consultation_date', width: 25 },
      { header: 'Sesi Pelayanan', key: 'session', width: 30 },
      { header: 'Nomor Antrean', key: 'queue_number', width: 15 },
      { header: 'Status Pelayanan', key: 'status', width: 18 },
      { header: 'Catatan / Keterangan', key: 'notes', width: 35 },
      { header: 'Tanggal Daftar Online', key: 'created_at', width: 25 }
    ];

    // Style header row
    worksheet.getRow(1).font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '123F9C' } // Royal Blue theme
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add rows
    rows.forEach((item, index) => {
      worksheet.addRow({
        no: index + 1,
        name: item.name,
        role: item.role,
        phone: item.phone,
        topic: item.topic,
        consultation_date: item.consultation_date,
        session: item.session,
        queue_number: item.queue_number,
        status: item.status,
        notes: item.notes || '',
        created_at: new Date(item.created_at).toLocaleString('id-ID')
      });
    });

    // Style borders
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle' };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'CCCCCC' } },
            left: { style: 'thin', color: { argb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
            right: { style: 'thin', color: { argb: 'CCCCCC' } }
          };
        });
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Log_Antrean_PPID_SMANDA_2026.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('PPID Export Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengekspor data konsultasi ke Excel.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `File Upload Error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// Start Server Listen
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server SPMB SMAN 2 Bandung berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
