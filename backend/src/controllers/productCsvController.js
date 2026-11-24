const { Readable } = require('stream');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const cacheService = require('../services/cacheService');

const MAX_ROWS = 2000;

// Column order = order in the downloaded template / export.
const COLUMNS = [
  'sku', 'name', 'description', 'shortDescription',
  'category', 'subcategory', 'subsubcategory', 'brand',
  'price', 'discountPrice', 'gstRate', 'hsnCode',
  'b2bPrice', 'b2bMinQty',
  'countInStock', 'weight', 'unit', 'unitValue',
  'material', 'dimensions', 'thickness', 'color',
  'tags', 'images', 'videoUrl', 'isActive'
];

const SAMPLE_ROWS = [
  {
    sku: 'SOFA-001', name: 'Modern 3 Seater Sofa', description: 'Comfortable fabric sofa with solid wood legs.',
    shortDescription: 'Fabric 3 seater sofa', category: 'Furniture', subcategory: '', subsubcategory: '', brand: 'Urban Living',
    price: 24999, discountPrice: 22999, gstRate: 18, hsnCode: '94016100', b2bPrice: 21999, b2bMinQty: 10,
    countInStock: 25, weight: 35, unit: 'piece', unitValue: 1, material: 'Fabric, Wood', dimensions: '210x90x85 cm',
    thickness: '', color: 'Beige', tags: 'sofa;living room;modern',
    images: 'https://example.com/images/sofa-1.jpg;https://example.com/images/sofa-2.jpg', videoUrl: '', isActive: 'TRUE'
  },
  {
    sku: 'TILE-002', name: 'Glossy Marble Tile 600x600', description: 'Premium vitrified marble finish floor tile.',
    shortDescription: 'Marble finish tile', category: 'Marble', subcategory: '', subsubcategory: '', brand: 'General',
    price: 85, discountPrice: '', gstRate: 18, hsnCode: '69072100', b2bPrice: 70, b2bMinQty: 100,
    countInStock: 500, weight: 1.2, unit: 'sqft', unitValue: 1, material: 'Vitrified', dimensions: '600x600 mm',
    thickness: '9 mm', color: 'White', tags: 'tile;marble', images: 'https://example.com/images/tile-1.jpg', videoUrl: '', isActive: 'TRUE'
  }
];

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Quote a CSV cell; also neutralise spreadsheet formula injection (=, +, -, @ at the start of text).
const cell = (value) => {
  if (value === undefined || value === null) return '';
  let s = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (rows) =>
  '﻿' + [COLUMNS.join(','), ...rows.map(r => COLUMNS.map(c => cell(r[c])).join(','))].join('\r\n') + '\r\n';

const sendCsv = (res, filename, body) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
};

// GET /api/products/bulk/template
exports.downloadTemplate = (req, res) => {
  sendCsv(res, 'product-bulk-upload-template.csv', toCsv(SAMPLE_ROWS));
};

