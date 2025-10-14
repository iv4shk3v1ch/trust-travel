'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/database/supabase';
import { ChatbotInterface } from '@/features/chatbot/components/ChatbotInterface';
import { Button } from '@/shared/components/Button';

export default function ChatbotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Travel Assistant
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover the best places in Trento with AI-powered recommendations
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-200"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </Button>
        </div>

        {/* Main Chatbot Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="h-[85vh]">
            <ChatbotInterface />
          </div>
        </div>

        {/* Quick Tips - Show only when no active chat */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">🍽️</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">Food & Dining</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &quot;I want to try authentic Italian cuisine&quot; or &quot;Looking for a cozy coffee shop&quot;
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">🏛️</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">Culture & History</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &quot;Show me historical sites&quot; or &quot;I&apos;m interested in museums and art&quot;
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">🏔️</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">Nature & Adventure</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &quot;I want to go hiking&quot; or &quot;Looking for outdoor activities and scenic views&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}