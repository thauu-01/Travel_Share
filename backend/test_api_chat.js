const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
const chatController = require('./controllers/ChatController');

async function testChat() {
  console.log("=== KIỂM TRA CHATBOX AI VỚI KEY MỚI ===");
  const req = {
    body: { message: "bài viết nào nhiều lượt tim nhất" },
    user: null
  };

  let resData = null;
  const res = {
    status: (code) => ({
      json: (data) => { resData = data; return data; }
    }),
    json: (data) => { resData = data; return data; }
  };

  await chatController.sendMessage(req, res);
  console.log("👉 Kết quả trả về:");
  console.log(JSON.stringify(resData, null, 2));
}

testChat();
