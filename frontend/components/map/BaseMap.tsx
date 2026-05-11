'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import '@/lib/leafletFix';

interface MarkerData {
  lat: number;
  lng: number;
  label: string;
  color?: 'blue' | 'green' | 'red';
}

interface BaseMapProps {
  center?: LatLngTuple;
  zoom?: number;
  markers?: MarkerData[];
  polyline?: LatLngTuple[];
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
}

// Inner component to capture map click events
function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function BaseMap({
  center = [23.8103, 90.4125], // Dhaka default
  zoom = 12,
  markers = [],
  polyline,
  onMapClick,
  height = '400px',
}: BaseMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '12px', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />

      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lng]}>
          <Popup>{m.label}</Popup>
        </Marker>
      ))}

      {polyline && polyline.length >= 2 && (
        <Polyline
          positions={polyline}
          color="#2563eb"
          weight={4}
          opacity={0.8}
        />
      )}
    </MapContainer>
  );
}