/**
 * ProfileDrawer - Slides from right when user clicks avatar
 * Shows user info + quick links to Profile, Favorites, Connections
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-lg">
                {getInitials()}
              </div>

              {/* User Info */}
              <h2 className="text-xl font-bold mb-1">
                {profile?.full_name || 'Traveler'}
              </h2>
              <p className="text-sm text-blue-100">
                {user.email}
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              <Link
                href="/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">👤</span>
                <span className="font-medium text-gray-700">Profile</span>
              </Link>

              <Link
                href="/favorites"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">❤️</span>
                <span className="font-medium text-gray-700">Favorites</span>
              </Link>

              <Link
                href="/explore"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">🗺️</span>
                <span className="font-medium text-gray-700">Explore</span>
              </Link>

              <Link
                href="/connections"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">👥</span>
                <span className="font-medium text-gray-700">Connections</span>
              </Link>

              <Link
                href="/itinerary"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">📋</span>
                <span className="font-medium text-gray-700">Itineraries</span>
              </Link>

              <Link
                href="/reviews"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">⭐</span>
                <span className="font-medium text-gray-700">Reviews</span>
              </Link>

              <div className="border-t border-gray-200 my-4" />

              <Link
                href="/chatbot"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">🤖</span>
                <span className="font-medium text-gray-700">AI Assistant</span>
              </Link>

              <Link
                href="/add-place"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">📍</span>
                <span className="font-medium text-gray-700">Add Place</span>
              </Link>
            </div>
          </nav>

          {/* Footer - Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
              <span className="text-xl">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
