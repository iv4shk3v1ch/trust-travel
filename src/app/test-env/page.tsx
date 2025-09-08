'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

export default function TestEnvironmentPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState('Not tested');

  const testAI = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResponse(data.response);
      } else {
        setResponse(`Error: ${data.error}`);
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSupabase = async () => {
    try {
      // Test Supabase connection
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSupabaseStatus(`✅ Connected! User: ${session.user.email}`);
      } else {
        setSupabaseStatus('✅ Connected (no user logged in)');
      }
    } catch (error) {
      setSupabaseStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Environment Variables Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Supabase Test */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Supabase Connection
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Status: {supabaseStatus}
            </p>
            <Button onClick={testSupabase}>
              Test Supabase Connection
            </Button>
          </div>

          {/* OpenAI Test */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              OpenAI Integration
            </h2>
            <div className="space-y-4">
              <Input
                label="Ask something"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Tell me about travel safety tips"
              />
              <Button onClick={testAI} disabled={loading || !prompt.trim()}>
                {loading ? 'Thinking...' : 'Ask AI'}
              </Button>
              {response && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Response:</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{response}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Environment Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Supabase Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>App URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>API Base URL:</strong> {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
