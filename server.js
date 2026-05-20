/**
 * SMAN 2 BANDUNG — SPMB 2026 EXPRESS BACKEND SERVER
 * Handles static routing, file uploads, SQLite operations, QR receipt generation, and Excel exports.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const qrCode = require('qrcode');
const ExcelJS = require('exceljs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8000;

// Express Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public/'
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files statically under /uploads (for admin viewing)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer Storage Configuration for Document Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate clean file name: nisn-fieldname-timestamp.ext
    const nisn = req.body.nisn || 'anonymous';
    const fieldName = file.fieldname;
    const extension = path.extname(file.originalname);
    cb(null, `${nisn}-${fieldName}-${Date.now()}${extension}`);
  }
});

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

// ==========================================
// 1. API: CHECK ELIGIBILITY (GET /api/check-nisn/:nisn)
// ==========================================
app.get('/api/check-nisn/:nisn', async (req, res) => {
  const { nisn } = req.params;

  if (!/^\d+$/.test(nisn)) {
    return res.status(400).json({ error: 'Format NISN tidak valid! NISN harus berupa deretan angka.' });
  }

  try {
    // Check if the student is accepted in SMAN 2 Bandung based on Dinas list
    const student = await db.get('SELECT * FROM accepted_students WHERE nisn = ?', [nisn]);
    if (!student) {
      return res.status(404).json({ 
        error: 'NISN tidak terdaftar di database kelulusan SMAN 2 Bandung berdasarkan hasil PPDB Dinas Pendidikan.' 
      });
    }

    // Check if they have already submitted a re-registration
    const registration = await db.get('SELECT * FROM registrations WHERE nisn = ?', [nisn]);
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
    console.error(err);
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
    const student = await db.get('SELECT * FROM accepted_students WHERE nisn = ?', [nisn]);
    if (!student) {
      return res.status(404).json({ error: 'NISN tidak terdaftar di database kelulusan PPDB.' });
    }

    // Check duplicate
    const checkDuplicate = await db.get('SELECT * FROM registrations WHERE nisn = ?', [nisn]);
    if (checkDuplicate) {
      return res.status(400).json({ error: 'NISN ini sudah didaftarkan sebelumnya!' });
    }

    const kkPath = `/uploads/${req.files['kk_file'][0].filename}`;
    const ppdbPath = `/uploads/${req.files['ppdb_file'][0].filename}`;
    const regDate = new Date().toISOString();

    // Auto-allocate queue session based on registration count
    const countRow = await db.get('SELECT COUNT(*) AS count FROM registrations');
    const seq = countRow.count + 1;
    let queueSession = '';

    if (seq <= 100) {
      queueSession = 'Sesi 1: Senin, 26 Juni 2026 (08:00 - 11:00 WIB)';
    } else if (seq <= 200) {
      queueSession = 'Sesi 2: Senin, 26 Juni 2026 (13:00 - 15:00 WIB)';
    } else if (seq <= 300) {
      queueSession = 'Sesi 3: Selasa, 27 Juni 2026 (08:00 - 11:00 WIB)';
    } else {
      queueSession = 'Sesi 4: Selasa, 27 Juni 2026 (13:00 - 15:00 WIB)';
    }

    // Insert record
    await db.run(`
      INSERT INTO registrations (
        nisn, name, email, phone, address, uniform_size, 
        kk_file_path, ppdb_file_path, registration_date, 
        status, queue_session
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `, [nisn, name, email, phone, address, uniform_size, kkPath, ppdbPath, regDate, queueSession]);

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
    console.error(err);
    return res.status(500).json({ error: 'Gagal memproses pendaftaran. Terjadi kesalahan server.' });
  }
});

// ==========================================
// 3. API: GET RECEIPT DATA (GET /api/receipt/:nisn)
// ==========================================
app.get('/api/receipt/:nisn', async (req, res) => {
  const { nisn } = req.params;

  try {
    const reg = await db.get('SELECT * FROM registrations WHERE nisn = ?', [nisn]);
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
    console.error(err);
    return res.status(500).json({ error: 'Gagal mengambil data tanda bukti.' });
  }
});

// ==========================================
// 4. API: ADMIN - GET ALL REGISTRANTS (GET /api/admin/registrants)
// ==========================================
app.get('/api/admin/registrants', async (req, res) => {
  try {
    // Fetch all registrants sorted by registration date desc
    const registrants = await db.all('SELECT * FROM registrations ORDER BY registration_date DESC');
    return res.status(200).json(registrants);
  } catch (err) {
    console.error(err);
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
    const result = await db.run(`
      UPDATE registrations
      SET status = ?, verification_date = ?, verification_notes = ?
      WHERE nisn = ?
    `, [status, verifyDate, notes || '', nisn]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Data pendaftar tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, message: `Status pendaftaran berhasil diubah ke: ${status}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Gagal melakukan verifikasi berkas.' });
  }
});

// ==========================================
// 6. API: ADMIN - EXPORT TO EXCEL (GET /api/admin/export)
// ==========================================
app.get('/api/admin/export', async (req, res) => {
  try {
    // Fetch all verified registrations
    const rows = await db.all('SELECT * FROM registrations WHERE status = "Verified" ORDER BY name ASC');
    
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
    console.error(err);
    return res.status(500).json({ error: 'Gagal mengekspor data ke Excel.' });
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
app.listen(PORT, () => {
  console.log(`Server SPMB SMAN 2 Bandung berjalan di http://localhost:${PORT}`);
});
