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
 * Middleware: Verify Admin Authentication Cookie for API and Pages
 */
function requireAdminAuth(req, res, next) {
  const cookies = req.headers.cookie ? Object.fromEntries(req.headers.cookie.split('; ').map(c => c.split('='))) : {};
  const token = cookies.admin_token;
  
  if (verifyToken(token)) {
    next();
  } else {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Sesi verifikator tidak sah atau berakhir. Silakan login kembali.' });
    }
    res.redirect('/login.html');
  }
}

// Express Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Protected Admin Page Routes (Serve from private folder)
app.get('/admin.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});
app.get('/admin', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

// Admin API Authentication Middleware
// Exclude login endpoint so anonymous users can authenticate
app.use('/api/admin', (req, res, next) => {
  if (req.path === '/login') {
    return next();
  }
  requireAdminAuth(req, res, next);
});

// Admin Authentication API Endpoints
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken(username);
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);
    return res.status(200).json({ success: true, message: 'Login berhasil.' });
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
  const { nisn } = req.params;

  if (!/^\d+$/.test(nisn)) {
    return res.status(400).json({ error: 'Format NISN tidak valid! NISN harus berupa deretan angka.' });
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
      name: student.name 
    });

  } catch (err) {
    console.error('Cek NISN Error:', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem dalam pengecekan database.' });
  }
});

