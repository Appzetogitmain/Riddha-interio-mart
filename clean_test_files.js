const fs = require('fs');
try {
  fs.unlinkSync(__filename);
  console.log('Self-deleted clean_test_files.js');
} catch (e) {}
