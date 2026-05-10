'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();

  return (
    <ProtectedRoute allowedRoles={['passenger']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome, {user?.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Passenger dashboard</p>
            </div>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:text-red-700 transition"
            >
              Sign out
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-gray-500 text-sm">
              Booking features coming next. Your session is working correctly.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}