// ==========================================
// 2. API: SUBMIT RE-REGISTRATION (POST /api/register)
// ==========================================
app.post('/api/register', upload.fields([
  { name: 'kk_file', maxCount: 1 },
  { name: 'ppdb_file', maxCount: 1 }
]), async (req, res) => {
  const { nisn, name, email, phone, address, uniform_size } = req.body;

  // Basic fields validation
  if (!nisn || !name || !email || !phone || !address || !uniform_size) {
    return res.status(400).json({ error: 'Semua isian formulir wajib diisi!' });
  }

  // File uploads validation
  if (!req.files || !req.files['kk_file'] || !req.files['ppdb_file']) {
    return res.status(400).json({ error: 'Unggahan dokumen Kartu Keluarga dan Bukti Kelulusan PPDB wajib diunggah!' });
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

    // Upload files to Supabase Storage
    const kkPath = await uploadToSupabaseStorage('registrations', req.files['kk_file'][0], nisn);
    const ppdbPath = await uploadToSupabaseStorage('registrations', req.files['ppdb_file'][0], nisn);
    const regDate = new Date().toISOString();

    // Auto-allocate queue session based on registration count
    const { count, error: countError } = await supabase
      .from('ws_registrations')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    const seq = (count || 0) + 1;
    let queueSession = '';

    if (seq <= 100) {
      queueSession = 'Sesi 1: Rabu, 1 Juli 2026 (08:00 - 11:00 WIB)';
    } else if (seq <= 200) {
      queueSession = 'Sesi 2: Rabu, 1 Juli 2026 (13:00 - 15:00 WIB)';
    } else if (seq <= 300) {
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
        email,
        phone,
        address,
        uniform_size,
        kk_file_path: kkPath,
        ppdb_file_path: ppdbPath,
        registration_date: regDate,
        status: 'Pending',
        queue_session: queueSession
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
app.get('/api/admin/registrants', async (req, res) => {
  try {
    const { data: registrants, error: regError } = await supabase
      .from('ws_registrations')
      .select('*')
      .order('registration_date', { ascending: false });

    if (regError) throw regError;
    return res.status(200).json(registrants);
  } catch (err) {
    console.error('Admin Registrants Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengambil database pendaftar.' });
  }
});

// ==========================================
// 5. API: ADMIN - VERIFY REGISTRATION (POST /api/admin/verify/:nisn)
// ==========================================
app.post('/api/admin/verify/:nisn', async (req, res) => {
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
// 6. API: ADMIN - EXPORT TO EXCEL (GET /api/admin/export)
// ==========================================
app.get('/api/admin/export', async (req, res) => {
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
      { header: 'Email', key: 'email', width: 25 },
      { header: 'No. Telepon', key: 'phone', width: 18 },
      { header: 'Alamat Rumah', key: 'address', width: 40 },
      { header: 'Ukuran Baju', key: 'uniform_size', width: 12 },
      { header: 'Sesi Verifikasi Fisik', key: 'queue_session', width: 45 },
      { header: 'Tanggal Daftar', key: 'registration_date', width: 25 },
      { header: 'Catatan Verifikator', key: 'verification_notes', width: 30 }
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
        email: student.email,
        phone: student.phone,
        address: student.address,
        uniform_size: student.uniform_size,
        queue_session: student.queue_session,
        registration_date: new Date(student.registration_date).toLocaleString('id-ID'),
        verification_notes: student.verification_notes || ''
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
app.get('/api/admin/instagram-posts', async (req, res) => {
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
app.post('/api/admin/instagram-posts', async (req, res) => {
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
app.post('/api/admin/instagram-posts/:id/toggle', async (req, res) => {
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

app.delete('/api/admin/instagram-posts/:id', async (req, res) => {
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

app.get('/api/admin/contact-messages', async (req, res) => {
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

app.delete('/api/admin/contact-messages/:id', async (req, res) => {
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

app.post('/api/admin/contact-messages/:id/reply', async (req, res) => {
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

// ==========================================
// 14b. API: PPID — GET LIVE QUEUE FOR DISPLAY BOARD (GET /api/ppid/live)
// ==========================================
app.get('/api/ppid/live', async (req, res) => {
  try {
    // Get current date in WIB timezone (Bandung, Indonesia)
    const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
      .toISOString().split('T')[0];

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
        // Sort Sesi Pagi first, then Sesi Siang
        const aSession = a.session.includes('Pagi') ? 1 : 2;
        const bSession = b.session.includes('Pagi') ? 1 : 2;
        if (aSession !== bSession) return aSession - bSession;
        return a.queue_number.localeCompare(b.queue_number);
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

  try {
    // Count existing bookings for this date and session to generate sequential queue number
    const { count, error: countError } = await supabase
      .from('ws_ppid_consultations')
      .select('*', { count: 'exact', head: true })
      .eq('consultation_date', consultation_date)
      .eq('session', session);

    if (countError) throw countError;

    const seq = (count || 0) + 1;
    const formattedSeq = String(seq).padStart(2, '0');
    const prefix = session.includes('Pagi') ? 'A' : 'B';
    const queueNumber = `${prefix}-${formattedSeq}`;

    // Insert record
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

    // Generate QR Code containing verification URL/details
    const qrData = JSON.stringify({
      code: `SMANDA-PPID-${newConsultation.id}`,
      name: newConsultation.name,
      queue_number: queueNumber,
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
  }
});

// ==========================================
// 16. API: PPID ADMIN — GET ALL CONSULTATIONS (GET /api/admin/ppid/consultations)
// ==========================================
app.get('/api/admin/ppid/consultations', async (req, res) => {
  try {
    const { data: consultations, error: fetchError } = await supabase
      .from('ws_ppid_consultations')
      .select('*')
      .order('consultation_date', { ascending: false })
      .order('session', { ascending: true })
      .order('queue_number', { ascending: true });

    if (fetchError) throw fetchError;
    return res.status(200).json({ success: true, consultations });
  } catch (err) {
    console.error('Fetch PPID Consultations Error:', err.message);
    return res.status(500).json({ error: 'Gagal mengambil database antrean PPID.' });
  }
});

// ==========================================
// 17. API: PPID ADMIN — UPDATE STATUS (POST /api/admin/ppid/update-status/:id)
// ==========================================
app.post('/api/admin/ppid/update-status/:id', async (req, res) => {
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
app.get('/api/admin/ppid/export', async (req, res) => {
  try {
    const { data: rows, error: rowsError } = await supabase
      .from('ws_ppid_consultations')
      .select('*')
      .order('consultation_date', { ascending: false })
      .order('queue_number', { ascending: true });

    if (rowsError) throw rowsError;

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
