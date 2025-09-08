'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { transformFormDataToProfile, ProfileData } from '@/lib/database';
import { UserPreferences } from '@/types/preferences';

export default function ProfileSaveDebugPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [dbProfile, setDbProfile] = useState<ProfileData | null>(null);
  const [transformedProfile, setTransformedProfile] = useState<ProfileData | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test profile data that matches what a user would fill out
  const testProfileData: UserPreferences = {
    basicInfo: {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      ageGroup: '25-34'
    },
    preferences: {
      activities: ['hiking', 'photography', 'Exploring cities', 'Music & Nightlife', 'Hiking', 'Nature', 'Beaches', 'Foodie experiences', 'Photography'],
      placeTypes: ['mountains', 'cities', 'Big cities buzzing with life', 'Remote off-grid escapes', 'Coastal & beach towns']
    },
    foodAndRestrictions: {
      foodExcitement: ['italian', 'Street food', 'Comfort food', 'Coffee culture', 'Desserts & sweets', 'Local specialties'],
      restrictions: [],
      placesToAvoid: []
    },
    personalityAndStyle: {
      travelPersonality: ['adventurous', 'Night owl', 'Social'],
      planningStyle: 'mixed'
    },
    budget: {
      spendingStyle: 'medium',
      travelWith: 'mixed'
    },
    completedSteps: [1, 2, 3, 4, 5, 6],
    isComplete: true
  };

  const testProfileSaveProcess = async () => {
    setLogs([]);
    addLog('🔍 Starting profile save debugging...');
    
    if (!user) {
      addLog('❌ No authenticated user found');
      return;
    }
    
    addLog(`✅ User authenticated: ${user.email} (ID: ${user.id})`);
    
    try {
      // Step 1: Transform the data like the real save process does
      addLog('🔄 Step 1: Transforming UserPreferences to database format...');
      const transformedData = transformFormDataToProfile(testProfileData, user.id);
      setTransformedProfile(transformedData);
      addLog(`✅ Transformation complete. Result:`);
      addLog(JSON.stringify(transformedData, null, 2));
      
      // Step 2: Try to save to database
      addLog('🔄 Step 2: Attempting database save (upsert)...');
      const { data, error } = await supabase
        .from('profiles')
        .upsert(transformedData, { onConflict: 'id' });
      
      if (error) {
        addLog(`❌ Database save failed: ${error.message}`);
        addLog(`Error code: ${error.code}`);
        addLog(`Error details: ${JSON.stringify(error, null, 2)}`);
      } else {
        addLog('✅ Database save successful!');
        addLog(`Response data: ${JSON.stringify(data, null, 2)}`);
      }
      
      // Step 3: Try to read back the data
      addLog('🔄 Step 3: Attempting to read profile back from database...');
      const { data: readData, error: readError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (readError) {
        addLog(`❌ Read failed: ${readError.message}`);
        addLog(`Read error code: ${readError.code}`);
      } else {
        addLog('✅ Read successful!');
        setDbProfile(readData);
        addLog(`Database profile: ${JSON.stringify(readData, null, 2)}`);
      }
      
      // Step 4: Check current session
      addLog('🔄 Step 4: Checking current session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        addLog(`❌ Session error: ${sessionError.message}`);
      } else if (session) {
        addLog(`✅ Session active for user: ${session.user.email}`);
        addLog(`Session expires: ${session.expires_at}`);
      } else {
        addLog('❌ No active session found');
      }
      
    } catch (error) {
      addLog(`❌ Caught exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addLog(`Exception stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    }
  };

  const checkExistingProfile = useCallback(async () => {
    if (!user) return;
    
    addLog('🔍 Checking for existing profile...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);
      
      if (error) {
        addLog(`❌ Error checking existing profile: ${error.message}`);
      } else {
        addLog(`✅ Query successful. Found ${data.length} profile(s)`);
        if (data.length > 0) {
          setDbProfile(data[0]);
          addLog(`Profile data: ${JSON.stringify(data[0], null, 2)}`);
        }
      }
    } catch (error) {
      addLog(`❌ Exception checking profile: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkExistingProfile();
    }
  }, [user, checkExistingProfile]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Please Log In</h1>
          <p className="text-gray-600 dark:text-gray-400">You need to be authenticated to test profile saving.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Save Process Debugger
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This tool debugs the complete profile saving process to identify where data might be lost.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Debug Controls
          </h2>
          <div className="flex gap-4">
            <Button onClick={testProfileSaveProcess}>
              🔍 Test Complete Save Process
            </Button>
            <Button onClick={checkExistingProfile} variant="outline">
              📄 Check Existing Profile
            </Button>
            <Button onClick={() => setLogs([])} variant="outline">
              🗑️ Clear Logs
            </Button>
          </div>
        </div>

        {/* Test Data Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Test UserPreferences Data
            </h3>
            <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(testProfileData, null, 2)}
            </pre>
          </div>

          {transformedProfile && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Transformed Database Format
              </h3>
              <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(transformedProfile, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Current Database Profile */}
        {dbProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Current Database Profile
            </h3>
            <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(dbProfile, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Debug Logs ({logs.length} entries)
          </h3>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click &quot;Test Complete Save Process&quot; to start debugging.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comparison with your actual data */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">
            Your Actual Database Data
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
            Based on your previous message, here&apos;s what&apos;s actually in your database:
          </p>
          <pre className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 p-3 rounded overflow-auto">
{`{
  "idx": 2,
  "id": "8d005eb5-6313-461e-9a73-e11bbebd2c1f",
  "full_name": "John Doe",
  "age": 30,
  "gender": "male",
  "budget_level": "medium",
  "activities": ["hiking","photography","Exploring cities","Music & Nightlife","Hiking","Nature","Beaches","Foodie experiences","Photography"],
  "place_types": ["mountains","cities","Big cities buzzing with life","Remote off-grid escapes","Coastal & beach towns"],
  "food_preferences": ["italian","Street food","Comfort food","Coffee culture","Desserts & sweets","Local specialties"],
  "food_restrictions": [],
  "avoid_places": [],
  "personality_traits": ["adventurous","Night owl","Social"],
  "trip_style": "mixed"
}`}
          </pre>
          <p className="text-blue-700 dark:text-blue-300 text-sm mt-3">
            ✅ This shows your profile <strong>IS</strong> being saved correctly! The issue might be in how we&apos;re reading it back or transforming it for the frontend.
          </p>
        </div>
      </div>
    </div>
  );
}
