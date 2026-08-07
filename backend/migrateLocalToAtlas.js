const { MongoClient } = require('mongodb');
const dns = require('dns');
require('dotenv').config();

// Fix Windows Node.js querySrv ECONNREFUSED for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const localURI = 'mongodb://127.0.0.1:27017/travelshare';
const atlasURI = process.env.MONGODB_URI;

async function migrateData() {
  if (!atlasURI || !atlasURI.includes('mongodb+srv')) {
    console.error('❌ MONGODB_URI trong .env không phải là Atlas URI');
    process.exit(1);
  }

  console.log('🔄 Bắt đầu đồng bộ dữ liệu từ MongoDB Local (Compass) lên MongoDB Atlas Cloud...');

  let localClient, atlasClient;
  try {
    localClient = await MongoClient.connect(localURI);
    console.log('✓ Đã kết nối MongoDB Local (Compass)');

    atlasClient = await MongoClient.connect(atlasURI);
    console.log('✓ Đã kết nối MongoDB Cloud Atlas');

    const localDb = localClient.db('travelshare');
    const atlasDb = atlasClient.db('travelshare');

    const collections = await localDb.listCollections().toArray();
    console.log(`📌 Tìm thấy ${collections.length} collections từ Local database.`);

    for (const col of collections) {
      const colName = col.name;
      console.log(`\n⏳ Đang đồng bộ collection: "${colName}"...`);

      const docs = await localDb.collection(colName).find({}).toArray();

      // Clear existing Atlas collection first
      await atlasDb.collection(colName).deleteMany({});

      if (docs.length > 0) {
        await atlasDb.collection(colName).insertMany(docs);
        console.log(` ✅ Đã sao chép ${docs.length} bản ghi sang Atlas Cloud thành công!`);
      } else {
        console.log(` ℹ️ Collection "${colName}" trống, đã xóa sạch trên Cloud.`);
      }
    }

    console.log('\n🎉 HOÀN TẤT ĐỒNG BỘ 100%! Dữ liệu trên MongoDB Atlas đã hoàn toàn Y CHANG MongoDB Compass Local!');
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ dữ liệu:', error);
  } finally {
    if (localClient) await localClient.close();
    if (atlasClient) await atlasClient.close();
  }
}

migrateData();
