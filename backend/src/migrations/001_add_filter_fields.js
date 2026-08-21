/**
 * Migration: Add filtering fields to Seller, Product, and UserProfile
 * Date: 2026-08-21
 *
 * This migration:
 * 1. Sets default location coordinates for all sellers (Kolkata center)
 * 2. Sets default stock status for all products
 * 3. Initializes empty specifications for products
 *
 * Run with: node backend/src/migrations/001_add_filter_fields.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const KOLKATA_CENTER = [88.3639, 22.5726]; // [longitude, latitude]

async function migrate() {
  try {
    console.log('🔄 Starting migration: Add filter fields...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interio-mart');
    console.log('✅ Connected to MongoDB\n');

    const Seller = require('../models/Seller');
    const Product = require('../models/Product');
    const UserProfile = require('../models/UserProfile');

    // Migration 1: Sellers - Set default location and verification status
    console.log('📍 Migrating Sellers...');
    const sellerUpdateResult = await Seller.updateMany(
      {
        $or: [
          { 'location.coordinates.coordinates': { $exists: false } },
          { location: { $exists: false } }
        ]
      },
      {
        $set: {
          'location.coordinates': {
            type: 'Point',
            coordinates: KOLKATA_CENTER
          },
          region: 'kolkata',
          verificationStatus: 'verified' // Mark existing vendors as verified
        }
      }
    );
    console.log(`   ✓ Updated ${sellerUpdateResult.modifiedCount} sellers`);
    console.log(`   ✓ Matched ${sellerUpdateResult.matchedCount} sellers\n`);

    // Migration 2: Products - Set default stock status
    console.log('📦 Migrating Products...');
    const productStockUpdate = await Product.updateMany(
      { stock: { $exists: false } },
      { $set: { stock: 'in_stock' } }
    );
    console.log(`   ✓ Updated ${productStockUpdate.modifiedCount} products with stock status`);
    console.log(`   ✓ Matched ${productStockUpdate.matchedCount} products\n`);

    // Initialize newArrivalDate for products without it
    const productDateUpdate = await Product.updateMany(
      { newArrivalDate: { $exists: false } },
      { $set: { newArrivalDate: new Date() } }
    );
    console.log(`   ✓ Updated ${productDateUpdate.modifiedCount} products with newArrivalDate\n`);

    // Migration 3: UserProfile - Initialize location and filter preferences
    console.log('👤 Migrating UserProfiles...');
    const userProfileUpdate = await UserProfile.updateMany(
      { location: { $exists: false } },
      {
        $set: {
          location: { coordinates: undefined },
          savedFilters: [],
          filterPreferences: {
            preferredDeliveryDays: [],
            preferredVendorType: [],
            preferredPriceRange: { min: 0, max: 500000 }
          }
        }
      }
    );
    console.log(`   ✓ Updated ${userProfileUpdate.modifiedCount} user profiles`);
    console.log(`   ✓ Matched ${userProfileUpdate.matchedCount} user profiles\n`);

    // Verification: Check results
    console.log('✅ Verification:');
    const sellerCount = await Seller.countDocuments({
      'location.coordinates.coordinates': { $exists: true }
    });
    console.log(`   ✓ Sellers with coordinates: ${sellerCount}`);

    const productCount = await Product.countDocuments({ stock: { $exists: true } });
    console.log(`   ✓ Products with stock status: ${productCount}`);

    const userCount = await UserProfile.countDocuments({ location: { $exists: true } });
    console.log(`   ✓ UserProfiles with location field: ${userCount}\n`);

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrate();
