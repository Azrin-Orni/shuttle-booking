export interface Location {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface Route {
  _id: string;
  name: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  distanceKm: number;
  pricePerKm: number;
  estimatedMinutes: number;
  fare: number;
  isActive: boolean;
}

export type ScheduleStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type SeatStatus = 'available' | 'booked' | 'locked';

export interface Seat {
  seatNumber: number;
  status: SeatStatus;
  expiresAt?: string;
}

export interface Schedule {
  _id: string;
  route: Route;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  bookedSeats: number[];
  availableSeats: number;
  status: ScheduleStatus;
}