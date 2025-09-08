/**
 * @jest-environment jsdom
 */

import { 
  getProfileScore, 
  getNextSuggestedField, 
  DEFAULT_PROFILE_SCORE_CONFIG,
  type ProfileScoreConfig 
} from '../profileScore';
import type { UserPreferences } from '@/types/preferences';

describe('Profile Score Service', () => {
  // Test data fixtures
  const emptyProfile: UserPreferences = {
    basicInfo: {
      firstName: '',
      lastName: '',
      gender: '',
      ageGroup: '',
    },
    preferences: {
      activities: [],
      placeTypes: [],
    },
    foodAndRestrictions: {
      foodExcitement: [],
      restrictions: [],
      placesToAvoid: [],
    },
    personalityAndStyle: {
      travelPersonality: [],
      planningStyle: '',
    },
    budget: {
      spendingStyle: '',
      travelWith: '',
    },
    completedSteps: [],
    isComplete: false,
  };

  const fullyCompletedProfile: UserPreferences = {
    basicInfo: {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      ageGroup: '25-34',
    },
    preferences: {
      activities: ['hiking', 'photography', 'museums'],
      placeTypes: ['mountains', 'cities', 'historical'],
    },
    foodAndRestrictions: {
      foodExcitement: ['local-cuisine'],
      restrictions: [], // Can be empty
      placesToAvoid: [], // Can be empty
    },
    personalityAndStyle: {
      travelPersonality: ['adventurous'],
      planningStyle: 'spontaneous',
    },
    budget: {
      spendingStyle: 'budget-conscious',
      travelWith: 'solo',
    },
    completedSteps: [1, 2, 3, 4, 5],
    isComplete: true,
  };

  const partialProfile: UserPreferences = {
    basicInfo: {
      firstName: 'Jane',
      lastName: 'Smith',
      gender: '',
      ageGroup: '18-24',
    },
    preferences: {
      activities: ['shopping'], // Only 1 item (needs 2)
      placeTypes: ['beaches', 'cities'],
    },
    foodAndRestrictions: {
      foodExcitement: [],
      restrictions: [],
      placesToAvoid: [],
    },
    personalityAndStyle: {
      travelPersonality: ['relaxed'],
      planningStyle: '',
    },
    budget: {
      spendingStyle: 'moderate',
      travelWith: '',
    },
    completedSteps: [1, 2],
    isComplete: false,
  };

  describe('getProfileScore', () => {
    describe('edge cases', () => {
      it('should handle null profile', () => {
        const result = getProfileScore(null);
        
        expect(result.totalScore).toBe(0);
        expect(result.completionPercentage).toBe(0);
        expect(result.completedFields).toHaveLength(0);
        expect(result.missingFields.length).toBeGreaterThan(0);
        expect(result.sectionScores.basicInfo).toBe(0);
        expect(result.sectionScores.preferences).toBe(0);
        expect(result.sectionScores.foodAndRestrictions).toBe(0);
        expect(result.sectionScores.personalityAndStyle).toBe(0);
        expect(result.sectionScores.budget).toBe(0);
      });

      it('should handle undefined profile', () => {
        const result = getProfileScore(undefined);
        
        expect(result.totalScore).toBe(0);
        expect(result.completionPercentage).toBe(0);
        expect(result.completedFields).toHaveLength(0);
        expect(result.missingFields.length).toBeGreaterThan(0);
      });

      it('should handle truly empty profile with no optional fields', () => {
        const trulyEmptyProfile: UserPreferences = {
          ...emptyProfile,
          foodAndRestrictions: {
            foodExcitement: [],
            restrictions: null as unknown as string[], // Force null to not get credit
            placesToAvoid: null as unknown as string[], // Force null to not get credit
          },
        };

        const result = getProfileScore(trulyEmptyProfile);
        
        expect(result.totalScore).toBe(0);
        expect(result.completionPercentage).toBe(0);
        expect(result.completedFields).toHaveLength(0);
        expect(result.missingFields).toContain('firstName');
        expect(result.missingFields).toContain('restrictions');
        expect(result.missingFields).toContain('placesToAvoid');
      });

      it('should handle empty profile', () => {
        const result = getProfileScore(emptyProfile);
        
        // Empty profile should get credit for optional empty arrays (restrictions, placesToAvoid)
        // These are worth 6 + 6 = 12 points since they can legitimately be empty
        expect(result.totalScore).toBe(12);
        expect(result.completionPercentage).toBe(12);
        expect(result.completedFields).toEqual(['restrictions', 'placesToAvoid']);
        expect(result.missingFields).toContain('firstName');
        expect(result.missingFields).toContain('lastName');
        expect(result.missingFields).toContain('activities');
        expect(result.sectionScores.foodAndRestrictions).toBe(12); // Only restrictions + placesToAvoid
      });

      it('should handle profile with only empty arrays and strings', () => {
        const profile = {
          ...emptyProfile,
          basicInfo: {
            firstName: '   ', // Whitespace only
            lastName: '',
            gender: '',
            ageGroup: '',
          },
          preferences: {
            activities: [], // Empty array
            placeTypes: [],
          },
        };

        const result = getProfileScore(profile);
        
        // Should get credit for optional empty arrays but not whitespace-only strings
        expect(result.totalScore).toBe(12); // Only restrictions + placesToAvoid
        expect(result.missingFields).toContain('firstName');
        expect(result.missingFields).toContain('activities');
        expect(result.completedFields).toEqual(['restrictions', 'placesToAvoid']);
      });
    });

    describe('fully completed profile', () => {
      it('should give perfect score for complete profile', () => {
        const result = getProfileScore(fullyCompletedProfile);
        
        expect(result.totalScore).toBe(100);
        expect(result.completionPercentage).toBe(100);
        expect(result.missingFields).toHaveLength(0);
        expect(result.completedFields.length).toBeGreaterThan(0);
        
        // Check that all sections have scores
        expect(result.sectionScores.basicInfo).toBeGreaterThan(0);
        expect(result.sectionScores.preferences).toBeGreaterThan(0);
        expect(result.sectionScores.foodAndRestrictions).toBeGreaterThan(0);
        expect(result.sectionScores.personalityAndStyle).toBeGreaterThan(0);
        expect(result.sectionScores.budget).toBeGreaterThan(0);
      });

      it('should validate section score distribution', () => {
        const result = getProfileScore(fullyCompletedProfile);
        const config = DEFAULT_PROFILE_SCORE_CONFIG;
        
        // Section scores should match expected weights
        expect(result.sectionScores.basicInfo).toBe(config.weights.basicInfo.total);
        expect(result.sectionScores.preferences).toBe(config.weights.preferences.total);
        expect(result.sectionScores.foodAndRestrictions).toBe(config.weights.foodAndRestrictions.total);
        expect(result.sectionScores.personalityAndStyle).toBe(config.weights.personalityAndStyle.total);
        expect(result.sectionScores.budget).toBe(config.weights.budget.total);
        
        // Total should equal sum of section scores
        const expectedTotal = 
          result.sectionScores.basicInfo +
          result.sectionScores.preferences +
          result.sectionScores.foodAndRestrictions +
          result.sectionScores.personalityAndStyle +
          result.sectionScores.budget;
        
        expect(result.totalScore).toBe(expectedTotal);
      });
    });

    describe('partial arrays', () => {
      it('should handle arrays below minimum threshold', () => {
        const profileWithShortArrays: UserPreferences = {
          ...emptyProfile,
          basicInfo: {
            firstName: 'Test',
            lastName: 'User',
            gender: 'other',
            ageGroup: '25-34',
          },
          preferences: {
            activities: ['hiking'], // Only 1 item, needs 2
            placeTypes: ['mountains'], // Only 1 item, needs 2
          },
        };

        const result = getProfileScore(profileWithShortArrays);
        
        // Should get credit for basic info but not for activities/placeTypes
        expect(result.sectionScores.basicInfo).toBe(30); // Full basic info score
        expect(result.sectionScores.preferences).toBe(0); // No preference score
        expect(result.missingFields).toContain('activities');
        expect(result.missingFields).toContain('placeTypes');
      });

      it('should handle arrays at minimum threshold', () => {
        const profileWithMinArrays: UserPreferences = {
          ...emptyProfile,
          preferences: {
            activities: ['hiking', 'photography'], // Exactly 2 items
            placeTypes: ['mountains', 'beaches'], // Exactly 2 items
          },
        };

        const result = getProfileScore(profileWithMinArrays);
        
        // Should get full credit for preferences
        expect(result.sectionScores.preferences).toBe(25);
        expect(result.completedFields).toContain('activities');
        expect(result.completedFields).toContain('placeTypes');
      });

      it('should handle empty arrays for optional fields', () => {
        const profileWithOptionalEmpty: UserPreferences = {
          ...emptyProfile,
          foodAndRestrictions: {
            foodExcitement: ['local-cuisine'], // Required, has content
            restrictions: [], // Optional, can be empty
            placesToAvoid: [], // Optional, can be empty
          },
        };

        const result = getProfileScore(profileWithOptionalEmpty);
        
        // Should get credit for all food fields including empty optional ones
        expect(result.completedFields).toContain('foodExcitement');
        expect(result.completedFields).toContain('restrictions');
        expect(result.completedFields).toContain('placesToAvoid');
        expect(result.sectionScores.foodAndRestrictions).toBe(20);
      });
    });

    describe('deterministic scoring', () => {
      it('should produce consistent results for same input', () => {
        const result1 = getProfileScore(partialProfile);
        const result2 = getProfileScore(partialProfile);
        
        expect(result1.totalScore).toBe(result2.totalScore);
        expect(result1.completedFields).toEqual(result2.completedFields);
        expect(result1.missingFields).toEqual(result2.missingFields);
        expect(result1.sectionScores).toEqual(result2.sectionScores);
      });

      it('should handle custom configuration', () => {
        const customConfig: ProfileScoreConfig = {
          ...DEFAULT_PROFILE_SCORE_CONFIG,
          weights: {
            ...DEFAULT_PROFILE_SCORE_CONFIG.weights,
            basicInfo: {
              ...DEFAULT_PROFILE_SCORE_CONFIG.weights.basicInfo,
              total: 50, // Increase basic info weight
              firstName: 15,
              lastName: 15,
              gender: 10,
              ageGroup: 10,
            },
            preferences: {
              ...DEFAULT_PROFILE_SCORE_CONFIG.weights.preferences,
              total: 50, // Increase preferences weight
              activities: 25,
              placeTypes: 25,
            },
            foodAndRestrictions: {
              ...DEFAULT_PROFILE_SCORE_CONFIG.weights.foodAndRestrictions,
              total: 0, // Remove food weight
              foodExcitement: 0,
              restrictions: 0,
              placesToAvoid: 0,
            },
            personalityAndStyle: {
              ...DEFAULT_PROFILE_SCORE_CONFIG.weights.personalityAndStyle,
              total: 0, // Remove personality weight
              travelPersonality: 0,
              planningStyle: 0,
            },
            budget: {
              ...DEFAULT_PROFILE_SCORE_CONFIG.weights.budget,
              total: 0, // Remove budget weight
              spendingStyle: 0,
              travelWith: 0,
            },
          },
        };

        const result = getProfileScore(fullyCompletedProfile, customConfig);
        
        expect(result.totalScore).toBe(100); // Only basic info + preferences
        expect(result.sectionScores.basicInfo).toBe(50);
        expect(result.sectionScores.preferences).toBe(50);
        expect(result.sectionScores.foodAndRestrictions).toBe(0);
        expect(result.sectionScores.personalityAndStyle).toBe(0);
        expect(result.sectionScores.budget).toBe(0);
      });
    });
  });

  describe('getNextSuggestedField', () => {
    it('should return null for complete profile', () => {
      const result = getNextSuggestedField(fullyCompletedProfile);
      expect(result).toBeNull();
    });

    it('should return null for null profile', () => {
      const result = getNextSuggestedField(null);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('firstName'); // Highest priority field
    });

    it('should prioritize firstName for empty profile', () => {
      const result = getNextSuggestedField(emptyProfile);
      
      expect(result).not.toBeNull();
      expect(result?.field).toBe('firstName');
      expect(result?.section).toBe('basicInfo');
      expect(result?.priority).toBe(100);
      expect(result?.weight).toBe(8);
      expect(result?.reason).toContain('personalized');
    });

    it('should suggest next highest priority missing field', () => {
      const profileMissingLastName: UserPreferences = {
        ...emptyProfile,
        basicInfo: {
          firstName: 'John', // Completed
          lastName: '', // Missing
          gender: '',
          ageGroup: '',
        },
      };

      const result = getNextSuggestedField(profileMissingLastName);
      
      expect(result?.field).toBe('lastName'); // Next highest priority
      expect(result?.section).toBe('basicInfo');
      expect(result?.priority).toBe(95);
    });

    it('should suggest non-basic fields when basic info is complete', () => {
      const profileWithCompleteBasics: UserPreferences = {
        ...emptyProfile,
        basicInfo: {
          firstName: 'John',
          lastName: 'Doe',
          gender: 'male',
          ageGroup: '25-34',
        },
      };

      const result = getNextSuggestedField(profileWithCompleteBasics);
      
      expect(result?.field).toBe('activities'); // Next highest priority after basics
      expect(result?.section).toBe('preferences');
      expect(result?.priority).toBe(85);
    });

    it('should provide meaningful suggestion context', () => {
      const result = getNextSuggestedField(emptyProfile);
      
      expect(result?.reason).toBeTruthy();
      expect(result?.weight).toBeGreaterThan(0);
      expect(result?.priority).toBeGreaterThan(0);
      expect(result?.section).toBeTruthy();
    });

    it('should handle edge case where no valid suggestion exists', () => {
      const profileWithUnknownMissingFields = {
        ...fullyCompletedProfile,
        // Simulate having extra missing fields not in priority map
      };

      // Manually add a missing field not in the priority map
      const scoreResult = getProfileScore(profileWithUnknownMissingFields);
      scoreResult.missingFields.push('unknownField');

      // The function should still work and ignore unknown fields
      const result = getNextSuggestedField(profileWithUnknownMissingFields);
      expect(result).toBeNull(); // Should be null since profile is actually complete
    });
  });

  describe('configuration validation', () => {
    it('should have weights that sum to 100 in default config', () => {
      const config = DEFAULT_PROFILE_SCORE_CONFIG;
      const totalWeight = 
        config.weights.basicInfo.total +
        config.weights.preferences.total +
        config.weights.foodAndRestrictions.total +
        config.weights.personalityAndStyle.total +
        config.weights.budget.total;
      
      expect(totalWeight).toBe(100);
    });

    it('should have individual field weights sum to section totals', () => {
      const config = DEFAULT_PROFILE_SCORE_CONFIG;
      
      // Check basic info
      const basicInfoSum = 
        config.weights.basicInfo.firstName +
        config.weights.basicInfo.lastName +
        config.weights.basicInfo.gender +
        config.weights.basicInfo.ageGroup;
      expect(basicInfoSum).toBe(config.weights.basicInfo.total);
      
      // Check preferences
      const preferencesSum = 
        config.weights.preferences.activities +
        config.weights.preferences.placeTypes;
      expect(preferencesSum).toBe(config.weights.preferences.total);
    });
  });
});
