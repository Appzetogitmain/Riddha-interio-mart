const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const csv = require('csv-parser');
const { cloudinary } = require('../config/cloudinary');
const Catalog = require('../models/Catalog');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

const extractZip = (zipFilePath, outputDir) => {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(zipFilePath);
      zip.extractAllTo(outputDir, true);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const parseCSV = (csvFilePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

const uploadImageToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'products'
    });
    return result.secure_url;
  } catch (error) {
    throw error;
  }
};

exports.bulkUpload = async (req, res) => {
  const tempFilesToCleanup = [];
  let imagesDirToCleanup = null;
  try {
    const csvFile = req.files['file'] ? req.files['file'][0] : null;
    const zipFile = req.files['images'] ? req.files['images'][0] : null;

    if (!csvFile || !zipFile) {
      return res.status(400).json({ success: false, message: 'Please provide both CSV and ZIP files.' });
    }

    tempFilesToCleanup.push(csvFile.path);
    tempFilesToCleanup.push(zipFile.path);

    const tempDir = path.join(__dirname, '../../uploads/temp');
    const imagesDir = path.join(tempDir, 'images', Date.now().toString());
    imagesDirToCleanup = imagesDir;
    
    // Ensure directories exist
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    // Step 2: Extract ZIP
    await extractZip(zipFile.path, imagesDir);

    // Step 3: Parse CSV
    const rows = await parseCSV(csvFile.path);

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    // Step 4: Process Rows
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // 1-indexed plus header
      const row = rows[i];

      try {
        // Validate required fields
        if (!row.name || !row.price || !row.description || !row.category || !row.brand || !row.weight || !row.image_name) {
          throw new Error('Missing required fields: name, price, description, category, brand, weight, image_name');
        }

        // Match image
        let imageFilePath = null;
        
        // Simple search in extracted dir
        const searchFiles = (dir) => {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
              const res = searchFiles(fullPath);
              if (res) return res;
            } else if (file === row.image_name) {
              return fullPath;
            }
          }
          return null;
        };

        imageFilePath = searchFiles(imagesDir);

        if (!imageFilePath) {
          throw new Error(`Image not found in ZIP: ${row.image_name}`);
        }

        // Upload to Cloudinary
        const imageUrl = await uploadImageToCloudinary(imageFilePath);

        // Find Category
        let category = await Category.findOne({ name: { $regex: new RegExp(`^${row.category}$`, 'i') } });
        if (!category) {
          category = await Category.create({ name: row.category, description: row.category });
        }

        // Find Brand
        let brand = await Brand.findOne({ name: { $regex: new RegExp(`^${row.brand}$`, 'i') } });
        if (!brand) {
          brand = await Brand.create({ name: row.brand });
        }

        // Insert into DB as Catalog
        await Catalog.create({
          name: row.name,
          sku: row.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          brand: brand._id,
          category: category.name,
          price: Number(row.price),
          stock: row.stock ? Number(row.stock) : (row.countInStock ? Number(row.countInStock) : 100),
          description: row.description,
          images: [imageUrl],
          material: row.material || '',
          dimensions: row.dimensions || '',
          isActive: true
        });

        successCount++;
      } catch (err) {
        failedCount++;
        errors.push({ row: rowNum, message: err.message });
      }
    }

    // Step 6: API Response
    res.json({
      success: true,
      data: {
        total: rows.length,
        success: successCount,
        failed: failedCount,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Bulk Upload Error:', error);
    res.status(500).json({ success: false, message: 'Server error during bulk upload.', error: error.message });
  } finally {
    // Cleanup temporary files and directory (only what we created)
    for (const filePath of tempFilesToCleanup) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Failed to delete temp file:', filePath, err);
      }
    }
    if (imagesDirToCleanup) {
      try {
        if (fs.existsSync(imagesDirToCleanup)) {
          fs.rmSync(imagesDirToCleanup, { recursive: true, force: true });
        }
      } catch (err) {
        console.error('Failed to delete temp images dir:', imagesDirToCleanup, err);
      }
    }
  }
};
