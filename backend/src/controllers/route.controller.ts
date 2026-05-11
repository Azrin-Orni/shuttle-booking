import { Request, Response, NextFunction } from 'express';
import { Route } from '../models/Route';
import { Location } from '../models/Location';
import { getRouteInfo } from '../services/osrm.service';
import { ApiError } from '../utils/ApiError';

// POST /api/routes  (admin only)
export const createRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, pickupLocationId, dropoffLocationId, pricePerKm } = req.body;

    if (!name || !pickupLocationId || !dropoffLocationId || !pricePerKm) {
      throw new ApiError(400, 'All fields are required');
    }

    if (pickupLocationId === dropoffLocationId) {
      throw new ApiError(400, 'Pickup and dropoff cannot be the same location');
    }

    // Fetch both locations to get their coordinates
    const [pickup, dropoff] = await Promise.all([
      Location.findById(pickupLocationId),
      Location.findById(dropoffLocationId),
    ]);

    if (!pickup) throw new ApiError(404, 'Pickup location not found');
    if (!dropoff) throw new ApiError(404, 'Dropoff location not found');

    // Call OSRM to get real road distance and travel time
    const { distanceKm, estimatedMinutes } = await getRouteInfo(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: dropoff.lat, lng: dropoff.lng }
    );

    const route = await Route.create({
      name,
      pickupLocation: pickupLocationId,
      dropoffLocation: dropoffLocationId,
      distanceKm,
      estimatedMinutes,
      pricePerKm,
      createdBy: req.user!.userId,
    });

    // Populate for the response so frontend gets full location objects
    await route.populate(['pickupLocation', 'dropoffLocation']);

    res.status(201).json({ success: true, route });
  } catch (err) {
    next(err);
  }
};

// GET /api/routes  (admin + passenger)
export const getRoutes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const routes = await Route.find({ isActive: true })
      .populate('pickupLocation')
      .populate('dropoffLocation')
      .sort({ createdAt: -1 });

    res.json({ success: true, routes });
  } catch (err) {
    next(err);
  }
};

// GET /api/routes/:id
export const getRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('pickupLocation')
      .populate('dropoffLocation');

    if (!route) throw new ApiError(404, 'Route not found');
    res.json({ success: true, route });
  } catch (err) {
    next(err);
  }
};

// PUT /api/routes/:id  (admin only)
export const updateRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { pricePerKm, name, isActive } = req.body;

    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { $set: { pricePerKm, name, isActive } },
      { new: true, runValidators: true }
    ).populate(['pickupLocation', 'dropoffLocation']);

    if (!route) throw new ApiError(404, 'Route not found');
    res.json({ success: true, route });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/routes/:id  (admin only — soft delete)
export const deleteRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!route) throw new ApiError(404, 'Route not found');
    res.json({ success: true, message: 'Route deactivated' });
  } catch (err) {
    next(err);
  }
};