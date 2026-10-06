const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_fallback_access_token_secret_value_here';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_fallback_refresh_token_secret_value_here';
const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '7d';
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d';

/**
 * Generates a SHA-256 hash of a token for secure DB storage.
 */
const hashToken = (token) => {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generates a short-lived access token
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
};

/**
 * Generates a long-lived refresh token
 */
const generateRefreshToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
};

/**
 * Verifies an access token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Verifies a refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Configures and sets httpOnly cookies in the response
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/'
  };

  // Access Token Cookie: 7 days
  res.cookie('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Refresh Token Cookie: 30 days
  res.cookie('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

/**
 * Clears httpOnly authentication cookies
 */
const clearAuthCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/'
  };

  res.clearCookie('access_token', cookieOptions);
  res.clearCookie('refresh_token', cookieOptions);
};

module.exports = {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies
};
