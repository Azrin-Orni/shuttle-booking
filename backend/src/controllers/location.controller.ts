import { Request, Response, NextFunction } from 'express';
import { Location } from '../models/Location';
import { ApiError } from '../utils/ApiError';

// POST /api/locations  (admin only)
export const createLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, lat, lng, address } = req.body;

    if (!name || lat === undefined || lng === undefined) {
      throw new ApiError(400, 'Name, latitude and longitude are required');
    }

    const location = await Location.create({
      name,
      lat,
      lng,
      address,
      createdBy: req.user!.userId,
    });

    res.status(201).json({ success: true, location });
  } catch (err) {
    next(err);
  }
};

// GET /api/locations  (admin + passenger)
export const getLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const locations = await Location.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, locations });
  } catch (err) {
    next(err);
  }
};

// PUT /api/locations/:id  (admin only)
export const updateLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!location) throw new ApiError(404, 'Location not found');
    res.json({ success: true, location });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/locations/:id  (admin only — soft delete)
export const deleteLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!location) throw new ApiError(404, 'Location not found');
    res.json({ success: true, message: 'Location deactivated' });
  } catch (err) {
    next(err);
  }
};