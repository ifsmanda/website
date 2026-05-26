/**
 * SMAN 2 BANDUNG — SPMB 2026 DATABASE MODULE
 * Supabase client initialization and automated storage bucket configuration.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Kredensial Supabase (SUPABASE_URL/SUPABASE_KEY) tidak ditemukan di file .env');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Koneksi ke Supabase Client berhasil terinisialisasi.');

/**
 * Automate storage bucket check & creation on startup
 */
async function initStorage() {
  try {
    const bucketsToCreate = ['registrations', 'avatars'];
    
    // List existing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Gagal memindai storage buckets Supabase:', error.message);
      return;
    }
    
    const existingNames = (buckets || []).map(b => b.name);
    
    for (const bucketName of bucketsToCreate) {
      if (!existingNames.includes(bucketName)) {
        console.log(`Membuat storage bucket "${bucketName}" di Supabase...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 2 * 1024 * 1024 // 2MB
        });
        
        if (createError) {
          console.error(`Gagal membuat bucket "${bucketName}":`, createError.message);
        } else {
          console.log(`Storage bucket "${bucketName}" berhasil dibuat dengan visibilitas Publik.`);
        }
      } else {
        console.log(`Storage bucket "${bucketName}" sudah tersedia di Supabase.`);
      }
    }
  } catch (err) {
    console.error('Terjadi error saat inisialisasi storage Supabase:', err.message);
  }
}

// Run bucket setup asynchronously in the background
initStorage();

module.exports = supabase;
