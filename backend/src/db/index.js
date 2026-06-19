const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/musiccollab';
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected to', uri.split('@').pop());
}

module.exports = { connectDB };
