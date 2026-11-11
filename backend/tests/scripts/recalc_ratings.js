const mongoose = require('mongoose');
const database = require('./config/database');
const { Place, Post } = require('./models');

async function run() {
  try {
    const places = await Place.find();
    console.log(`Recalculating ratings for ${places.length} places...`);
    
    for (const place of places) {
      const result = await Post.aggregate([
        { $match: { place_id: place._id, rating: { $ne: null } } },
        { $group: { _id: '$place_id', avgRating: { $avg: '$rating' } } }
      ]);
      
      let avg = 0;
      if (result.length > 0) {
        avg = Math.round(result[0].avgRating * 10) / 10;
      }
      
      await Place.findByIdAndUpdate(place._id, { avg_rating: avg });
      console.log(`Place ${place._id}: new avg_rating = ${avg}`);
    }
    
    console.log('Finished recalculating all ratings!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
