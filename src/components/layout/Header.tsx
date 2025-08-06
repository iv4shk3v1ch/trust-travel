import React from 'react';
import Link from 'next/link';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              TrustTravel
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Home
            </Link>
            <Link 
              href="/destinations" 
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Destinations
            </Link>
            <Link 
              href="/about" 
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              About
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
