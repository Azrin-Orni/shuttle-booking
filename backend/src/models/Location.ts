import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Invalid latitude'],
      max: [90, 'Invalid latitude'],
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Invalid longitude'],
      max: [180, 'Invalid longitude'],
    },
    address: {
      type: String,
      trim: true,
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
  { timestamps: true }
);

export const Location = mongoose.model<ILocation>('Location', locationSchema);