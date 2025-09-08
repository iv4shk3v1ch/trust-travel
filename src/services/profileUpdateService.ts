import { UserPreferences } from '@/types/preferences';
import { getProfileScore } from '@/services/profileScore';
import { saveProfile as baseSaveProfile, loadProfile } from '@/lib/database';

export interface ProfileUpdateResult {
  success: boolean;
  changedFields: string[];
  scoreDeltas: Record<string, number>;
  error?: string;
}

export class ProfileUpdateService {
  private static instance: ProfileUpdateService;
  private toastCallback?: (field: string, delta: number) => void;

  private constructor() {}

  public static getInstance(): ProfileUpdateService {
    if (!ProfileUpdateService.instance) {
      ProfileUpdateService.instance = new ProfileUpdateService();
    }
    return ProfileUpdateService.instance;
  }

  public setToastCallback(callback: (field: string, delta: number) => void) {
    this.toastCallback = callback;
  }

  private detectChanges(oldProfile: UserPreferences | null, newProfile: UserPreferences): string[] {
    const changes: string[] = [];

    if (!oldProfile) {
      // If no old profile, everything is new
      return this.getAllFieldNames(newProfile);
    }

    // Compare basic info
    if (oldProfile.basicInfo.firstName !== newProfile.basicInfo.firstName) changes.push('firstName');
    if (oldProfile.basicInfo.lastName !== newProfile.basicInfo.lastName) changes.push('lastName');
    if (oldProfile.basicInfo.gender !== newProfile.basicInfo.gender) changes.push('gender');
    if (oldProfile.basicInfo.ageGroup !== newProfile.basicInfo.ageGroup) changes.push('ageGroup');

    // Compare preferences
    if (!this.arraysEqual(oldProfile.preferences.activities, newProfile.preferences.activities)) {
      changes.push('activities');
    }
    if (!this.arraysEqual(oldProfile.preferences.placeTypes, newProfile.preferences.placeTypes)) {
      changes.push('placeTypes');
    }

    // Compare food and restrictions
    if (!this.arraysEqual(oldProfile.foodAndRestrictions.foodExcitement, newProfile.foodAndRestrictions.foodExcitement)) {
      changes.push('foodExcitement');
    }
    if (!this.arraysEqual(oldProfile.foodAndRestrictions.restrictions, newProfile.foodAndRestrictions.restrictions)) {
      changes.push('restrictions');
    }
    if (!this.arraysEqual(oldProfile.foodAndRestrictions.placesToAvoid, newProfile.foodAndRestrictions.placesToAvoid)) {
      changes.push('placesToAvoid');
    }

    // Compare personality and style
    if (!this.arraysEqual(oldProfile.personalityAndStyle.travelPersonality, newProfile.personalityAndStyle.travelPersonality)) {
      changes.push('travelPersonality');
    }
    if (oldProfile.personalityAndStyle.planningStyle !== newProfile.personalityAndStyle.planningStyle) {
      changes.push('planningStyle');
    }

    // Compare budget
    if (oldProfile.budget.spendingStyle !== newProfile.budget.spendingStyle) changes.push('spendingStyle');
    if (oldProfile.budget.travelWith !== newProfile.budget.travelWith) changes.push('travelWith');

    return changes;
  }

  private getAllFieldNames(profile: UserPreferences): string[] {
    const fields: string[] = [];
    
    // Add all possible field names
    if (profile.basicInfo.firstName) fields.push('firstName');
    if (profile.basicInfo.lastName) fields.push('lastName');
    if (profile.basicInfo.gender) fields.push('gender');
    if (profile.basicInfo.ageGroup) fields.push('ageGroup');
    
    if (profile.preferences.activities.length >= 2) fields.push('activities');
    if (profile.preferences.placeTypes.length >= 2) fields.push('placeTypes');
    
    if (profile.foodAndRestrictions.foodExcitement.length >= 1) fields.push('foodExcitement');
    if (profile.foodAndRestrictions.restrictions.length >= 0) fields.push('restrictions'); // Can be empty
    if (profile.foodAndRestrictions.placesToAvoid.length >= 0) fields.push('placesToAvoid'); // Can be empty
    
    if (profile.personalityAndStyle.travelPersonality.length >= 1) fields.push('travelPersonality');
    if (profile.personalityAndStyle.planningStyle) fields.push('planningStyle');
    
    if (profile.budget.spendingStyle) fields.push('spendingStyle');
    if (profile.budget.travelWith) fields.push('travelWith');

    return fields;
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  }

