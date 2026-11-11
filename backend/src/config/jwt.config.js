import dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'travelshare-default-jwt-secret-key-2026',
  expiresIn: process.env.JWT_EXPIRE || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'travelshare-default-refresh-secret-key-2026',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.SECURE_COOKIE === 'true',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  }
};

export default jwtConfig;
