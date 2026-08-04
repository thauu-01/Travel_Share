require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travelshare';

async function cleanup() {
  console.log('🧹 Cleaning up generated test artifacts from MongoDB...');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // Clean test-generated posts
  const postRes = await db.collection('posts').deleteMany({
    $or: [
      { title: { $regex: /^test_auto_/i } },
      { title: { $regex: /^Selenium Test/i } }
    ]
  });
  console.log(`- Removed ${postRes.deletedCount} test posts.`);

  // Clean test-generated trips
  const tripRes = await db.collection('trips').deleteMany({
    $or: [
      { title: { $regex: /^test_auto_/i } },
      { title: { $regex: /^Selenium Trip/i } }
    ]
  });
  console.log(`- Removed ${tripRes.deletedCount} test trips.`);

  // Clean test-generated users (except initial seeded test users _id: 1 and _id: 2)
  const userRes = await db.collection('users').deleteMany({
    _id: { $gt: 2 },
    email: { $regex: /^test_auto_/i }
  });
  console.log(`- Removed ${userRes.deletedCount} test users.`);

  console.log('✅ Cleanup completed successfully!');
  await mongoose.disconnect();
}

cleanup().catch(err => {
  console.error('❌ Cleanup error:', err);
  process.exit(1);
});
