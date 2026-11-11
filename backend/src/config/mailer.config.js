import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

export const defaultFrom = `"TravelShare" <${process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@travelshare.vn'}>`;

export default {
  transporter,
  defaultFrom
};
