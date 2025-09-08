'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QuickReviewFormData, CONTEXT_TAGS } from '@/types/review';
import { track } from '@/lib/track';

interface EmojiSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  emojis: string[];
  className?: string;
}

const EmojiSlider: React.FC<EmojiSliderProps> = ({ 
  label, 
  value, 
  onChange, 
  emojis, 
  className = '' 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex justify-between items-center space-x-2">
        {emojis.map((emoji, index) => {
          const score = index + 1;
          const isSelected = value === score;
          return (
            <button
              key={score}
              onClick={() => onChange(score)}
              className={`
                flex-1 aspect-square rounded-lg border-2 transition-all duration-200
                flex items-center justify-center text-2xl
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-110' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:scale-105'
                }
              `}
              aria-label={`${label}: ${score} out of 5`}
              role="radio"
              aria-checked={isSelected}
            >
              {emoji}
            </button>
          );
        })}
      </div>
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        {value}/5
      </div>
    </div>
  );
};

interface QuickReviewProps {
  placeId?: string;
  placeName?: string;
  onSubmit: (review: QuickReviewFormData) => void;
  onCancel?: () => void;
}

export const QuickReview: React.FC<QuickReviewProps> = ({
  placeId = '',
  placeName = '',
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<QuickReviewFormData>({
    placeName: placeName,
    satisfaction: 3,
    value: 3,
    contextTags: [],
    comment: '',
    visitDate: new Date().toISOString().split('T')[0]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Face emotions from least to most satisfied
  const satisfactionEmojis = ['😞', '😕', '😐', '😊', '🤩'];
  // Value emotions from overpriced to excellent value
  const valueEmojis = ['😤', '😒', '😐', '😌', '🤑'];

  const handleContextTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      contextTags: prev.contextTags.includes(tag)
        ? prev.contextTags.filter(t => t !== tag)
        : [...prev.contextTags, tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.placeName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Track the review submission
      track('review_submitted', {
        place_id: placeId,
        place_name: formData.placeName,
        satisfaction: formData.satisfaction,
        value: formData.value,
        context_tags: formData.contextTags.join(','),
        has_comment: !!formData.comment?.trim()
      });

      // Simulate optimistic UI - submit immediately
      onSubmit(formData);
      
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Quick Review
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Share your experience with just a few taps!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Place Name */}
        <div>
          <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Place Name
          </label>
          <Input
            id="placeName"
            type="text"
            value={formData.placeName}
            onChange={(e) => setFormData(prev => ({ ...prev, placeName: e.target.value }))}
            placeholder="Pizzeria Corallo"
            className="w-full"
            required
          />
        </div>

        {/* Satisfaction Slider */}
        <EmojiSlider
          label="How was your overall experience?"
          value={formData.satisfaction}
          onChange={(value) => setFormData(prev => ({ ...prev, satisfaction: value }))}
          emojis={satisfactionEmojis}
        />

        {/* Value Slider */}
        <EmojiSlider
          label="How was the value for money?"
          value={formData.value}
          onChange={(value) => setFormData(prev => ({ ...prev, value: value }))}
          emojis={valueEmojis}
        />

        {/* Context Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            What describes this place? (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleContextTagToggle(tag)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${formData.contextTags.includes(tag)
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }
                `}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Any additional thoughts? (optional)
          </label>
          <textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Tell us more about your experience..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400
                     resize-none min-h-[80px]"
            style={{ 
              height: 'auto',
              minHeight: '80px',
              maxHeight: '200px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 200) + 'px';
            }}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || !formData.placeName.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuickReview;
