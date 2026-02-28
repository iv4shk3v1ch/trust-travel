'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/core/database/supabase';

interface VerificationResult {
  placeId: string;
  placeName: string;
  currentCategory: string;
  issues: string[];
  suggestions: {
    price_level?: string | null;
    indoor_outdoor?: string;
    place_type_id?: string;
    suggested_category?: string;
    delete?: boolean;
    reason?: string;
  };
}

export default function QuickReviewPage() {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, total: 0 });

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    try {
      const response = await fetch('/verification-results.json');
      const data: VerificationResult[] = await response.json();
      
      // Filter only issues that need manual review (deletions and category changes)
      const manualReview = data.filter(
        r => r.suggestions.delete || r.suggestions.place_type_id
      );
      
      setResults(manualReview);
      setStats({ reviewed: 0, total: manualReview.length });
      setLoading(false);
    } catch (error) {
      console.error('Error loading results:', error);
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (processing || currentIndex >= results.length) return;
    setProcessing(true);

    const current = results[currentIndex];

    try {
      if (current.suggestions.delete) {
        // Delete the place
        const { error } = await supabase
          .from('places')
          .delete()
          .eq('id', current.placeId);

        if (error) throw error;
        console.log(`✅ Deleted: ${current.placeName}`);
      } else if (current.suggestions.place_type_id) {
        // Update category
        const { error } = await supabase
          .from('places')
          .update({ place_type_id: current.suggestions.place_type_id })
          .eq('id', current.placeId);

        if (error) throw error;
        console.log(`✅ Updated category: ${current.placeName}`);
      }

      // Move to next
      setStats(prev => ({ ...prev, reviewed: prev.reviewed + 1 }));
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error applying fix:', error);
      alert('Error applying fix. See console for details.');
    } finally {
      setProcessing(false);
    }
  }

  function handleSkip() {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setStats(prev => ({ ...prev, reviewed: prev.reviewed + 1 }));
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setStats(prev => ({ ...prev, reviewed: Math.max(0, prev.reviewed - 1) }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification results...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">🎉 All Done!</h1>
          <p className="text-gray-600">No places need manual review.</p>
          <a
            href="/manage-places"
            className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Place Management
          </a>
        </div>
      </div>
    );
  }

  if (currentIndex >= results.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            ✅ Review Complete!
          </h1>
          <p className="text-gray-600 mb-6">
            You&apos;ve reviewed all {stats.total} places.
          </p>
          <a
            href="/manage-places"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Place Management
          </a>
        </div>
      </div>
    );
  }

  const current = results[currentIndex];
  const isDelete = current.suggestions.delete;
  const isCategory = current.suggestions.place_type_id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Quick Review: Manual Fixes
            </h1>
            <div className="text-sm text-gray-600">
              {currentIndex + 1} / {results.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / results.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            Reviewed: {stats.reviewed} / {stats.total}
          </div>
        </div>

        {/* Current Place */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {current.placeName}
          </h2>

          {/* Issue Type Badge */}
          {isDelete && (
            <div className="inline-block px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold mb-6">
              🗑️ Suggested for Deletion
            </div>
          )}
          {isCategory && (
            <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold mb-6">
              📂 Wrong Category
            </div>
          )}

          {/* Current Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Current Information:
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Category:</span>
                <span className="ml-2 font-medium">{current.currentCategory}</span>
              </div>
            </div>
          </div>

          {/* Issues */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Issues Found:</h3>
            <ul className="space-y-2">
              {current.issues.map((issue, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span className="text-gray-700">{issue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestion */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              Suggested Action:
            </h3>
            {isDelete && (
              <div>
                <p className="text-blue-800 font-medium">Delete this place</p>
                <p className="text-sm text-blue-700 mt-2">
                  Reason: {current.suggestions.reason}
                </p>
              </div>
            )}
            {isCategory && (
              <div>
                <p className="text-blue-800 font-medium">
                  Change category to: {current.suggestions.suggested_category}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  From: {current.currentCategory} → {current.suggestions.suggested_category}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0 || processing}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              ← Previous
            </button>
            
            <button
              onClick={handleSkip}
              disabled={processing}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Skip (Keep As Is)
            </button>
            
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Applying...
                </span>
              ) : (
                <>✓ Approve & Apply</>
              )}
            </button>

            <button
              onClick={handleSkip}
              disabled={processing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Next →
            </button>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              💡 Tip: Use keyboard - <kbd className="px-2 py-1 bg-gray-100 rounded border">←</kbd> Previous 
              · <kbd className="px-2 py-1 bg-gray-100 rounded border">→</kbd> Skip 
              · <kbd className="px-2 py-1 bg-gray-100 rounded border">Enter</kbd> Approve
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
