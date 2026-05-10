import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { accessTokenCookieOptions, refreshTokenCookieOptions } from '../utils/cookie';
import { ApiError } from '../utils/ApiError';

// POST /api/auth/register
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email and password are required');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters');
    }

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({ name, email, passwordHash, phone });

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res
      .cookie('accessToken', accessToken, accessTokenCookieOptions)
      .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
      .status(201)
      .json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    // select: false on passwordHash means we must explicitly request it
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) throw new ApiError(401, 'Invalid credentials');

    if (!user.isActive) throw new ApiError(403, 'Account is disabled');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials');

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res
      .cookie('accessToken', accessToken, accessTokenCookieOptions)
      .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
      .json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new ApiError(401, 'No refresh token');

    const payload = verifyRefreshToken(token);

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) throw new ApiError(401, 'User not found');

    const newAccessToken = signAccessToken({ userId: payload.userId, role: payload.role });

    res
      .cookie('accessToken', newAccessToken, accessTokenCookieOptions)
      .json({ success: true });
  } catch (err) {
    next(new ApiError(401, 'Invalid refresh token'));
  }
};

// POST /api/auth/logout
export const logout = (_req: Request, res: Response): void => {
  res
    .clearCookie('accessToken')
    .clearCookie('refreshToken', { path: '/api/auth/refresh' })
    .json({ success: true, message: 'Logged out' });
};

// GET /api/auth/me
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) throw new ApiError(404, 'User not found');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};