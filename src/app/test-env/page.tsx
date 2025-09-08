'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProfileCompletenessChip } from '@/components/ui/ProfileCompletenessChip';
import { useToast } from '@/components/ui/ToastManager';
import { supabase } from '@/lib/supabase';
import { UserPreferences } from '@/types/preferences';

export default function TestEnvironmentPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState('Not tested');
  const { showToast, showProfileBoostToast } = useToast();

  // Profile state toggles
  const toggleProfileState = (useComplete: boolean) => {
    localStorage.setItem('useCompleteProfile', useComplete.toString());
    window.location.reload(); // Reload to apply changes
  };

  // Mock profile data for testing different scenarios
  const incompleteProfile: UserPreferences = {
    basicInfo: {
      firstName: 'John',
      lastName: '',
      gender: '',
      ageGroup: ''
    },
    preferences: {
      activities: ['hiking'],
      placeTypes: []
    },
    foodAndRestrictions: {
      foodExcitement: [],
      restrictions: [],
      placesToAvoid: []
    },
    personalityAndStyle: {
      travelPersonality: [],
      planningStyle: ''
    },
    budget: {
      spendingStyle: '',
      travelWith: ''
    },
    completedSteps: [1],
    isComplete: false
  };

  const partialProfile: UserPreferences = {
    basicInfo: {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      ageGroup: '25-34'
    },
    preferences: {
      activities: ['hiking', 'photography'],
      placeTypes: ['mountains']
    },
    foodAndRestrictions: {
      foodExcitement: ['italian'],
      restrictions: [],
      placesToAvoid: []
    },
    personalityAndStyle: {
      travelPersonality: [],
      planningStyle: ''
    },
    budget: {
      spendingStyle: '',
      travelWith: ''
    },
    completedSteps: [1, 2, 3],
    isComplete: false
  };

  const completeProfile: UserPreferences = {
    basicInfo: {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      ageGroup: '25-34'
    },
    preferences: {
      activities: ['hiking', 'photography'],
      placeTypes: ['mountains', 'cities']
    },
    foodAndRestrictions: {
      foodExcitement: ['italian', 'local'],
      restrictions: [],
      placesToAvoid: []
    },
    personalityAndStyle: {
      travelPersonality: ['adventurous'],
      planningStyle: 'flexible'
    },
    budget: {
      spendingStyle: 'mid-range',
      travelWith: 'solo'
    },
    completedSteps: [1, 2, 3, 4, 5, 6],
    isComplete: true
  };

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

        {/* Profile Completeness Demo */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Profile Completeness Demo
          </h2>
          
          {/* Profile State Controls */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium mb-3 text-blue-800 dark:text-blue-200">
              Profile State Controls
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Switch between different profile states for testing the 63% completion issue:
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => toggleProfileState(false)}
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                Use Incomplete Profile (63%)
              </Button>
              <Button
                onClick={() => toggleProfileState(true)}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                Use Complete Profile (100%)
              </Button>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Current: {localStorage.getItem('useCompleteProfile') === 'true' ? 'Complete Profile' : 'Incomplete Profile'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Incomplete Profile</h3>
              <ProfileCompletenessChip profile={incompleteProfile} className="mx-auto" />
              <p className="text-xs text-gray-500 mt-2">Only basic info started</p>
            </div>
            <div className="text-center">
              <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Partial Profile</h3>
              <ProfileCompletenessChip profile={partialProfile} className="mx-auto" />
              <p className="text-xs text-gray-500 mt-2">Basic info + some preferences</p>
            </div>
            <div className="text-center">
              <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Complete Profile</h3>
              <ProfileCompletenessChip profile={completeProfile} className="mx-auto" />
              <p className="text-xs text-gray-500 mt-2">All sections completed</p>
            </div>
          </div>
        </div>

        {/* Toast Test Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Toast System Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => showToast({
                message: 'Basic toast test message',
                type: 'success',
                emoji: '✅'
              })}
            >
              Test Basic Toast
            </Button>
            <Button
              onClick={() => showProfileBoostToast('activities', 13)}
            >
              Test Activities Toast
            </Button>
            <Button
              onClick={() => showProfileBoostToast('foodExcitement', 8)}
            >
              Test Food Toast
            </Button>
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
