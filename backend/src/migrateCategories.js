require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

const connectDB = require('./config/db');

const migrate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected.');

    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products to check.`);

    let updatedCount = 0;
    for (const product of products) {
      if (typeof product.category === 'string') {
        const foundCat = await Category.findOne({ name: { $regex: new RegExp(`^${product.category.trim()}$`, 'i') } });
        if (foundCat) {
          const updateData = { category: foundCat._id };

          if (typeof product.subcategory === 'string' && product.subcategory.trim() !== '') {
            const subRegex = new RegExp(`^${product.subcategory.trim()}$`, 'i');
            const subObj = foundCat.subcategories.find(s => subRegex.test(s.name));
            if (subObj) {
              updateData.subcategory = subObj._id;
              
              if (typeof product.subsubcategory === 'string' && product.subsubcategory.trim() !== '') {
                const subsubRegex = new RegExp(`^${product.subsubcategory.trim()}$`, 'i');
                if (subObj.subsubcategories) {
                  const subsubObj = subObj.subsubcategories.find(ss => subsubRegex.test(ss.name));
                  if (subsubObj) {
                    updateData.subsubcategory = subsubObj._id;
                  } else {
                    updateData.subsubcategory = null;
                  }
                }
              }
            } else {
              updateData.subcategory = null;
            }
          }

          await Product.collection.updateOne({ _id: product._id }, { $set: updateData });
          updatedCount++;
        } else {
          console.log(`Warning: Category "${product.category}" not found in DB for Product ${product._id}`);
          const genCat = await Category.findOne();
          if (genCat) {
             await Product.collection.updateOne({ _id: product._id }, { $set: { category: genCat._id } });
             updatedCount++;
          }
        }
      }
    }
    console.log(`Migration completed. Updated ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
