'use client';

import {
  getAnchorPlacesForCity,
  HOME_CITY_OPTIONS,
  ratingLabel,
  type SeedRatingValue,
  type SupportedCity
} from '@/shared/config/anchorPlaces';

interface AnchorSeedSelectorProps {
  city: SupportedCity | '';
  onCityChange: (city: SupportedCity) => void;
  ratings: Record<string, SeedRatingValue>;
  onRatingChange: (anchorId: string, rating: SeedRatingValue) => void;
}

const RATING_OPTIONS: Array<{ value: SeedRatingValue; label: string; className: string }> = [
  { value: 5, label: 'Love', className: 'bg-green-600 text-white border-green-600' },
  { value: 4, label: 'Like', className: 'bg-green-100 text-green-800 border-green-300' },
  { value: 3, label: 'Neutral', className: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 2, label: 'Dislike', className: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 1, label: 'Avoid', className: 'bg-red-100 text-red-800 border-red-300' }
];

export function AnchorSeedSelector({
  city,
  onCityChange,
  ratings,
  onRatingChange
}: AnchorSeedSelectorProps) {
  const anchors = getAnchorPlacesForCity(city);
  const answeredCount = anchors.filter(anchor => ratings[anchor.id] != null).length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Home City <span className="text-red-500">*</span>
        </label>
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value as SupportedCity)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">Select your home city</option>
          {HOME_CITY_OPTIONS.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500">
          We use your home city as the source context for cross-city recommendations.
        </p>
      </div>

      {city && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Seed your taste with {city}
          </h3>
          <p className="text-sm text-gray-700 mb-2">
            Rate these ten anchor places. This gives the system a high-signal taste profile before you have enough real reviews.
          </p>
          <p className="text-xs text-gray-600">
            Answered: {answeredCount} / {anchors.length}. Aim for at least 8 ratings.
          </p>
        </div>
      )}

      {city && anchors.length > 0 && (
        <div className="space-y-4">
          {anchors.map(anchor => {
            const currentRating = ratings[anchor.id] ?? null;

            return (
              <div key={anchor.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{anchor.title}</h4>
                    <p className="text-sm text-blue-700 font-medium">{anchor.concept}</p>
                    <p className="text-sm text-gray-600 mt-1">{anchor.summary}</p>
                    <p className="text-xs text-gray-500 mt-2">{anchor.rationale}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500 min-w-[90px]">
                    <div className="capitalize">{anchor.category.replace(/_/g, ' ')}</div>
                    <div className="mt-1">{ratingLabel(currentRating)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {anchor.experienceTags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                    >
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map(option => {
                    const selected = currentRating === option.value;

                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => onRatingChange(anchor.id, option.value)}
                        className={`px-3 py-2 text-sm rounded-lg border transition ${
                          selected ? option.className : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => onRatingChange(anchor.id, null)}
                    className={`px-3 py-2 text-sm rounded-lg border transition ${
                      currentRating == null
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    Skip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