// GET /api/products/bulk/export  — whole inventory in the same format as the template
exports.exportProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isBundle: { $ne: true } })
      .populate('category', 'subcategories name')
      .populate('brand', 'name')
      .lean();

    const rows = products.map(p => {
      const cat = p.category && typeof p.category === 'object' ? p.category : null;
      const sub = cat?.subcategories?.find(s => String(s._id) === String(p.subcategory));
      const subsub = sub?.subsubcategories?.find(s => String(s._id) === String(p.subsubcategory));
      return {
        sku: p.sku, name: p.name, description: p.description, shortDescription: p.shortDescription,
        category: cat?.name || '', subcategory: sub?.name || '', subsubcategory: subsub?.name || '',
        brand: p.brand?.name || '', price: p.price, discountPrice: p.discountPrice, gstRate: p.gstRate, hsnCode: p.hsnCode,
        b2bPrice: p.b2bPrice, b2bMinQty: p.b2bMinQty, countInStock: p.countInStock, weight: p.weight,
        unit: p.unit, unitValue: p.unitValue, material: p.material, dimensions: p.dimensions,
        thickness: p.thickness, color: p.color, tags: (p.tags || []).join(';'), images: (p.images || []).join(';'),
        videoUrl: p.videoUrl, isActive: p.isActive === false ? 'FALSE' : 'TRUE'
      };
    });
    sendCsv(res, `inventory-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  } catch (err) {
    next(err);
  }
};

const CANONICAL = new Map(COLUMNS.map(c => [c.toLowerCase(), c]));

// Excel in some regions saves CSV with ';' — detect it from the header line.
const sniffDelimiter = (buffer) => {
  const head = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));
  const firstLine = head.split(/\r?\n/)[0] || '';
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  return semis > commas ? ';' : ',';
};

const parseCsvBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const rows = [];
    Readable.from([buffer])
      .pipe(csv({
        separator: sniffDelimiter(buffer),
        // Match template columns regardless of capitals / stray spaces ("Price", " SKU ")
        mapHeaders: ({ header }) => {
          const h = header.replace(/^﻿/, '').trim();
          return CANONICAL.get(h.toLowerCase()) || h;
        },
        mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value),
        maxRowBytes: 1024 * 256
      }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });

const num = (v, label, { required = false, min = 0 } = {}) => {
  if (v === undefined || v === '') {
    if (required) throw new Error(`${label} is required`);
    return undefined;
  }
  const n = Number(String(v).replace(/[₹$\s,]|^rs\.?/gi, ''));
  if (Number.isNaN(n) || n < min) throw new Error(`${label} must be a number ≥ ${min}`);
  return n;
};

const list = (v) => (v ? String(v).split(/[;|]/).map(s => s.trim()).filter(Boolean) : undefined);

const isUrl = (s) => /^https?:\/\/\S+$/i.test(s);

// POST /api/products/bulk/import  (multipart, field "file")
exports.importProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please choose a CSV file.' });
    }

    let rows;
    try {
      rows = await parseCsvBuffer(req.file.buffer);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Could not read the file. Please upload a valid CSV.' });
    }
    if (!rows.length) return res.status(400).json({ success: false, error: 'The CSV has no product rows.' });
    if (rows.length > MAX_ROWS) {
      return res.status(400).json({ success: false, error: `Too many rows. Maximum ${MAX_ROWS} per upload.` });
    }
    const headers = Object.keys(rows[0]);
    const missingCols = ['name', 'description', 'price', 'category', 'countInStock'].filter(c => !headers.includes(c));
    if (missingCols.length) {
      return res.status(400).json({ success: false, error: `Missing column(s): ${missingCols.join(', ')}. Please use the downloaded template.` });
    }

    const [categories, brands] = await Promise.all([Category.find().lean(), Brand.find().lean()]);
    const catByName = new Map(categories.map(c => [c.name.trim().toLowerCase(), c]));

    // Memoise the *promise* so rows processed in parallel never create the same brand twice
    const brandPromises = new Map(brands.map(b => [b.name.trim().toLowerCase(), Promise.resolve(b)]));
    const resolveBrand = async (name) => {
      const label = (name || 'General').trim();
      const key = label.toLowerCase();
      if (!brandPromises.has(key)) {
        brandPromises.set(key, Brand.create({ name: label, isActive: true }).then(d => d.toObject()));
      }
      return (await brandPromises.get(key))._id;
    };

    // One query for every existing SKU instead of one lookup per row
    const skuIndex = new Map(
      (await Product.find({ sku: { $exists: true, $ne: '' } }).select('sku').lean()).map(p => [String(p.sku).toUpperCase(), p._id])
    );

    const seenSkus = new Set();
    const errors = [];
    let created = 0;
    let updated = 0;

    const processRow = async (i) => {
      const r = rows[i];
      const rowNum = i + 2; // header is row 1
      try {
        if (Object.values(r).every(v => !v)) return; // blank line

        const sku = r.sku ? r.sku.toUpperCase() : '';
        if (sku) {
          if (seenSkus.has(sku)) throw new Error(`Duplicate SKU "${sku}" in this file`);
          seenSkus.add(sku);
        }

        const existingId = sku ? skuIndex.get(sku) : null;
        const existing = existingId ? await Product.findById(existingId) : null;

        const data = {};
        if (r.name) data.name = r.name;
        if (r.description) data.description = r.description;
        if (r.shortDescription) data.shortDescription = r.shortDescription;
        if (r.hsnCode) data.hsnCode = r.hsnCode;
        ['material', 'dimensions', 'thickness', 'color', 'unit', 'videoUrl'].forEach(f => { if (r[f]) data[f] = r[f]; });
        if (r.unitValue) data.unitValue = String(r.unitValue);

        const price = num(r.price, 'price', { required: !existing, min: 0 });
        if (price !== undefined) { data.price = price; data.sellerPrice = price; }
        const discountPrice = num(r.discountPrice, 'discountPrice');
        if (discountPrice !== undefined) {
          if (price !== undefined && discountPrice >= price) throw new Error('discountPrice must be lower than price');
          data.discountPrice = discountPrice;
        }
        const gst = num(r.gstRate, 'gstRate'); if (gst !== undefined) data.gstRate = gst;
        const b2b = num(r.b2bPrice, 'b2bPrice'); if (b2b !== undefined) { data.b2bPrice = b2b; data.sellerB2bPrice = b2b; }
        const b2bQty = num(r.b2bMinQty, 'b2bMinQty'); if (b2bQty !== undefined) data.b2bMinQty = b2bQty;
        const stock = num(r.countInStock, 'countInStock', { required: !existing });
        if (stock !== undefined) {
          data.countInStock = Math.floor(stock);
          data.stock = data.countInStock > 0 ? 'in_stock' : 'out_of_stock';
        }
        const weight = num(r.weight, 'weight'); if (weight !== undefined) data.weight = weight;

        const tags = list(r.tags); if (tags) data.tags = tags;
        const images = list(r.images);
        if (images) {
          const bad = images.find(u => !isUrl(u));
          if (bad) throw new Error(`images must be full http(s) links ("${bad}")`);
          data.images = images;
        }
        if (r.isActive) data.isActive = !/^(false|0|no|n)$/i.test(r.isActive);

        // Category chain
        if (r.category) {
          const cat = catByName.get(r.category.toLowerCase());
          if (!cat) throw new Error(`Category "${r.category}" not found`);
          data.category = cat._id;
          if (r.subcategory) {
            const sub = (cat.subcategories || []).find(s => s.name.trim().toLowerCase() === r.subcategory.toLowerCase());
            if (!sub) throw new Error(`Subcategory "${r.subcategory}" not found in "${cat.name}"`);
            data.subcategory = sub._id;
            if (r.subsubcategory) {
              const ss = (sub.subsubcategories || []).find(s => s.name.trim().toLowerCase() === r.subsubcategory.toLowerCase());
              if (!ss) throw new Error(`Sub-subcategory "${r.subsubcategory}" not found in "${sub.name}"`);
              data.subsubcategory = ss._id;
            }
          } else if (r.subsubcategory) {
            throw new Error('subsubcategory needs a subcategory');
          }
        } else if (!existing) {
          throw new Error('category is required');
        }

        if (r.brand || !existing) data.brand = await resolveBrand(r.brand);

        if (existing) {
          Object.assign(existing, data);
          await existing.save();
          updated++;
        } else {
          if (!data.name) throw new Error('name is required');
          if (!data.description) throw new Error('description is required');
          if (images === undefined) data.images = [];
          await Product.create({
            ...data,
            ...(sku ? { sku } : {}),
            seller: req.user.id,
            sellerType: 'Admin',
            source: 'new',
            isApproved: true,
            approvalStatus: 'approved'
          });
          created++;
        }
      } catch (err) {
        const message = err.name === 'ValidationError'
          ? Object.values(err.errors).map(e => e.message).join(', ')
          : err.code === 11000 ? 'Duplicate value (SKU already exists)' : err.message;
        errors.push({ row: rowNum, sku: r.sku || '', name: r.name || '', message });
      }
    };

    // Duplicate SKUs inside the file are detected up front so parallel workers can't race on them
    const CONCURRENCY = 10;
    let next = 0;
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
      while (next < rows.length) await processRow(next++);
    }));
    errors.sort((a, b) => a.row - b.row);

    cacheService.delPattern('products:list:*');
    cacheService.delPattern('search:*');

    res.json({
      success: true,
      data: { total: rows.length, created, updated, failed: errors.length, errors: errors.slice(0, 200) }
    });
  } catch (err) {
    next(err);
  }
};
