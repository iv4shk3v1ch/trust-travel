/**
 * PlaceDetailsDrawer - Full place details in a slide-out drawer
 * Shows comprehensive information with reviews, photos, and actions
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { RecommendedPlace } from '@/core/services/recommender';

interface PlaceDetailsDrawerProps {
  place: RecommendedPlace | null;
  isOpen: boolean;
  isSaved: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function PlaceDetailsDrawer({ place, isOpen, isSaved, onClose, onSave }: PlaceDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'photos'>('overview');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset tab when drawer opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen]);

  if (!place || !isOpen) return null;

  const getMatchBadgeColor = (score: number): string => {
    if (score >= 0.8) return 'from-green-500 to-emerald-600';
    if (score >= 0.65) return 'from-blue-500 to-purple-600';
    if (score >= 0.5) return 'from-orange-400 to-amber-500';
    return 'from-gray-400 to-gray-500';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed bg-white z-50 overflow-y-auto shadow-2xl ${
        isMobile 
          ? 'bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh] animate-slide-up'
          : 'top-0 right-0 bottom-0 w-full md:w-2/3 lg:w-1/2'
      }`}>
        {/* Header Image */}
        <div className={`relative bg-gray-200 ${isMobile ? 'h-48' : 'h-64'}`}>
          <Image
            src={place.photo_urls?.[0] || '/placeholder-place.svg'}
            alt={place.name}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-place.svg';
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition shadow-lg"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Match Badge */}
          {place.final_score && (
            <div className="absolute top-4 left-4">
              <div 
                className={`bg-gradient-to-br ${getMatchBadgeColor(place.final_score)} text-white text-center px-4 py-2 rounded-xl shadow-lg font-bold`}
              >
                <div className="text-3xl leading-none">{(place.final_score * 100).toFixed(0)}%</div>
                <div className="text-[10px] uppercase tracking-wide opacity-90">Match</div>
              </div>
            </div>
          )}

          {/* Verified Badge */}
          {place.verified && (
            <div className="absolute bottom-4 left-4 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-full font-medium">
              ✓ Verified
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title & Category */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {place.name}
            </h1>
            <p className="text-lg text-gray-600 capitalize">
              {place.category.replace(/-/g, ' ')}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
            {/* Rating */}
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 text-2xl">⭐</span>
              <div>
                <div className="font-bold text-xl text-gray-900">
                  {place.average_rating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">
                  {place.review_count} reviews
                </div>
              </div>
            </div>

            {/* Price Level */}
            {place.price_level && (
              <div>
                <div className="text-xl text-gray-900 font-bold">
                  {'€'.repeat(typeof place.price_level === 'string' ? 
                    (place.price_level === 'low' ? 1 : place.price_level === 'medium' ? 2 : 3) : 
                    place.price_level)}
                </div>
                <div className="text-sm text-gray-500">Price level</div>
              </div>
            )}

            {/* Environment */}
            {place.indoor_outdoor && (
              <div>
                <div className="text-2xl">
                  {place.indoor_outdoor === 'outdoor' ? '🌳' : place.indoor_outdoor === 'indoor' ? '🏛️' : '🏛️🌳'}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {place.indoor_outdoor}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={onSave}
              className={`flex-1 py-3 px-6 font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                isSaved
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-600'
              }`}
            >
              <span className="text-xl">{isSaved ? '❤️' : '🤍'}</span>
              {isSaved ? 'Saved to Favorites' : 'Save to Favorites'}
            </button>

            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <span className="text-xl">🌐</span>
                Website
              </a>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-1 font-medium transition border-b-2 ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 px-1 font-medium transition border-b-2 ${
                  activeTab === 'reviews'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Reviews ({place.review_count})
              </button>
              {place.photo_urls && place.photo_urls.length > 1 && (
                <button
                  onClick={() => setActiveTab('photos')}
                  className={`pb-3 px-1 font-medium transition border-b-2 ${
                    activeTab === 'photos'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Photos ({place.photo_urls.length})
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              {place.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-700 leading-relaxed">{place.description}</p>
                </div>
              )}

              {/* Tags */}
              {place.matching_tags && place.matching_tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Experience Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {place.matching_tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        {tag.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Address & Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Location & Contact</h3>
                <div className="space-y-3">
                  {place.address && (
                    <div className="flex items-start gap-3">
                      <span className="text-xl">📍</span>
                      <div>
                        <div className="font-medium text-gray-900">Address</div>
                        <div className="text-gray-600">{place.address}</div>
                      </div>
                    </div>
                  )}

                  {place.phone && (
                    <div className="flex items-start gap-3">
                      <span className="text-xl">📞</span>
                      <div>
                        <div className="font-medium text-gray-900">Phone</div>
                        <a href={`tel:${place.phone}`} className="text-blue-600 hover:underline">
                          {place.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {place.working_hours && (
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🕐</span>
                      <div>
                        <div className="font-medium text-gray-900">Hours</div>
                        <div className="text-gray-600">{place.working_hours}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Match Score Breakdown */}
              {place.final_score && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Why This Recommendation?</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Preference Match</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(place.preference_similarity || 0) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900 w-12 text-right">
                          {((place.preference_similarity || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Quality Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(place.quality_score || 0) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900 w-12 text-right">
                          {((place.quality_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Social Trust</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${(place.social_trust || 0) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900 w-12 text-right">
                          {((place.social_trust || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {place.trusted_reviewers_count > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          👥 <span className="font-semibold">{place.trusted_reviewers_count}</span> people you trust have reviewed this place
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <p className="text-gray-600 mb-4">
                {place.review_count} reviews from travelers
              </p>
              {/* TODO: Fetch and display actual reviews */}
              <div className="text-center py-8 text-gray-500">
                Reviews coming soon...
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="grid grid-cols-2 gap-4">
              {place.photo_urls?.map((url, index) => (
                <div key={index} className="relative h-48 bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={url}
                    alt={`${place.name} - Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-place.svg';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
