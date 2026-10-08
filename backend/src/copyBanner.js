const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\e894102d-ab53-47d7-8c29-e8ad1aeb7ca9\\sale_living_room_banner_1791439417629.jpg';
const dest = 'C:\\Users\\HP\\Desktop\\appzeto_first\\Riddha-interio-mart\\frontend\\src\\assets\\sale_living_room_banner.jpg';

try {
  fs.copyFileSync(src, dest);
  console.log('[BannerAsset] Copied sale_living_room_banner.jpg successfully to frontend/src/assets!');
} catch (e) {
  console.error('[BannerAsset] Copy error:', e.message);
}
