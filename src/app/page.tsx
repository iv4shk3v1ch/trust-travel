export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Welcome
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Start your journey with our amazing platform. Discover new possibilities and unlock your potential.
            </p>
          </div>
          
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-600">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
