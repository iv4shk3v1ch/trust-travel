import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              TrustTravel
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Your trusted companion for safe and reliable travel experiences. 
              Discover destinations with confidence through our community-driven trust scores.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600">Home</Link></li>
              <li><Link href="/destinations" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600">Destinations</Link></li>
              <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600">About</Link></li>
              <li><a href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              <li><a href="/help" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600">Help Center</a></li>
              <li><a href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} TrustTravel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
