export interface BasicInfo {
  firstName: string;
  lastName: string;
  gender: string;
  ageGroup: string;
}

export interface TravelPreferences {
  activities: string[];
  placeTypes: string[];
}

export interface FoodAndRestrictions {
  foodExcitement: string[];
  restrictions: string[];
  placesToAvoid: string[];
}

export interface PersonalityAndStyle {
  travelPersonality: string[];
  planningStyle: string;
}

export interface Budget {
  spendingStyle: string;
  travelWith: string;
}

export interface UserPreferences {
  basicInfo: BasicInfo;
  preferences: TravelPreferences;
  foodAndRestrictions: FoodAndRestrictions;
  personalityAndStyle: PersonalityAndStyle;
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
