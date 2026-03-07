'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';

type RecommendationMode = 'popular' | 'cf_only' | 'hybrid';
type PersonaKey = 'culture' | 'foodie' | 'social' | 'outdoor';

type DemoPlace = {
  id: string;
  name: string;
  city: string;
  category: string;
  popularity: number;
  tags: string[];
};

type RankedDemoPlace = DemoPlace & {
  reason: string;
  score: number;
  novelty?: boolean;
};

const CITIES = ['Trento', 'Milan', 'Rome', 'Florence'] as const;

const MODES: Array<{ id: RecommendationMode; label: string; note: string }> = [
  { id: 'popular', label: 'Popular', note: 'Best-rated city classics' },
  { id: 'cf_only', label: 'CF only', note: 'Similarity to users like you' },
  { id: 'hybrid', label: 'Hybrid', note: 'Similarity + quality + novelty' }
];

const PERSONAS: Record<PersonaKey, { label: string; categories: string[]; tags: string[] }> = {
  culture: {
    label: 'Culture seeker',
    categories: ['museum', 'historical_site', 'art_gallery', 'landmark'],
    tags: ['culture', 'history', 'architecture']
  },
  foodie: {
    label: 'Food-first traveler',
    categories: ['restaurant', 'cafe', 'food_market', 'bar'],
    tags: ['local_cuisine', 'fine_dining', 'street_food', 'cafe']
  },
  social: {
    label: 'Social and nightlife',
    categories: ['bar', 'nightclub', 'entertainment_venue', 'shopping_area'],
    tags: ['nightlife', 'entertainment', 'romantic']
  },
  outdoor: {
    label: 'Outdoor explorer',
    categories: ['park', 'viewpoint', 'nature_reserve', 'beach'],
    tags: ['nature', 'outdoor', 'scenic']
  }
};

const DEMO_PLACES: DemoPlace[] = [
  { id: 'mi-1', name: 'Pinacoteca di Brera', city: 'Milan', category: 'museum', popularity: 0.84, tags: ['culture', 'history', 'architecture'] },
  { id: 'mi-2', name: 'Parco Sempione', city: 'Milan', category: 'park', popularity: 0.81, tags: ['outdoor', 'scenic', 'family_friendly'] },
  { id: 'mi-3', name: 'Navigli Aperitivo', city: 'Milan', category: 'bar', popularity: 0.88, tags: ['nightlife', 'entertainment', 'romantic'] },
  { id: 'mi-4', name: 'Mercato Centrale Milano', city: 'Milan', category: 'food_market', popularity: 0.79, tags: ['local_cuisine', 'street_food', 'family_friendly'] },
  { id: 'mi-5', name: 'Fondazione Prada', city: 'Milan', category: 'art_gallery', popularity: 0.74, tags: ['culture', 'art', 'architecture'] },
  { id: 'mi-6', name: 'Colonne di San Lorenzo', city: 'Milan', category: 'landmark', popularity: 0.72, tags: ['history', 'nightlife', 'scenic'] },

  { id: 'rm-1', name: 'Pantheon', city: 'Rome', category: 'historical_site', popularity: 0.95, tags: ['history', 'architecture', 'culture'] },
  { id: 'rm-2', name: 'Trastevere Evening Walk', city: 'Rome', category: 'bar', popularity: 0.82, tags: ['nightlife', 'local_cuisine', 'romantic'] },
  { id: 'rm-3', name: 'Villa Borghese', city: 'Rome', category: 'park', popularity: 0.83, tags: ['outdoor', 'scenic', 'family_friendly'] },
  { id: 'rm-4', name: 'Testaccio Market', city: 'Rome', category: 'food_market', popularity: 0.76, tags: ['street_food', 'local_cuisine', 'cafe'] },
  { id: 'rm-5', name: 'MAXXI Museum', city: 'Rome', category: 'museum', popularity: 0.71, tags: ['culture', 'art', 'architecture'] },
  { id: 'rm-6', name: 'Pincio Viewpoint', city: 'Rome', category: 'viewpoint', popularity: 0.78, tags: ['scenic', 'outdoor', 'romantic'] },

  { id: 'fi-1', name: 'Uffizi Gallery', city: 'Florence', category: 'museum', popularity: 0.96, tags: ['culture', 'history', 'art'] },
  { id: 'fi-2', name: 'Oltrarno Cafes', city: 'Florence', category: 'cafe', popularity: 0.75, tags: ['cafe', 'romantic', 'local_cuisine'] },
  { id: 'fi-3', name: 'Boboli Gardens', city: 'Florence', category: 'park', popularity: 0.82, tags: ['outdoor', 'scenic', 'history'] },
  { id: 'fi-4', name: 'Santo Spirito Bars', city: 'Florence', category: 'bar', popularity: 0.78, tags: ['nightlife', 'entertainment', 'local_cuisine'] },
  { id: 'fi-5', name: 'Mercato Centrale Firenze', city: 'Florence', category: 'food_market', popularity: 0.84, tags: ['street_food', 'local_cuisine', 'family_friendly'] },
  { id: 'fi-6', name: 'Piazzale Michelangelo', city: 'Florence', category: 'viewpoint', popularity: 0.9, tags: ['scenic', 'outdoor', 'romantic'] },

  { id: 'tr-1', name: 'Castello del Buonconsiglio', city: 'Trento', category: 'historical_site', popularity: 0.89, tags: ['history', 'culture', 'architecture'] },
  { id: 'tr-2', name: 'Lungadige Walk', city: 'Trento', category: 'park', popularity: 0.73, tags: ['outdoor', 'scenic', 'family_friendly'] },
  { id: 'tr-3', name: 'Piazza Duomo Bistrot', city: 'Trento', category: 'bar', popularity: 0.77, tags: ['nightlife', 'romantic', 'cafe'] },
  { id: 'tr-4', name: 'Le Gallerie', city: 'Trento', category: 'museum', popularity: 0.69, tags: ['culture', 'history', 'art'] },
  { id: 'tr-5', name: 'Panificio Moderno', city: 'Trento', category: 'cafe', popularity: 0.72, tags: ['cafe', 'local_cuisine', 'street_food'] },
  { id: 'tr-6', name: 'Doss Trento Viewpoint', city: 'Trento', category: 'viewpoint', popularity: 0.75, tags: ['scenic', 'outdoor', 'history'] }
];

