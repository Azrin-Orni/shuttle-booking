import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { ApiError } from '../utils/ApiError';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Access denied');
    }
    next();
  };
};