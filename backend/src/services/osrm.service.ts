import axios from 'axios';
import { ApiError } from '../utils/ApiError';

interface OSRMResult {
  distanceKm: number;
  estimatedMinutes: number;
}

export const getRouteInfo = async (
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): Promise<OSRMResult> => {
  try {
    // OSRM expects coordinates as lng,lat (note: longitude first)
    const url = `http://router.project-osrm.org/route/v1/driving/` +
      `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}` +
      `?overview=false`;

    const response = await axios.get(url, { timeout: 8000 });
    const route = response.data.routes?.[0];

    if (!route) {
      throw new ApiError(400, 'Could not calculate route between these locations');
    }

    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10, // meters → km, 1 decimal
      estimatedMinutes: Math.round(route.duration / 60),          // seconds → minutes
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(503, 'Routing service unavailable, try again shortly');
  }
};