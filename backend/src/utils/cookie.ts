import { CookieOptions } from 'express';
import { env } from '../config/env';

const isProduction = env.nodeEnv === 'production';

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,       // HTTPS only in production
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000,    // 15 minutes in ms
};

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/auth/refresh',  // only sent to the refresh endpoint
};