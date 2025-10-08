import { DatabaseProfile } from '@/core/database/newDatabase';

/**
 * Calculates the completeness percentage of a user's profile
 * @param profile - The user's profile data
 * @returns Object with completion percentage and missing fields
 */
export function calculateProfileCompleteness(profile: DatabaseProfile): {
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
} {
  if (!profile) {
    return {
      percentage: 0,
      isComplete: false,
      missingFields: ['All profile information']
    };
  }

  // Define fields with clear categories
  const requiredFields = [
    { key: 'full_name', name: 'Name' },
    { key: 'age', name: 'Age' },
    { key: 'gender', name: 'Gender' },
    { key: 'budget_level', name: 'Budget Level' },
    { key: 'trip_style', name: 'Trip Style' }
  ];

  const optionalFields = [
    { key: 'personality_traits', name: 'Personality Traits', isArray: true },
    { key: 'activities', name: 'Preferred Activities', isArray: true },
    { key: 'food_preferences', name: 'Food Preferences', isArray: true },
    { key: 'food_restrictions', name: 'Food Restrictions', isArray: true }
  ];

  let completedRequired = 0;
  let completedOptional = 0;
  const missingFields: string[] = [];

  // Check required fields
  requiredFields.forEach(field => {
    const value = profile[field.key as keyof DatabaseProfile];
    if (value && value !== '' && value !== null && value !== undefined) {
      completedRequired++;
    } else {
      missingFields.push(field.name);
    }
  });

  // Check optional fields
  optionalFields.forEach(field => {
    const value = profile[field.key as keyof DatabaseProfile];
    if (field.isArray) {
      if (Array.isArray(value) && value.length > 0) {
        completedOptional++;
      }
    } else if (value && value !== '' && value !== null && value !== undefined) {
      completedOptional++;
    }
  });

  // Calculate percentage: Each field is worth equal weight
  const totalFields = requiredFields.length + optionalFields.length;
  const completedFields = completedRequired + completedOptional;
  const percentage = Math.round((completedFields / totalFields) * 100);
  
  // Profile is considered "complete" if all required fields are filled
  const isComplete = completedRequired === requiredFields.length;

  return {
    percentage: Math.min(percentage, 100),
    isComplete,
    missingFields
  };
}

/**
 * Determines if profile completion banner should be shown
 * @param profile - The user's profile data
 * @returns Boolean indicating if banner should be displayed
 */
export function shouldShowCompletionBanner(profile: DatabaseProfile | null): boolean {
  if (!profile) {
    return true; // Show banner if no profile exists
  }

  const { percentage, isComplete } = calculateProfileCompleteness(profile);
  
  // Show banner if profile is less than 80% complete or missing required fields
  const shouldShow = percentage < 80 || !isComplete;
  
  return shouldShow;
}

/**
 * Gets a completion message for the user
 * @param profile - The user's profile data
 * @returns Encouraging message based on completion status
 */
export function getCompletionMessage(profile: DatabaseProfile | null): {
  title: string;
  description: string;
  buttonText: string;
} {
  if (!profile) {
    return {
      title: "Welcome! Let's set up your profile 🌟",
      description: "Create your travel profile to get personalized recommendations and connect with fellow travelers.",
      buttonText: "Get Started"
    };
  }

  const { percentage, missingFields } = calculateProfileCompleteness(profile);

  if (percentage === 100) {
    return {
      title: "Your profile looks amazing! ✨",
      description: "Consider adding more details to help travelers discover you better.",
      buttonText: "Enhance Profile"
    };
  } else if (percentage >= 80) {
    return {
      title: `Almost there! ${percentage}% complete 🎯`,
      description: "Add a few more details to unlock the full TrustTravel experience.",
      buttonText: "Complete Profile"
    };
  } else if (missingFields.length > 0) {
    return {
      title: "Complete your profile for better matches 📋",
      description: `Missing: ${missingFields.slice(0, 2).join(', ')}${missingFields.length > 2 ? ` and ${missingFields.length - 2} more` : ''}`,
      buttonText: "Complete Profile"
    };
  } else {
    return {
      title: `${percentage}% complete - You're getting there! 🚀`,
      description: "Add more travel preferences to help others discover you.",
      buttonText: "Continue Setup"
    };
  }
}
