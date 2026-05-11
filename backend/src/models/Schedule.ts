import mongoose, { Document, Schema } from 'mongoose';

interface SeatLock {
  seatNumber: number;
  lockedBy: mongoose.Types.ObjectId;
  expiresAt: Date;
}

export interface ISchedule extends Document {
  route: mongoose.Types.ObjectId;
  departureDate: Date;      // just the date part (midnight UTC)
  departureTime: string;    // "08:30" — stored as string for easy display
  totalSeats: number;
  bookedSeats: number[];    // [1, 4, 7] — seat numbers that are confirmed booked
  seatLocks: SeatLock[];    // temporary locks during booking flow
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const seatLockSchema = new Schema<SeatLock>(
  {
    seatNumber: { type: Number, required: true },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const scheduleSchema = new Schema<ISchedule>(
  {
    route: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    departureTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'],
    },
    totalSeats: {
      type: Number,
      required: true,
      min: [1, 'Must have at least 1 seat'],
      max: [60, 'Cannot exceed 60 seats'],
    },
    bookedSeats: {
      type: [Number],
      default: [],
    },
    seatLocks: {
      type: [seatLockSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index — fast lookup for "all schedules on route X for date Y"
scheduleSchema.index({ route: 1, departureDate: 1 });

export const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);