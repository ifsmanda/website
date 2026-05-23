/**
 * SMAN 2 BANDUNG — SPMB 2026 DATABASE MODULE
 * SQLite connection, tables initialization, and seed data.
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Resolve db path
const dbPath = path.resolve(__dirname, 'database.sqlite');

// Open connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Koneksi database SQLite gagal:', err.message);
  } else {
    console.log('Koneksi ke database SQLite berhasil.');
  }
});

// Run initialization in serialization mode
db.serialize(() => {
  // 1. Table for Accepted Students from Dinas PPDB (Pre-authorized list)
  db.run(`
    CREATE TABLE IF NOT EXISTS accepted_students (
      nisn TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `, (err) => {
    if (err) console.error('Gagal membuat tabel accepted_students:', err.message);
  });

  // 2. Table for Re-registrations
  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      nisn TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      uniform_size TEXT NOT NULL,
      kk_file_path TEXT NOT NULL,
      ppdb_file_path TEXT NOT NULL,
      registration_date TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      verification_date TEXT,
      verification_notes TEXT,
      queue_session TEXT NOT NULL,
      FOREIGN KEY(nisn) REFERENCES accepted_students(nisn)
    )
  `, (err) => {
    if (err) console.error('Gagal membuat tabel registrations:', err.message);
  });

  // 3. Table for Instagram Posts (admin-managed embed URLs)
  db.run(`
    CREATE TABLE IF NOT EXISTS instagram_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_url TEXT NOT NULL UNIQUE,
      caption TEXT DEFAULT '',
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Gagal membuat tabel instagram_posts:', err.message);
    else {
      // Seed with placeholder posts — admin harus update dengan URL asli dari @smandabandung
      db.get("SELECT COUNT(*) AS count FROM instagram_posts", [], (err2, row) => {
        if (!err2 && row.count === 0) {
          const seedPosts = [
            ['https://www.instagram.com/p/C-iQ1V6S2fA/', 'Reuni Besar VII SMAN 2 Bandung: Karetna Dua, Reuni Lada & Peresmian Amphitheater', 1],
            ['https://www.instagram.com/p/CG4m7X_A7uA/', 'Shakira Kayla Terpilih Mengikuti Kopi Good Day DBL Camp 2026', 2],
            ['https://www.instagram.com/p/CtunN3fOyQv/', 'Sosialisasi Alur & Mekanisme Seleksi SPMB Jabar 2026', 3],
            ['https://www.instagram.com/p/DAq00l8SR7G/', 'Lolos Fakultas Kedokteran Unhan RI, Violethanara Raih Beasiswa Penuh', 4],
          ];
          const stmtPosts = db.prepare("INSERT OR IGNORE INTO instagram_posts (post_url, caption, display_order) VALUES (?, ?, ?)");
          seedPosts.forEach(p => stmtPosts.run(p));
          stmtPosts.finalize(() => console.log('Data seed instagram_posts selesai. Silakan update dengan URL asli @smandabandung di panel Admin.'));
        }
      });
    }
  });

  // 3. Seed accepted_students with dummy candidates if table is empty
  db.get("SELECT COUNT(*) AS count FROM accepted_students", [], (err, row) => {
    if (err) {
      console.error('Gagal memeriksa data accepted_students:', err.message);
      return;
    }

    if (row.count === 0) {
      console.log('Tabel accepted_students kosong. Memasukkan data simulasi PPDB...');
      
      const seedData = [
        ['1234567890', 'Ahmad Fauzi'],
        ['1234567891', 'Budi Santoso'],
        ['1234567892', 'Citra Lestari'],
        ['1234567893', 'Dewi Sartika'],
        ['1234567894', 'Eko Prasetyo'],
        ['1234567895', 'Fitriani Hasanah'],
        ['1234567896', 'Gilang Ramadhan'],
        ['1234567897', 'Hendra Wijaya'],
        ['1234567898', 'Indah Permatasari'],
        ['1234567899', 'Joko Susilo']
      ];

      const stmt = db.prepare("INSERT INTO accepted_students (nisn, name) VALUES (?, ?)");
      seedData.forEach(student => {
        stmt.run(student, (stmtErr) => {
          if (stmtErr) console.error(`Gagal memasukkan data ${student[1]}:`, stmtErr.message);
        });
      });
      stmt.finalize(() => {
        console.log('Pemuatan data simulasi PPDB selesai.');
      });
    }
  });
});

// Helper functions wrapped in Promises
const dbHelper = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

module.exports = dbHelper;
