const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../frontend/public');
const destDir = path.resolve(__dirname, 'src/assets');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = ['Userwellcome.png', 'logo.png', 'ask tejas final icon.png'];

files.forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied ${file} -> ${destFile}`);
  } else {
    console.warn(`Source file not found: ${srcFile}`);
  }
});
