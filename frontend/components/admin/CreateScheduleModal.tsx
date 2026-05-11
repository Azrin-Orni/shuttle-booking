'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Route } from '@/types/route';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateScheduleModal({ onClose, onCreated }: Props) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeId, setRouteId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.get('/routes').then((res) => setRoutes(res.data.routes));
  }, []);

  const selectedRoute = routes.find((r) => r._id === routeId);

  // Today's date in YYYY-MM-DD for the min attribute
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!routeId || !departureDate || !departureTime || !totalSeats) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/schedules', {
        routeId,
        departureDate,
        departureTime,
        totalSeats: Number(totalSeats),
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const selectClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none ' +
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 bg-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-900">Create schedule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Route selector */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Route</label>
            <select
              className={selectClass}
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
            >
              <option value="">Select a route</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Route summary */}
          {selectedRoute && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex flex-col gap-1">
              <p className="text-xs font-medium text-blue-800">
                {selectedRoute.pickupLocation.name} → {selectedRoute.dropoffLocation.name}
              </p>
              <div className="flex gap-4 text-xs text-blue-600">
                <span>{selectedRoute.distanceKm} km</span>
                <span>{selectedRoute.estimatedMinutes} min</span>
                <span className="font-medium">৳{selectedRoute.fare} per seat</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Departure date"
              type="date"
              min={today}
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
            />
            <Input
              label="Departure time"
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
            />
          </div>

          <Input
            label="Total seats"
            type="number"
            placeholder="e.g. 30"
            min="1"
            max="60"
            value={totalSeats}
            onChange={(e) => setTotalSeats(e.target.value)}
          />

          {/* Fare preview */}
          {selectedRoute && totalSeats && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">Estimated revenue if full</p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5">
                ৳{(selectedRoute.fare * Number(totalSeats)).toLocaleString()}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} isLoading={isLoading} className="flex-1">
            Create schedule
          </Button>
        </div>
      </div>
    </div>
  );
}