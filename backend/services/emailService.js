const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

async function sendOtpEmail(toEmail, otpCode, userName) {
  const mailOptions = {
    from: `"TravelShare" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Mã OTP Đặt lại Mật khẩu - TravelShare',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 40px;text-align:center;">
                    <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">✈️ TravelShare</div>
                    <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:6px;">Nền tảng chia sẻ du lịch Việt Nam</div>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Đặt lại mật khẩu</h2>
                    <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">Xin chào <strong>${userName || 'bạn'}</strong>,<br>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    
                    <p style="margin:0 0 12px;color:#64748b;font-size:14px;">Mã OTP của bạn là (có hiệu lực trong <strong>10 phút</strong>):</p>
                    
                    <!-- OTP Code -->
                    <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
                      <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#2563eb;font-family:'Courier New',monospace;">${otpCode}</div>
                    </div>
                    
                    <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;">⚠️ Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
                    
                    <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 24px;">
                    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">© 2026 TravelShare • Chia sẻ &amp; Khám phá Du lịch Việt Nam</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
