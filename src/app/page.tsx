import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              TrustTravel
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Discover trusted destinations with confidence. Join our community of travelers sharing real experiences.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link href="/login">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-600">
                Get Started
              </button>
            </Link>
            
            <Link href="/signup">
              <button className="w-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-600">
                Create Account
              </button>
            </Link>
            
            {/* Only show test environment in development */}
            {process.env.NODE_ENV === 'development' && (
              <Link href="/test-env">
                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                  🔧 Dev: Test Environment
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
