import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

export function getGeminiApiKey() {
  const key = (process.env.CHAT_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!key || key === 'your-chat-api-key-here' || key === 'AIzaSyD-your-gemini-api-key-here') {
    return '';
  }
  return key;
}

export function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export function getGroqClient() {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

export default {
  getGeminiApiKey,
  getGeminiClient,
  getGroqClient
};
