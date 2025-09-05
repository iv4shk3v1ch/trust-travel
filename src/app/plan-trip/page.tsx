'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { TravelPlanForm } from '@/components/forms/travel-plan/TravelPlanForm';
import { TravelPlan } from '@/types/travel-plan';
import { Button } from '@/components/ui/Button';

export default function PlanTripPage() {
  const router = useRouter();
  const { user, loading } = useAuthGuard();

  const handlePlanComplete = async (travelPlan: TravelPlan) => {
    try {
      console.log('Travel plan completed:', travelPlan);
      
      // TODO: Save to database when travel_plans table is implemented
      // For now, just redirect to dashboard
      
      // Redirect to a success page or dashboard with trip recommendations
      router.push('/dashboard?tripPlanned=true');
    } catch (error) {
      console.error('Error saving travel plan:', error);
      alert('Failed to save your travel plan. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
