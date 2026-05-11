'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { LatLngTuple } from 'leaflet';
import ProtectedRoute from '@/components/ProtectedRoute';
import AddLocationModal from '@/components/admin/AddLocationModal';
import CreateRouteModal from '@/components/admin/CreateRouteModal';
import api from '@/lib/axios';
import { Route, Location } from '@/types/route';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<'routes' | 'locations'>('routes');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const fetchData = useCallback(async () => {
    const [routesRes, locationsRes] = await Promise.all([
      api.get('/routes'),
      api.get('/locations'),
    ]);
    setRoutes(routesRes.data.routes);
    setLocations(locationsRes.data.locations);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string, type: 'route' | 'location') => {
    if (!confirm(`Deactivate this ${type}?`)) return;
    await api.delete(`/${type === 'route' ? 'routes' : 'locations'}/${id}`);
    fetchData();
  };

  const routePolyline: LatLngTuple[] | undefined = selectedRoute
    ? [
        [selectedRoute.pickupLocation.lat, selectedRoute.pickupLocation.lng],
        [selectedRoute.dropoffLocation.lat, selectedRoute.dropoffLocation.lng],
      ]
    : undefined;

  const routeMarkers = selectedRoute
    ? [
        { lat: selectedRoute.pickupLocation.lat, lng: selectedRoute.pickupLocation.lng, label: `Pickup: ${selectedRoute.pickupLocation.name}` },
        { lat: selectedRoute.dropoffLocation.lat, lng: selectedRoute.dropoffLocation.lng, label: `Dropoff: ${selectedRoute.dropoffLocation.name}` },
      ]
    : locations.map((l) => ({ lat: l.lat, lng: l.lng, label: l.name }));

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition ${
      activeTab === t
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Routes & locations</h1>
              <p className="text-sm text-gray-500 mt-1">Manage shuttle routes and pickup/dropoff points</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddLocation(true)}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                + Add location
              </button>
              <button
                onClick={() => setShowCreateRoute(true)}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                + Create route
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-6">
            {/* Left panel */}
            <div className="col-span-2 flex flex-col gap-4">
              {/* Tabs */}
              <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-1.5">
                <button className={tabClass('routes')} onClick={() => setActiveTab('routes')}>
                  Routes ({routes.length})
                </button>
                <button className={tabClass('locations')} onClick={() => setActiveTab('locations')}>
                  Locations ({locations.length})
                </button>
              </div>

              {/* Routes list */}
              {activeTab === 'routes' && (
                <div className="flex flex-col gap-2">
                  {routes.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                      <p className="text-sm text-gray-400">No routes yet — create one to get started</p>
                    </div>
                  )}
                  {routes.map((r) => (
                    <div
                      key={r._id}
                      onClick={() => setSelectedRoute(selectedRoute?._id === r._id ? null : r)}
                      className={`bg-white rounded-xl border p-4 cursor-pointer transition ${
                        selectedRoute?._id === r._id
                          ? 'border-blue-400 ring-2 ring-blue-100'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {r.pickupLocation.name} → {r.dropoffLocation.name}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(r._id, 'route'); }}
                          className="text-xs text-red-400 hover:text-red-600 shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">{r.distanceKm} km</span>
                        <span className="text-xs text-gray-500">{r.estimatedMinutes} min</span>
                        <span className="text-xs font-medium text-blue-600 ml-auto">
                          ৳{r.fare}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Locations list */}
              {activeTab === 'locations' && (
                <div className="flex flex-col gap-2">
                  {locations.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                      <p className="text-sm text-gray-400">No locations yet — add one to start</p>
                    </div>
                  )}
                  {locations.map((l) => (
                    <div
                      key={l._id}
                      className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{l.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {l.lat.toFixed(4)}, {l.lng.toFixed(4)}
                        </p>
                        {l.address && (
                          <p className="text-xs text-gray-400">{l.address}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(l._id, 'location')}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Map panel */}
            <div className="col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-6">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedRoute ? `Viewing: ${selectedRoute.name}` : 'All locations'}
                  </p>
                  {selectedRoute && (
                    <button
                      onClick={() => setSelectedRoute(null)}
                      className="text-xs text-blue-500 hover:underline mt-0.5"
                    >
                      Show all locations
                    </button>
                  )}
                </div>
                <BaseMap
                  center={
                    selectedRoute
                      ? [selectedRoute.pickupLocation.lat, selectedRoute.pickupLocation.lng]
                      : [23.8103, 90.4125]
                  }
                  markers={routeMarkers}
                  polyline={routePolyline}
                  height="560px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddLocation && (
        <AddLocationModal
          onClose={() => setShowAddLocation(false)}
          onCreated={fetchData}
        />
      )}
      {showCreateRoute && (
        <CreateRouteModal
          onClose={() => setShowCreateRoute(false)}
          onCreated={fetchData}
        />
      )}
    </ProtectedRoute>
  );
}