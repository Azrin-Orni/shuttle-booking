import mongoose, { Document, Schema } from 'mongoose';

export interface IRoute extends Document {
  name: string;
  pickupLocation: mongoose.Types.ObjectId;
  dropoffLocation: mongoose.Types.ObjectId;
  distanceKm: number;
  pricePerKm: number;
  estimatedMinutes: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  // Virtual
  fare: number;
}

const routeSchema = new Schema<IRoute>(
  {
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    pickupLocation: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    dropoffLocation: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    distanceKm: {
      type: Number,
      required: true,
      min: [0.1, 'Distance must be greater than 0'],
    },
    pricePerKm: {
      type: Number,
      required: true,
      min: [1, 'Price per km must be at least 1'],
    },
    estimatedMinutes: {
      type: Number,
      required: true,
      min: [1, 'Estimated time must be at least 1 minute'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Fare is always derived — never stored separately
routeSchema.virtual('fare').get(function () {
  return Math.round(this.distanceKm * this.pricePerKm);
});

export const Route = mongoose.model<IRoute>('Route', routeSchema);