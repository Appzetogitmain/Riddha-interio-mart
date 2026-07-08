require('dotenv').config();
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Category = require('./models/Category');

const restore = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected.');

    const dumpPath = path.join(__dirname, '../db_dump.json');
    if (!fs.existsSync(dumpPath)) {
      console.log('No db_dump.json found. Exiting.');
      process.exit(0);
    }

    const dumpedProducts = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
    console.log(`Found ${dumpedProducts.length} products in db_dump.json`);

    const categories = await Category.find({}).lean();

    let updatedCount = 0;
    for (const dp of dumpedProducts) {
      if (dp.category && typeof dp.category === 'string') {
        const catNameLower = dp.category.trim().toLowerCase();
        const foundCat = categories.find(c => c.name.toLowerCase() === catNameLower || c.name.toLowerCase().includes(catNameLower) || catNameLower.includes(c.name.toLowerCase()));
        
        if (foundCat) {
          const updateData = { category: foundCat._id };

          if (dp.subcategory && typeof dp.subcategory === 'string' && dp.subcategory.trim() !== '') {
            const subNameLower = dp.subcategory.trim().toLowerCase();
            const subObj = foundCat.subcategories.find(s => 
              s.name.toLowerCase() === subNameLower || 
              s.name.toLowerCase().includes(subNameLower.replace(' tiles', '')) || 
              subNameLower.includes(s.name.toLowerCase().replace(' tiles', '')) ||
              s.name.toLowerCase().replace(/\s+/g, '') === subNameLower.replace(/\s+/g, '')
            );
            
            if (subObj) {
              updateData.subcategory = subObj._id;
              
              if (dp.subsubcategory && typeof dp.subsubcategory === 'string' && dp.subsubcategory.trim() !== '') {
                const subsubNameLower = dp.subsubcategory.trim().toLowerCase();
                if (subObj.subsubcategories) {
                  const subsubObj = subObj.subsubcategories.find(ss => ss.name.toLowerCase() === subsubNameLower || ss.name.toLowerCase().includes(subsubNameLower));
                  if (subsubObj) {
                    updateData.subsubcategory = subsubObj._id;
                  }
                }
              }
            } else {
              console.log(`Failed to match subcategory "${dp.subcategory}" in category "${foundCat.name}"`);
            }
          }

          // Convert string _id to ObjectId
          const productId = new mongoose.Types.ObjectId(dp._id);
          await mongoose.connection.db.collection('products').updateOne(
            { _id: productId }, 
            { $set: updateData }
          );
          updatedCount++;
        } else {
          console.log(`Failed to match category "${dp.category}" for product ${dp._id}`);
        }
      }
    }
    console.log(`Restore completed. Updated ${updatedCount} products from db_dump.`);
    process.exit(0);
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
};

restore();
