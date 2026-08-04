require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travelshare';

async function seed() {
  console.log('🌱 Connecting to MongoDB for seeding test data...');
  await mongoose.connect(MONGO_URI);

  const db = mongoose.connection.db;

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash(process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!', 10);
  const userPasswordHash = await bcrypt.hash(process.env.TEST_USER_PASSWORD || 'UserPass123!', 10);

  // 1. Ensure Admin User exists (ID: 1)
  await db.collection('users').updateOne(
    { _id: 1 },
    {
      $set: {
        _id: 1,
        full_name: 'System Admin Test',
        email: (process.env.TEST_ADMIN_EMAIL || 'admin_test@travelshare.com').toLowerCase(),
        password: adminPasswordHash,
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    },
    { upsert: true }
  );

  // 2. Ensure Regular User exists (ID: 2)
  await db.collection('users').updateOne(
    { _id: 2 },
    {
      $set: {
        _id: 2,
        full_name: 'Standard User Test',
        email: (process.env.TEST_USER_EMAIL || 'user_test@travelshare.com').toLowerCase(),
        password: userPasswordHash,
        role: 'user',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    },
    { upsert: true }
  );

  // 3. Ensure Basic Category exists (ID: 1)
  await db.collection('categories').updateOne(
    { _id: 1 },
    {
      $set: {
        _id: 1,
        name: 'Biển đảo',
        slug: 'bien-dao',
        icon: '🏖️',
        created_at: new Date(),
        updated_at: new Date()
      }
    },
    { upsert: true }
  );

  // 4. Ensure Basic Place exists (ID: 1)
  await db.collection('places').updateOne(
    { _id: 1 },
    {
      $set: {
        _id: 1,
        name: 'Bãi biển Mỹ Khê',
        slug: 'bai-bien-my-khe',
        province: 'Đà Nẵng',
        address: 'Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng',
        latitude: 16.0544,
        longitude: 108.2472,
        category_id: 1,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    },
    { upsert: true }
  );

  // 5. Ensure Basic Published Post exists (ID: 1)
  await db.collection('posts').updateOne(
    { _id: 1 },
    {
      $set: {
        _id: 1,
        title: 'Trải nghiệm du lịch Mỹ Khê Đà Nẵng',
        content: 'Bãi biển Mỹ Khê đẹp tuyệt vời với làn nước trong xanh và cát trắng mịn.',
        user_id: 1,
        place_id: 1,
        rating: 5,
        status: 'published',
        is_hidden: false,
        view_count: 100,
        created_at: new Date(),
        updated_at: new Date()
      }
    },
    { upsert: true }
  );

  console.log('✅ Seed test data completed successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
