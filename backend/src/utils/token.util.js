import jwt from 'jsonwebtoken';

function getJwtSecrets() {
  return {
    accessSecret: process.env.JWT_SECRET || 'travelshare-default-jwt-secret-key-2026',
    accessExpiresIn: process.env.JWT_EXPIRE || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'travelshare-default-refresh-secret-key-2026',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  };
}

export function generateAccessToken(user) {
  const { accessSecret, accessExpiresIn } = getJwtSecrets();
  return jwt.sign(
    { id: user.id || user._id, email: user.email, role: user.role },
    accessSecret,
    { expiresIn: accessExpiresIn }
  );
}

export function generateRefreshToken(user) {
  const { refreshSecret, refreshExpiresIn } = getJwtSecrets();
  return jwt.sign(
    { id: user.id || user._id },
    refreshSecret,
    { expiresIn: refreshExpiresIn }
  );
}

export function setRefreshCookie(res, refreshToken) {
  const isSecure = process.env.SECURE_COOKIE === 'true';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax' });
}

export function verifyAccessToken(token) {
  const { accessSecret } = getJwtSecrets();
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token) {
  const { refreshSecret } = getJwtSecrets();
  return jwt.verify(token, refreshSecret);
}

export function generateResetToken(userId) {
  const { accessSecret } = getJwtSecrets();
  return jwt.sign(
    { id: userId, purpose: 'reset_password' },
    accessSecret,
    { expiresIn: '5m' }
  );
}

export function verifyResetToken(token) {
  const { accessSecret } = getJwtSecrets();
  return jwt.verify(token, accessSecret);
}

export function userPublicInfo(user) {
  if (!user) return null;
  return {
    id: user.id || user._id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    role: user.role,
    is_vip: Boolean(user.is_vip),
    ai_credits: user.ai_credits ?? 0
  };
}

export default {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  verifyAccessToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken,
  userPublicInfo
};
