const mongoose = require('mongoose');
const database = require('./config/database');
const { Place, Post } = require('./models');

setTimeout(async () => {
  const places = await Place.find();
  for(let place of places) {
    const posts = await Post.find({ place_id: place._id });
    const avg = posts.filter(p => p.rating).reduce((acc, p) => acc + p.rating, 0) / (posts.filter(p => p.rating).length || 1);
    console.log(`Place: ${place.name} | Avg (DB): ${place.avg_rating} | Calculated: ${avg} | Posts: ${posts.map(p => p.rating)}`);
  }
  process.exit(0);
}, 2000);
