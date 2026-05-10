import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

// Extend Express's Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) throw new ApiError(401, 'Not authenticated');

    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};