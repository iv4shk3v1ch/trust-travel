export interface BasicInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  phone: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface TravelPreferences {
  travelStyle: string[];
  accommodationType: string[];
  transportPreference: string[];
  groupSize: string;
  planningStyle: string;
  activityLevel: string;
}

export interface Personality {
  adventurousness: number; // 1-5 scale
  socialness: number; // 1-5 scale
  comfortLevel: number; // 1-5 scale
  flexibilityLevel: number; // 1-5 scale
  interests: string[];
  languages: string[];
}

export interface Restrictions {
  dietaryRestrictions: string[];
  medicalConditions: string[];
  mobilityRequirements: string[];
  religiousConsiderations: string[];
  allergies: string[];
}

export interface Budget {
  dailyBudget: {
    min: number;
    max: number;
  };
  currency: string;
  budgetPriorities: string[];
  paymentMethods: string[];
}

export interface UserPreferences {
  basicInfo: BasicInfo;
  preferences: TravelPreferences;
  personality: Personality;
  restrictions: Restrictions;
  budget: Budget;
  completedSteps: number[];
  isComplete: boolean;
}

export interface FormStepProps<T = Record<string, unknown>> {
  data: T;
  updateData: (stepData: Partial<T>) => void;
  onNext: () => void;
  onPrevious?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}
