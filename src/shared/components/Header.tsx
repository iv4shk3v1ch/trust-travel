'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { ProfileDrawer } from './ProfileDrawer';

export const Header: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

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
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  // Navigation links - only show when authenticated
  const navLinks = [
    { href: '/explore', label: 'Explore', icon: '🗺️' },
    { href: '/search', label: 'Find Travelers', icon: '👥' },
    { href: '/reviews', label: 'Reviews', icon: '⭐' },
    { href: '/chatbot', label: 'AI Assistant', icon: '🤖' },
  ];

  const isActivePath = (href: string) => {
    return pathname === href;
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/explore" className="flex items-center gap-2">
              <span className="text-2xl">✈️</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TrustTravel
              </span>
            </Link>

            {/* Navigation Links - Desktop */}
            {user && (
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActivePath(link.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-4">
              {loading ? (
                // Loading skeleton
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              ) : user ? (
                // User avatar button
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-3 hover:bg-gray-50 rounded-full p-1 pr-3 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                    {getInitials()}
                  </div>
                  <span className="hidden md:block font-medium text-gray-700">
                    {profile?.full_name?.split(' ')[0] || 'Profile'}
                  </span>
                </button>
              ) : (
                // Not logged in - show login/signup
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Drawer */}
      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};
