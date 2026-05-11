'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { LatLngTuple } from 'leaflet';
import api from '@/lib/axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddLocationModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPicked({ lat, lng });
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Location name is required'); return; }
    if (!picked) { setError('Click on the map to place the location'); return; }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/locations', {
        name: name.trim(),
        address: address.trim(),
        lat: picked.lat,
        lng: picked.lng,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create location');
    } finally {
      setIsLoading(false);
    }
  };

  const markers = picked
    ? [{ lat: picked.lat, lng: picked.lng, label: name || 'New location' }]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-900">Add location</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Map */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <BaseMap
              markers={markers}
              onMapClick={handleMapClick}
              height="300px"
            />
          </div>

          {picked ? (
            <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
              Pinned at {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)} — click again to move
            </p>
          ) : (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              Click anywhere on the map to drop a pin
            </p>
          )}

          <Input
            label="Location name"
            placeholder="e.g. Mirpur 10, Dhaka University"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Address (optional)"
            placeholder="Full address for reference"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading} className="flex-1">
            Save location
          </Button>
        </div>
      </div>
    </div>
  );
}