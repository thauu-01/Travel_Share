const mongoose = require('mongoose');
const database = require('./config/database');
const { Place, Post } = require('./models');

setTimeout(async () => {
  const place = await Place.findOne({ name: 'Bún bò Huế O Phượng' });
  console.log('place._id:', typeof place._id, place._id, 'place.id:', typeof place.id, place.id);
  
  const r1 = await Post.aggregate([{ $match: { place_id: place.id } }]);
  console.log('r1.length (using place.id):', r1.length);
  
  const r2 = await Post.aggregate([{ $match: { place_id: place._id } }]);
  console.log('r2.length (using place._id):', r2.length);
  
  process.exit(0);
}, 2000);
