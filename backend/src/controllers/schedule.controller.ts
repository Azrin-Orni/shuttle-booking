import { Request, Response, NextFunction } from 'express';
import { Schedule } from '../models/Schedule';
import { Route } from '../models/Route';
import { ApiError } from '../utils/ApiError';
import { getSeatMap } from '../services/seat.service';

// POST /api/schedules  (admin only)
export const createSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { routeId, departureDate, departureTime, totalSeats } = req.body;

    if (!routeId || !departureDate || !departureTime || !totalSeats) {
      throw new ApiError(400, 'All fields are required');
    }

    const route = await Route.findById(routeId);
    if (!route || !route.isActive) throw new ApiError(404, 'Route not found');

    // Normalize date to midnight UTC so date comparisons work cleanly
    const date = new Date(departureDate);
    date.setUTCHours(0, 0, 0, 0);

    if (date < new Date(new Date().setUTCHours(0, 0, 0, 0))) {
      throw new ApiError(400, 'Departure date cannot be in the past');
    }

    const schedule = await Schedule.create({
      route: routeId,
      departureDate: date,
      departureTime,
      totalSeats,
      createdBy: req.user!.userId,
    });

    await schedule.populate({
      path: 'route',
      populate: ['pickupLocation', 'dropoffLocation'],
    });

    res.status(201).json({ success: true, schedule });
  } catch (err) {
    next(err);
  }
};

// GET /api/schedules  — supports ?routeId=&date= filters
export const getSchedules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { routeId, date } = req.query;

    const filter: Record<string, any> = { status: 'upcoming' };

    if (routeId) filter.route = routeId;

    if (date) {
      const d = new Date(date as string);
      d.setUTCHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      filter.departureDate = { $gte: d, $lt: nextDay };
    }

    const schedules = await Schedule.find(filter)
      .populate({
        path: 'route',
        populate: ['pickupLocation', 'dropoffLocation'],
      })
      .sort({ departureDate: 1, departureTime: 1 });

    // Attach available seat count to each schedule
    const withAvailability = schedules.map((s) => {
      const now = new Date();
      const activeLocks = s.seatLocks.filter((l) => l.expiresAt > now);
      const takenSeats = new Set([
        ...s.bookedSeats,
        ...activeLocks.map((l) => l.seatNumber),
      ]);
      return {
        ...s.toJSON(),
        availableSeats: s.totalSeats - takenSeats.size,
      };
    });

    res.json({ success: true, schedules: withAvailability });
  } catch (err) {
    next(err);
  }
};

// GET /api/schedules/:id
export const getSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate({
      path: 'route',
      populate: ['pickupLocation', 'dropoffLocation'],
    });

    if (!schedule) throw new ApiError(404, 'Schedule not found');
    res.json({ success: true, schedule });
  } catch (err) {
    next(err);
  }
};

// GET /api/schedules/:id/seats  — seat map for booking UI
export const getScheduleSeats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
 const seatMap = await getSeatMap(req.params.id as string);
    res.json({ success: true, ...seatMap });
  } catch (err) {
    next(err);
  }
};

// PUT /api/schedules/:id  (admin only)
export const updateSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { departureTime, totalSeats, status } = req.body;

    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) throw new ApiError(404, 'Schedule not found');

    // Cannot shrink seats below already booked count
    if (totalSeats && totalSeats < schedule.bookedSeats.length) {
      throw new ApiError(
        400,
        `Cannot reduce seats below ${schedule.bookedSeats.length} — already booked`
      );
    }

    Object.assign(schedule, {
      ...(departureTime && { departureTime }),
      ...(totalSeats && { totalSeats }),
      ...(status && { status }),
    });

    await schedule.save();
    await schedule.populate({ path: 'route', populate: ['pickupLocation', 'dropoffLocation'] });

    res.json({ success: true, schedule });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/schedules/:id  (admin — cancels the schedule)
export const cancelSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) throw new ApiError(404, 'Schedule not found');

    if (schedule.bookedSeats.length > 0) {
      throw new ApiError(
        400,
        `Cannot cancel — ${schedule.bookedSeats.length} seats already booked`
      );
    }

    schedule.status = 'cancelled';
    await schedule.save();

    res.json({ success: true, message: 'Schedule cancelled' });
  } catch (err) {
    next(err);
  }
};