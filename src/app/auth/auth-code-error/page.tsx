'use client'

import Link from 'next/link'
import { Button } from '@/shared/components/Button'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Authentication Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Something went wrong during the authentication process. Please try again.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link href="/login">
              <Button className="w-full" size="lg">
                Try Again
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full" size="lg">
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If this problem persists, please{' '}
              <Link href="/contact" className="text-indigo-600 hover:text-indigo-500 font-medium">
                contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}