function rankDemoPlaces(
  city: string,
  mode: RecommendationMode,
  persona: PersonaKey,
  homeCity: string
): RankedDemoPlace[] {
  const profile = PERSONAS[persona];
  const candidates = DEMO_PLACES.filter(place => place.city === city);

  const scored = candidates.map(place => {
    const preferredCategoryHit = profile.categories.includes(place.category) ? 1 : 0;
    const tagOverlap = place.tags.filter(tag => profile.tags.includes(tag)).length / profile.tags.length;
    const personaScore = (tagOverlap * 0.65) + (preferredCategoryHit * 0.35);
    const crossCityBoost = homeCity !== city ? 0.08 : 0;
    const novelty = preferredCategoryHit ? 0.05 : 0.22;

    let score = 0;
    let reason = '';

    if (mode === 'popular') {
      score = (place.popularity * 0.88) + (personaScore * 0.12);
      reason = 'High city consensus and strong overall ratings.';
    } else if (mode === 'cf_only') {
      score = (personaScore * 0.78) + (crossCityBoost * 0.12) + (place.popularity * 0.1);
      reason = 'Matched to users with similar preference signals.';
    } else {
      score = (personaScore * 0.42) + (place.popularity * 0.34) + (novelty * 0.18) + (crossCityBoost * 0.06);
      reason = novelty > 0.2
        ? 'Novelty pick beyond your dominant pattern.'
        : 'Balanced by similarity, quality, and city context.';
    }

    return {
      ...place,
      score,
      reason,
      novelty: mode === 'hybrid' && novelty > 0.2
    };
  });

  const sorted = [...scored].sort((a, b) => b.score - a.score);
  if (mode !== 'hybrid') {
    return sorted.slice(0, 4);
  }

  const top = sorted.slice(0, 4);
  const hasNovelty = top.some(item => item.novelty);
  if (hasNovelty) return top;

  const noveltyCandidate = sorted.find(item => item.novelty);
  if (!noveltyCandidate) return top;

  return [...top.slice(0, 3), noveltyCandidate];
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [homeCity, setHomeCity] = useState<string>('Trento');
  const [destinationCity, setDestinationCity] = useState<string>('Milan');
  const [mode, setMode] = useState<RecommendationMode>('hybrid');
  const [persona, setPersona] = useState<PersonaKey>('culture');

  useEffect(() => {
    if (!loading && user) {
      router.push('/explore');
    }
  }, [user, loading, router]);

  const demoResults = useMemo(
    () => rankDemoPlaces(destinationCity, mode, persona, homeCity),
    [destinationCity, mode, persona, homeCity]
  );

  const activeModeNote = MODES.find(item => item.id === mode)?.note ?? '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Trust Travel</p>
            <h1 className="text-lg font-semibold text-gray-900">Cross-city recommendations for Italian POIs</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
              Log in
            </Link>
            <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Try it free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <section className="text-center mb-8">
          <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 mb-4">
            Real reviews + collaborative filtering + cross-city transfer
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Get recommendations that move with you
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">from one city to another</span>
          </h2>
          <p className="mt-4 text-lg text-gray-700 max-w-3xl mx-auto">
            Explore how different recommendation modes behave before signing up.
          </p>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 md:p-6">
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Home city</span>
              <select
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CITIES.map(city => <option key={`home-${city}`} value={city}>{city}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">Destination</span>
              <select
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CITIES.map(city => <option key={`dest-${city}`} value={city}>{city}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">Traveler profile</span>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value as PersonaKey)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PERSONAS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as RecommendationMode)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MODES.map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">{MODES.find(item => item.id === mode)?.label}:</span> {activeModeNote}
            </p>
          </div>

          <div className="space-y-2">
            {demoResults.map((place, index) => (
              <div key={place.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {index + 1}. {place.name}
                  </p>
                  <span className="text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                    {place.category}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{place.reason}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/signup" className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
              Create account and run full recommendations
            </Link>
            <Link href="/login" className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors">
              Already a user? Go to Explore
            </Link>
          </div>
        </section>

        <section className="mt-8 grid md:grid-cols-3 gap-4">
          <article className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-base font-semibold text-gray-900">Cross-city taste transfer</h3>
            <p className="text-sm text-gray-600 mt-1">
              Learn from what users like in one city, then project those preferences into the destination city.
            </p>
          </article>
          <article className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-base font-semibold text-gray-900">Real review-based signal</h3>
            <p className="text-sm text-gray-600 mt-1">
              Recommendations are built on real user-place ratings with enrichment and deduplication workflows.
            </p>
          </article>
          <article className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-base font-semibold text-gray-900">Cold-start onboarding</h3>
            <p className="text-sm text-gray-600 mt-1">
              Anchor-place onboarding collects useful taste signals before users accumulate many organic reviews.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
