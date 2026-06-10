const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      if (col.name === 'products') {
        const indexes = await mongoose.connection.db.collection(col.name).indexes();
        console.log(`Indexes for ${col.name}:`);
        console.log(JSON.stringify(indexes, null, 2));
      }
    }
    await mongoose.connection.close();
    console.log("Done");
  } catch (err) {
    console.error(err);
  }
};

run();
