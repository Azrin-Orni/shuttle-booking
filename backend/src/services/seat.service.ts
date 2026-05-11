import { Schedule } from '../models/Schedule';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// Returns seat map for a schedule:
// each seat is 'available', 'booked', or 'locked'
export const getSeatMap = async (scheduleId: string) => {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) throw new ApiError(404, 'Schedule not found');

  // Clean expired locks before building the map
  const now = new Date();
  const validLocks = schedule.seatLocks.filter((l) => l.expiresAt > now);
  if (validLocks.length !== schedule.seatLocks.length) {
    schedule.seatLocks = validLocks;
    await schedule.save();
  }

  const seats = Array.from({ length: schedule.totalSeats }, (_, i) => {
    const seatNumber = i + 1;
    if (schedule.bookedSeats.includes(seatNumber)) {
      return { seatNumber, status: 'booked' as const };
    }
    const lock = validLocks.find((l) => l.seatNumber === seatNumber);
    if (lock) {
      return { seatNumber, status: 'locked' as const, expiresAt: lock.expiresAt };
    }
    return { seatNumber, status: 'available' as const };
  });

  return {
    scheduleId,
    totalSeats: schedule.totalSeats,
    availableCount: seats.filter((s) => s.status === 'available').length,
    seats,
  };
};

// Lock a seat for a user during the booking/payment flow
export const lockSeat = async (
  scheduleId: string,
  seatNumber: number,
  userId: string
) => {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  if (schedule.status !== 'upcoming') throw new ApiError(400, 'Schedule is not bookable');

  const now = new Date();

  // Check if already booked
  if (schedule.bookedSeats.includes(seatNumber)) {
    throw new ApiError(409, 'Seat is already booked');
  }

  // Check if locked by someone else
  const existingLock = schedule.seatLocks.find(
    (l) => l.seatNumber === seatNumber && l.expiresAt > now
  );
  if (existingLock && existingLock.lockedBy.toString() !== userId) {
    throw new ApiError(409, 'Seat is temporarily held by another user');
  }

  // Remove any expired locks and any previous lock this user held on this schedule
  schedule.seatLocks = schedule.seatLocks.filter(
    (l) =>
      l.expiresAt > now &&
      !(l.lockedBy.toString() === userId && l.seatNumber === seatNumber)
  );

  // Add new lock
  schedule.seatLocks.push({
    seatNumber,
    lockedBy: new mongoose.Types.ObjectId(userId),
    expiresAt: new Date(Date.now() + LOCK_DURATION_MS),
  });

  await schedule.save();
  return { seatNumber, lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) };
};

// Release a lock (when user cancels or goes back)
export const releaseLock = async (
  scheduleId: string,
  seatNumber: number,
  userId: string
) => {
  await Schedule.findByIdAndUpdate(scheduleId, {
    $pull: {
      seatLocks: { seatNumber, lockedBy: new mongoose.Types.ObjectId(userId) },
    },
  });
};

// Confirm a booked seat — called after successful payment
export const confirmSeat = async (
  scheduleId: string,
  seatNumber: number,
  userId: string
) => {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) throw new ApiError(404, 'Schedule not found');

  // Verify the user holds the lock
  const now = new Date();
  const lock = schedule.seatLocks.find(
    (l) =>
      l.seatNumber === seatNumber &&
      l.lockedBy.toString() === userId &&
      l.expiresAt > now
  );

  if (!lock) {
    throw new ApiError(409, 'Seat lock expired — please restart booking');
  }

  // Move from locked → booked, remove the lock
  schedule.bookedSeats.push(seatNumber);
  schedule.seatLocks = schedule.seatLocks.filter(
    (l) => !(l.seatNumber === seatNumber && l.lockedBy.toString() === userId)
  );

  await schedule.save();
};