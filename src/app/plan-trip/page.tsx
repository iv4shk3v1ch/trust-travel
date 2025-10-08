'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelPlanForm } from '@/features/travel-plan/components/TravelPlanForm';
import { RecommendationsDisplay } from '@/shared/components/RecommendationsDisplay';
import { TravelPlan } from '@/shared/types/travel-plan';
import { supabase } from '@/core/database/supabase';
import { Button } from '@/shared/components/Button';
import { getRecommendations, getImmediateRecommendations, type RecommendedPlace } from '@/core/services/recommender';

export default function PlanTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedPlace[]>([]);
  const [completedTravelPlan, setCompletedTravelPlan] = useState<TravelPlan | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

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

  const handlePlanComplete = async (travelPlan: TravelPlan) => {
    try {
      console.log('Travel plan completed:', travelPlan);
      setLoadingRecommendations(true);
      setCompletedTravelPlan(travelPlan);
      
      // Get current user for social bias
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      
      // Save travel plan to user metadata
      await supabase.auth.updateUser({
        data: { 
          currentTravelPlan: travelPlan,
          travelPlanUpdated: new Date().toISOString()
        }
      });
      
      // Get recommendations based on travel plan (with social bias if user authenticated)
      const recs = travelPlan.dates.type === 'now' 
        ? await getImmediateRecommendations(travelPlan, currentUserId)
        : await getRecommendations(travelPlan, currentUserId);
      
      setRecommendations(recs);
      setShowRecommendations(true);
      setLoadingRecommendations(false);
      
    } catch (error) {
      console.error('Error saving travel plan or getting recommendations:', error);
      setLoadingRecommendations(false);
      alert('Failed to get recommendations. Please try again.');
    }
  };

  const handleBackToForm = () => {
    setShowRecommendations(false);
    setRecommendations([]);
    setCompletedTravelPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show loading screen while getting recommendations
  if (loadingRecommendations) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Finding perfect places for you...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing your preferences and matching with local spots
          </p>
        </div>
      </div>
    );
  }

  // Show recommendations if we have them
  if (showRecommendations && completedTravelPlan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <RecommendationsDisplay 
          recommendations={recommendations}
          travelPlan={completedTravelPlan}
          onBackToForm={handleBackToForm}
        />
      </div>
    );
  }

  // Default: show the travel plan form
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Plan Your Trento Adventure
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Tell us about your upcoming trip and we&apos;ll help you make the most of it
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
          >
            ← Back to Dashboard
          </Button>
        </div>

        {/* Travel Plan Form */}
        <TravelPlanForm onComplete={handlePlanComplete} />
      </div>
    </div>
  );
}
