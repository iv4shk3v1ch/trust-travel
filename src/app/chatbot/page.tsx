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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* Simple Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Travel Assistant
          </h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
          >
            ← Back
          </Button>
        </div>

        {/* Chatbot */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg min-h-[80vh]">
          <ChatbotInterface />
        </div>
      </div>
    </div>
  );
}