  private calculateFieldScoreDeltas(oldProfile: UserPreferences | null, newProfile: UserPreferences, changedFields: string[]): Record<string, number> {
    const deltas: Record<string, number> = {};

    const oldScore = getProfileScore(oldProfile);

    // For each changed field, calculate its individual contribution
    changedFields.forEach(field => {
      // Create a version of the old profile with only this field changed
      const testProfile = oldProfile ? this.deepCloneProfile(oldProfile) : this.createEmptyProfile();
      
      // Apply only this field change
      this.applyFieldChange(testProfile, newProfile, field);
      
      const testScore = getProfileScore(testProfile);
      const fieldDelta = testScore.totalScore - oldScore.totalScore;
      
      if (fieldDelta > 0) {
        deltas[field] = Math.round(fieldDelta);
      }
    });

    return deltas;
  }

  private deepCloneProfile(profile: UserPreferences): UserPreferences {
    return {
      basicInfo: { ...profile.basicInfo },
      preferences: { 
        activities: [...profile.preferences.activities],
        placeTypes: [...profile.preferences.placeTypes]
      },
      foodAndRestrictions: {
        foodExcitement: [...profile.foodAndRestrictions.foodExcitement],
        restrictions: [...profile.foodAndRestrictions.restrictions],
        placesToAvoid: [...profile.foodAndRestrictions.placesToAvoid]
      },
      personalityAndStyle: {
        travelPersonality: [...profile.personalityAndStyle.travelPersonality],
        planningStyle: profile.personalityAndStyle.planningStyle
      },
      budget: { ...profile.budget },
      completedSteps: [...profile.completedSteps],
      isComplete: profile.isComplete
    };
  }

  private createEmptyProfile(): UserPreferences {
    return {
      basicInfo: { firstName: '', lastName: '', gender: '', ageGroup: '' },
      preferences: { activities: [], placeTypes: [] },
      foodAndRestrictions: { foodExcitement: [], restrictions: [], placesToAvoid: [] },
      personalityAndStyle: { travelPersonality: [], planningStyle: '' },
      budget: { spendingStyle: '', travelWith: '' },
      completedSteps: [],
      isComplete: false
    };
  }

  private applyFieldChange(targetProfile: UserPreferences, sourceProfile: UserPreferences, field: string) {
    switch (field) {
      case 'firstName':
        targetProfile.basicInfo.firstName = sourceProfile.basicInfo.firstName;
        break;
      case 'lastName':
        targetProfile.basicInfo.lastName = sourceProfile.basicInfo.lastName;
        break;
      case 'gender':
        targetProfile.basicInfo.gender = sourceProfile.basicInfo.gender;
        break;
      case 'ageGroup':
        targetProfile.basicInfo.ageGroup = sourceProfile.basicInfo.ageGroup;
        break;
      case 'activities':
        targetProfile.preferences.activities = [...sourceProfile.preferences.activities];
        break;
      case 'placeTypes':
        targetProfile.preferences.placeTypes = [...sourceProfile.preferences.placeTypes];
        break;
      case 'foodExcitement':
        targetProfile.foodAndRestrictions.foodExcitement = [...sourceProfile.foodAndRestrictions.foodExcitement];
        break;
      case 'restrictions':
        targetProfile.foodAndRestrictions.restrictions = [...sourceProfile.foodAndRestrictions.restrictions];
        break;
      case 'placesToAvoid':
        targetProfile.foodAndRestrictions.placesToAvoid = [...sourceProfile.foodAndRestrictions.placesToAvoid];
        break;
      case 'travelPersonality':
        targetProfile.personalityAndStyle.travelPersonality = [...sourceProfile.personalityAndStyle.travelPersonality];
        break;
      case 'planningStyle':
        targetProfile.personalityAndStyle.planningStyle = sourceProfile.personalityAndStyle.planningStyle;
        break;
      case 'spendingStyle':
        targetProfile.budget.spendingStyle = sourceProfile.budget.spendingStyle;
        break;
      case 'travelWith':
        targetProfile.budget.travelWith = sourceProfile.budget.travelWith;
        break;
    }
  }

  public async saveProfileWithToasts(newProfile: UserPreferences): Promise<ProfileUpdateResult> {
    try {
      // Load the current profile for comparison
      const oldProfile = await loadProfile();
      
      // Detect changes
      const changedFields = this.detectChanges(oldProfile, newProfile);
      
      // Calculate score deltas for meaningful changes
      const scoreDeltas = this.calculateFieldScoreDeltas(oldProfile, newProfile, changedFields);
      
      // Save the profile
      await baseSaveProfile(newProfile);
      
      // Trigger toasts for meaningful changes (only if delta > 0)
      if (this.toastCallback) {
        changedFields.forEach(field => {
          const delta = scoreDeltas[field];
          if (delta && delta > 0) {
            // Add a small delay to stagger multiple toasts
            setTimeout(() => {
              this.toastCallback!(field, delta);
            }, changedFields.indexOf(field) * 100);
          }
        });
      }
      
      return {
        success: true,
        changedFields,
        scoreDeltas
      };
    } catch (error) {
      return {
        success: false,
        changedFields: [],
        scoreDeltas: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const profileUpdateService = ProfileUpdateService.getInstance();
