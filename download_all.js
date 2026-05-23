const https = require('https');
const fs = require('fs');
const path = require('path');

const ids = [
  '1tjKW3javbgF6Kx8TCYTaB-jjsyNVf9uE',
  '1E4UJ2hKYcoN9OPk4YodLrrv66iTfdxju',
  '1qcaVyIxbP7q-vMvDnLeD45DgQl7PJzPd',
  '1PhJIxdfiW35T4uyLMqKBswUSjeAgywBV',
  '1IjPpzXPLir5gEZ4dGQ3e4sB_G6HNxN2Z',
  '1u_2YOVg4KXVh9tYahPPAfV0bN28cVOAS',
  '1aUSaFZ7EojxVCtA7x6cVByYyt1dOgF48',
  '1FBkRgODhbVaDhrX9HmCLE-NaGnuwv-42',
  '1C8YWi0kiD2eVwveuLmhqA9kabbBWk8bt',
  '1JuY2zIWvfWtsVs-EktntalCIHbmUF5OX',
  '1pSygZCBLLrCQkLTZafGQLMWanMpO50JB',
  '1M7FvKM_5LQjK72NUk6UbQ9U48qO8auGX',
  '1Hk-0OjGOo7_OMW-EgO-pIpC8TnKO0a9W',
  '1rGSTjZFLBnubJg_pEZzC19jEFepV0zJg',
  '1MoGx8zO3Gw4TWtr-2t67qmrTjgwibTFp',
  '1aubYMaWUeaSh0DDWDIivKLAjCWaGOZKA',
  '1uQ_GBehB3Nobygsf3gUX49Q2YAy3h8b3',
  '1OgUhMN2KSM1xi-7zosv8lQe61Gpb4z_-',
  '1nMU8oan0Xq_SMGpIrymfg1cz114PA8ki'
];

const destDir = path.join(__dirname, 'public', 'assets');

function getExtension(contentType) {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  return '';
}

function downloadFile(id) {
  return new Promise((resolve) => {
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    
    function req(downloadUrl, retryCount = 0) {
      https.get(downloadUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        const status = res.statusCode;
        
        // Handle redirect
        if (status >= 300 && status < 400 && res.headers.location) {
          if (retryCount < 5) {
            req(res.headers.location, retryCount + 1);
          } else {
            console.error(`[${id}] Max redirects reached`);
            resolve(null);
          }
          return;
        }
        
        if (status !== 200) {
          console.error(`[${id}] Failed with status ${status}`);
          resolve(null);
          return;
        }
        
        const contentType = res.headers['content-type'] || '';
        const ext = getExtension(contentType);
        
        if (!ext && !contentType.includes('application/octet-stream') && !contentType.includes('application/binary')) {
          console.log(`[${id}] Skipping non-image: ${contentType}`);
          resolve(null);
          return;
        }
        
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          // If content-type was octet-stream/binary, try to detect image type from buffer header
          let finalExt = ext;
          if (!finalExt) {
            // Simple magic bytes check
            if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
              finalExt = '.jpg';
            } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
              finalExt = '.png';
            } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
              finalExt = '.webp';
            }
          }
          
          if (!finalExt) {
            console.log(`[${id}] Buffer header did not match image. Skipping.`);
            resolve(null);
            return;
          }
          
          const filename = `gallery_drive_${id}${finalExt}`;
          const destPath = path.join(destDir, filename);
          fs.writeFileSync(destPath, buffer);
          console.log(`[${id}] Downloaded successfully: ${filename} (${buffer.length} bytes)`);
          resolve({ id, filename, size: buffer.length });
        });
      }).on('error', (err) => {
        console.error(`[${id}] Error:`, err.message);
        resolve(null);
      });
    }
    
    req(url);
  });
}

async function main() {
  console.log(`Starting download of ${ids.length} potential files to ${destDir}...`);
  const results = [];
  
  // Download sequentially to avoid rate limits
  for (const id of ids) {
    const result = await downloadFile(id);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\n--- SUMMARY ---');
  console.log(`Successfully downloaded ${results.length} images:`);
  console.log(JSON.stringify(results, null, 2));
}

main();
