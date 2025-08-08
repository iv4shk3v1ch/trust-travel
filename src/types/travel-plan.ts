export interface TravelPlan {
  destination: {
    area: string;
    region: string;
  };
  dates: {
    type: 'this-weekend' | 'next-week' | 'custom';
    startDate?: string;
    endDate?: string;
    isFlexible: boolean;
  };
  travelType: 'solo' | 'date' | 'family' | 'friends' | 'business';
  goals: string[]; // Can select 1-3
  specialNeeds: string[];
  completedSteps: number[];
  isComplete: boolean;
}

// Available options
export const DESTINATION_AREAS = [
  { id: 'trento-city', label: 'Trento City', icon: '🏙' },
  { id: 'nearby-mountains', label: 'Nearby Mountains', icon: '🏞' },
  { id: 'wine-lakes', label: 'Wine & Lakes Area', icon: '🍇' },
  { id: 'historic-villages', label: 'Historic Villages', icon: '🏰' }
];

export const TRAVEL_TYPES = [
  { id: 'solo', label: 'Solo', icon: '👤' },
  { id: 'date', label: 'Date', icon: '❤️' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { id: 'friends', label: 'Friends', icon: '👫' },
  { id: 'business', label: 'Business', icon: '💼' }
];

export const TRAVEL_GOALS = [
  { id: 'adventure', label: 'Adventure', icon: '🧭' },
  { id: 'relax', label: 'Relax & Recharge', icon: '🧘' },
  { id: 'food-wine', label: 'Food & Wine', icon: '🍷' },
  { id: 'culture', label: 'Culture & History', icon: '🎭' },
  { id: 'nature', label: 'Nature & Outdoors', icon: '🏞' },
  { id: 'scenic', label: 'Scenic Spots', icon: '📸' },
  { id: 'social', label: 'Social Fun', icon: '🎉' },
  { id: 'shopping', label: 'Shopping', icon: '🛍' },
  { id: 'sport', label: 'Sport & Activity', icon: '🏋' },
  { id: 'learning', label: 'Learning / Workshops', icon: '📚' }
];

export const SPECIAL_NEEDS = [
  { id: 'special-occasion', label: 'Special occasion', icon: '🎂' },
  { id: 'vegetarian', label: 'Vegetarian/Vegan food', icon: '🌱' },
  { id: 'accessibility', label: 'Accessibility needs', icon: '♿' },
  { id: 'pets', label: 'Traveling with pets', icon: '🐶' },
  { id: 'off-grid', label: 'Off-grid / low-tech', icon: '📵' }
];
