export interface TravelPlan {
  destination: {
    area: string;
    region: string;
  };
  dates: {
    type: 'now' | 'custom';
    startDate?: string;
    endDate?: string;
    isFlexible: boolean;
  };
  travelType: 'solo' | 'date' | 'family' | 'friends' | 'business';
  experienceTags: string[]; // Experience tags from data standards - can select 1-3
  specialNeeds: string[];
  completedSteps: number[];
  isComplete: boolean;
  categories?: string[]; // Optional specific categories to filter by
}

// Available options
export const DESTINATION_AREAS = [
  { id: 'trento-city', label: 'Trento City', icon: '🏛️', description: 'Downtown, historic center, urban attractions' },
  { id: 'historic-villages', label: 'Small Historic Villages', icon: '🏘️', description: 'Traditional villages with cultural heritage' },
  { id: 'nature-easy', label: 'Nature (Easy Walk)', icon: '🌲', description: 'Parks, easy trails, relaxing nature spots' },
  { id: 'nature-hike', label: 'Nature (Hiking)', icon: '🏔️', description: 'Mountain trails, challenging hikes, adventure' }
];

export const TRAVEL_TYPES = [
  { id: 'solo', label: 'Solo', icon: '👤' },
  { id: 'date', label: 'Date', icon: '❤️' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { id: 'friends', label: 'Friends', icon: '👫' },
  { id: 'business', label: 'Business', icon: '💼' }
];

// Experience tags from data standards - these align with our place/review system
// Removed social context tags (covered by travel type) and timing tags (covered by dates)
export const TRAVEL_EXPERIENCE_TAGS = [
  // Value Proposition
  { id: 'exceptional-food', label: 'Exceptional Food', icon: '🍽️', description: 'Outstanding culinary experience' },
  { id: 'cultural-immersion', label: 'Cultural Immersion', icon: '🎭', description: 'Authentic local culture' },
  { id: 'scenic-beauty', label: 'Scenic Beauty', icon: '📸', description: 'Beautiful views/natural beauty' },
  { id: 'historical-significance', label: 'Historical Significance', icon: '🏛️', description: 'Important historical value' },
  { id: 'unique-architecture', label: 'Unique Architecture', icon: '🏗️', description: 'Notable building/design' },
  
  // Atmosphere & Experience
  { id: 'relaxing', label: 'Relaxing', icon: '🧘', description: 'Calm, peaceful experience' },
  { id: 'energetic', label: 'Energetic', icon: '⚡', description: 'High energy, lively atmosphere' },
  { id: 'intimate', label: 'Intimate', icon: '🤗', description: 'Small, cozy, personal setting' },
  { id: 'authentic-local', label: 'Authentic Local', icon: '🏘️', description: 'Real local experience, not touristy' },
  
  // Practical Considerations
  { id: 'budget-friendly', label: 'Budget Friendly', icon: '💰', description: 'Good value, affordable' },
  { id: 'luxury', label: 'Luxury', icon: '💎', description: 'High-end, premium experience' },
  { id: 'crowd-level-low', label: 'Not Crowded', icon: '🤫', description: 'Usually quiet, peaceful' },
  { id: 'crowd-level-high', label: 'Lively & Busy', icon: '🎪', description: 'Usually bustling with activity' }
];

export const SPECIAL_NEEDS = [
  { id: 'special-occasion', label: 'Special occasion', icon: '🎂' },
  { id: 'vegetarian', label: 'Vegetarian/Vegan food', icon: '🌱' },
  { id: 'accessibility', label: 'Accessibility needs', icon: '♿' },
  { id: 'pets', label: 'Traveling with pets', icon: '🐶' },
  { id: 'off-grid', label: 'Off-grid / low-tech', icon: '📵' }
];
