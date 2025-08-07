import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to access your TrustTravel dashboard
            </p>
          </div>
          
          <form className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              required
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
            />
            
            <Button className="w-full" size="lg">
              Sign In
            </Button>
          </form>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign up
              </Link>
            </p>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ← Back to home
            </Link>
          </div>
          
          {/* Temporary: Direct access to dashboard for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full text-sm">
                  🔧 Dev: Skip to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
