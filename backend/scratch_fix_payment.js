const mongoose = require('mongoose');
require('dotenv').config();
const { Payment, User } = require('./models');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const p = await Payment.findOne({ txn_ref: 'TS17863483193121' });
    if (p && p.status === 'pending') {
      p.status = 'success';
      p.vnp_response_code = '00';
      await p.save();
      await User.findByIdAndUpdate(p.user_id, { $inc: { ai_credits: p.credits_purchased } });
      console.log('✅ Updated TS17863483193121 to success and added +5 credits!');
    } else {
      console.log('Current payment status:', p ? p.status : 'Not found');
    }
  } catch (err) {
    console.error('Error fixing payment:', err);
  } finally {
    await mongoose.disconnect();
  }
}
fix();
