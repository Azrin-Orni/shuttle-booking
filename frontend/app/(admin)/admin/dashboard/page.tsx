'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

export default function AdminDashboardPage() {
  const { user, logout } = useAuthStore();

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Admin panel</h1>
              <p className="text-sm text-gray-500 mt-1">Logged in as {user?.email}</p>
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
              Route and schedule management coming next.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}