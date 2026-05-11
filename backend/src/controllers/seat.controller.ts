import { Request, Response, NextFunction } from 'express';
import { lockSeat, releaseLock } from '../services/seat.service';
import { ApiError } from '../utils/ApiError';

// POST /api/seats/lock
export const lock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { scheduleId, seatNumber } = req.body;

    if (!scheduleId || !seatNumber) {
      throw new ApiError(400, 'scheduleId and seatNumber are required');
    }

    const result = await lockSeat(scheduleId, Number(seatNumber), req.user!.userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// POST /api/seats/release
export const release = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { scheduleId, seatNumber } = req.body;

    if (!scheduleId || !seatNumber) {
      throw new ApiError(400, 'scheduleId and seatNumber are required');
    }

    await releaseLock(scheduleId, Number(seatNumber), req.user!.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};