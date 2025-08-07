import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Join TrustTravel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create your account to start your trusted travel journey
            </p>
          </div>
          
          <form className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              required
            />
            
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
            
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              required
            />
            
            <Button className="w-full" size="lg">
              Create Account
            </Button>
          </form>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign in
              </Link>
            </p>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
