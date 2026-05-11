'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LatLngTuple } from 'leaflet';
import api from '@/lib/axios';
import { Location } from '@/types/route';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateRouteModal({ onClose, onCreated }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState('');
  const [pickupId, setPickupId] = useState('');
  const [dropoffId, setDropoffId] = useState('');
  const [pricePerKm, setPricePerKm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.get('/locations').then((res) => setLocations(res.data.locations));
  }, []);

  const pickup = locations.find((l) => l._id === pickupId);
  const dropoff = locations.find((l) => l._id === dropoffId);

  // Build markers and polyline for the preview map
  const markers = [
    pickup && { lat: pickup.lat, lng: pickup.lng, label: `Pickup: ${pickup.name}` },
    dropoff && { lat: dropoff.lat, lng: dropoff.lng, label: `Dropoff: ${dropoff.name}` },
  ].filter(Boolean) as { lat: number; lng: number; label: string }[];

  const polyline: LatLngTuple[] | undefined =
    pickup && dropoff
      ? [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]
      : undefined;

  const mapCenter: LatLngTuple =
    pickup ? [pickup.lat, pickup.lng] : [23.8103, 90.4125];

  const handleSubmit = async () => {
    if (!name.trim() || !pickupId || !dropoffId || !pricePerKm) {
      setError('All fields are required');
      return;
    }
    if (pickupId === dropoffId) {
      setError('Pickup and dropoff must be different locations');
      return;
    }
    if (Number(pricePerKm) < 1) {
      setError('Price per km must be at least 1');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/routes', {
        name: name.trim(),
        pickupLocationId: pickupId,
        dropoffLocationId: dropoffId,
        pricePerKm: Number(pricePerKm),
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create route');
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
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-900">Create route</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <Input
            label="Route name"
            placeholder="e.g. Mirpur 10 → Motijheel"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Pickup location</label>
              <select
                className={selectClass}
                value={pickupId}
                onChange={(e) => setPickupId(e.target.value)}
              >
                <option value="">Select pickup</option>
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Dropoff location</label>
              <select
                className={selectClass}
                value={dropoffId}
                onChange={(e) => setDropoffId(e.target.value)}
              >
                <option value="">Select dropoff</option>
                {locations.filter((l) => l._id !== pickupId).map((l) => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Price per km (BDT)"
            type="number"
            placeholder="e.g. 15"
            value={pricePerKm}
            onChange={(e) => setPricePerKm(e.target.value)}
          />

          {/* Route preview map */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Route preview</p>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <BaseMap
                center={mapCenter}
                zoom={pickup && dropoff ? 11 : 12}
                markers={markers}
                polyline={polyline}
                height="280px"
              />
            </div>
            {pickup && dropoff && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-2">
                Distance and travel time will be calculated automatically via OSRM when you save
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} isLoading={isLoading} className="flex-1">
            {isLoading ? 'Calculating route...' : 'Create route'}
          </Button>
        </div>
      </div>
    </div>
  );
}