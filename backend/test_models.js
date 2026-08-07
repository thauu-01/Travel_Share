const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = "[GCP_API_KEY]";

async function testAll() {
  const genAI = new GoogleGenerativeAI(apiKey);

  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-lite-preview-02-05',
    'gemini-2.0-flash-lite',
    'gemini-2.0-pro-exp-02-05'
  ];

  for (const m of models) {
    try {
      console.log(`Testing ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Chào bạn!");
      console.log(` SUCCESS with ${m}! Answer:`, result.response.text());
      return;
    } catch (err) {
      console.log(` Error with ${m}:`, err.message);
    }
  }
}

testAll();
