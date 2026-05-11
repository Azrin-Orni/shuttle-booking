'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import CreateScheduleModal from '@/components/admin/CreateScheduleModal';
import api from '@/lib/axios';
import { Schedule } from '@/types/route';

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filterDate, setFilterDate] = useState('');

  const fetchSchedules = useCallback(async () => {
    const params = filterDate ? `?date=${filterDate}` : '';
    const res = await api.get(`/schedules${params}`);
    setSchedules(res.data.schedules);
  }, [filterDate]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this schedule?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      fetchSchedules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot cancel this schedule');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-BD', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });

  const fillPercent = (s: Schedule) =>
    Math.round(((s.totalSeats - s.availableSeats) / s.totalSeats) * 100);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Schedules</h1>
              <p className="text-sm text-gray-500 mt-1">Manage departure schedules</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Create schedule
            </button>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4 flex items-center gap-4">
            <label className="text-sm text-gray-600">Filter by date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-blue-500 hover:underline"
              >
                Clear
              </button>
            )}
            <span className="ml-auto text-sm text-gray-400">
              {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Schedule list */}
          {schedules.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-400 text-sm">No schedules found — create one to get started</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {schedules.map((s) => (
                <div
                  key={s._id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: route + time */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">
                          {s.route.pickupLocation.name}
                          <span className="text-gray-400 mx-1.5">→</span>
                          {s.route.dropoffLocation.name}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.status === 'upcoming' ? 'bg-green-100 text-green-700' :
                          s.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                        <span>{formatDate(s.departureDate)}</span>
                        <span>{s.departureTime}</span>
                        <span>{s.route.distanceKm} km</span>
                        <span>{s.route.estimatedMinutes} min</span>
                        <span className="font-medium text-blue-600">৳{s.route.fare}</span>
                      </div>
                    </div>

                    {/* Right: seats + action */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {s.availableSeats}
                          <span className="text-gray-400 font-normal"> / {s.totalSeats}</span>
                        </p>
                        <p className="text-xs text-gray-400">seats available</p>
                      </div>
                      {s.status === 'upcoming' && (
                        <button
                          onClick={() => handleCancel(s._id)}
                          className="text-xs text-red-400 hover:text-red-600 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Seat fill bar */}
                  <div className="mt-4">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          fillPercent(s) >= 90 ? 'bg-red-400' :
                          fillPercent(s) >= 60 ? 'bg-amber-400' :
                          'bg-green-400'
                        }`}
                        style={{ width: `${fillPercent(s)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{fillPercent(s)}% booked</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateScheduleModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchSchedules}
        />
      )}
    </ProtectedRoute>
  );
}