const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'Test@123';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Mật khẩu:', password);
  console.log('Hash bcrypt:', hashedPassword);
}

generateHash();
