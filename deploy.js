/**
 * CostcoHealth USA - Node.js Netlify API Deployment Script
 * Run with: node deploy.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const projectDir = __dirname;
const configFile = path.join(projectDir, 'netlify_config.json');

// 1. Read config
let config = { NETLIFY_AUTH_TOKEN: '', NETLIFY_SITE_ID: '' };
if (fs.existsSync(configFile)) {
  try {
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (e) {}
}

const token = process.env.NETLIFY_AUTH_TOKEN || config.NETLIFY_AUTH_TOKEN;
const siteId = process.env.NETLIFY_SITE_ID || config.NETLIFY_SITE_ID;

if (!token || token.trim() === '') {
  console.error('\x1b[31m[-] Thiếu NETLIFY_AUTH_TOKEN trong file netlify_config.json!\x1b[0m');
  console.log('Vui lòng mở file netlify_config.json và dán Token vào.');
  process.exit(1);
}

// 2. Packaging files using PowerShell Compress-Archive
console.log('\x1b[36m[1/2] Đang đóng gói website...\x1b[0m');
const tempZip = path.join(process.env.TEMP || '.', `deploy_${Date.now()}.zip`);
const stageDir = path.join(process.env.TEMP || '.', `stage_${Date.now()}`);

try {
  fs.mkdirSync(stageDir, { recursive: true });
  fs.readdirSync(projectDir).forEach(f => {
    const isImage = f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.svg') || f.endsWith('.ico');
    const isWebFile = f.endsWith('.html') || f.endsWith('.css') || f.endsWith('.js') || f.endsWith('.json') || f === '_redirects' || f === 'robots.txt';
    const isExcluded = ['deploy.js', 'deploy.ps1', 'netlify_config.json'].includes(f);

    if ((isImage || isWebFile) && !isExcluded) {
      const src = path.join(projectDir, f);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(stageDir, f));
      }
    }
  });

  const imagesDir = path.join(projectDir, 'images');
  if (fs.existsSync(imagesDir)) {
    fs.cpSync(imagesDir, path.join(stageDir, 'images'), { recursive: true });
  }

  const stageDirEscaped = stageDir.replace(/'/g, "''");
  const tempZipEscaped = tempZip.replace(/'/g, "''");
  execSync(`powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${stageDirEscaped}', '${tempZipEscaped}')"`, { stdio: 'ignore' });
  const zipBuffer = fs.readFileSync(tempZip);

  // 3. API Upload
  console.log('\x1b[36m[2/2] Đang tải lên Netlify API...\x1b[0m');
  const apiPath = siteId && siteId.trim() !== '' 
    ? `/api/v1/sites/${siteId.trim()}/deploys`
    : `/api/v1/sites`;

  const req = https.request({
    hostname: 'api.netlify.com',
    port: 443,
    path: apiPath,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.trim()}`,
      'Content-Type': 'application/zip',
      'Content-Length': zipBuffer.length
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const liveUrl = json.ssl_url || json.url || json.deploy_ssl_url;
          const returnedSiteId = json.site_id || json.id;

          console.log('\x1b[32m========================================================\x1b[0m');
          console.log('\x1b[32m  DEPLOY THÀNH CÔNG LÊN NETLIFY!\x1b[0m');
          console.log('\x1b[32m========================================================\x1b[0m');
          console.log(`\x1b[33m* Link trực tiếp: ${liveUrl}\x1b[0m`);
          console.log(`* Site ID: ${returnedSiteId}`);

          // Save Site ID
          if (returnedSiteId && config.NETLIFY_SITE_ID !== returnedSiteId) {
            config.NETLIFY_SITE_ID = returnedSiteId;
            config.NETLIFY_AUTH_TOKEN = token.trim();
            fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
          }
        } else {
          console.error('\x1b[31m[-] Lỗi từ Netlify API:\x1b[0m', json.message || data);
        }
      } catch (err) {
        console.error('Lỗi parse response:', err);
      } finally {
        // Cleanup
        try { fs.unlinkSync(tempZip); } catch(e) {}
        try { fs.rmSync(stageDir, { recursive: true, force: true }); } catch(e) {}
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e);
    try { fs.unlinkSync(tempZip); } catch(e) {}
    try { fs.rmSync(stageDir, { recursive: true, force: true }); } catch(e) {}
  });

  req.write(zipBuffer);
  req.end();

} catch (e) {
  console.error('Lỗi đóng gói:', e);
  try { fs.unlinkSync(tempZip); } catch(e) {}
  try { fs.rmSync(stageDir, { recursive: true, force: true }); } catch(e) {}
}
