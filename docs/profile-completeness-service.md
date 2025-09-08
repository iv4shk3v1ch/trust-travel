# Profile Completeness Service

The Profile Completeness Service provides deterministic scoring of user profiles from 0-100 based on configurable field weights. This service helps improve user experience by showing completion progress and suggesting next steps.

## Features

- **Deterministic Scoring**: Consistent results for the same input
- **Configurable Weights**: Customizable scoring criteria
- **Smart Suggestions**: Prioritized field completion recommendations
- **Comprehensive Testing**: Full unit test coverage for edge cases

## Core Functions

### `getProfileScore(profile, config?)`

Calculates a comprehensive completeness score for a user profile.

**Parameters:**
- `profile: UserPreferences | null | undefined` - The profile to score
- `config?: ProfileScoreConfig` - Optional custom scoring configuration

**Returns:** `ProfileScoreResult`
```typescript
{
  totalScore: number;           // 0-100 overall score
  sectionScores: {              // Breakdown by section
    basicInfo: number;
    preferences: number;
    foodAndRestrictions: number;
    personalityAndStyle: number;
    budget: number;
  };
  completedFields: string[];    // List of completed field names
  missingFields: string[];      // List of missing field names
  completionPercentage: number; // Same as totalScore (for clarity)
}
```

### `getNextSuggestedField(profile, config?)`

Identifies the highest-priority missing field to complete next.

**Parameters:**
- `profile: UserPreferences | null | undefined` - The profile to analyze
- `config?: ProfileScoreConfig` - Optional custom scoring configuration

**Returns:** `NextSuggestedFieldResult | null`
```typescript
{
  field: string;      // Field name to complete
  section: string;    // Section containing the field
  priority: number;   // Priority score (higher = more important)
  weight: number;     // Point value for completing this field
  reason: string;     // Human-readable explanation
}
```

## Scoring Logic

### Default Weights (Total: 100 points)

| Section | Weight | Fields |
|---------|--------|--------|
| **Basic Info** | 30 | firstName (8), lastName (8), gender (7), ageGroup (7) |
| **Preferences** | 25 | activities (13), placeTypes (12) |
| **Food & Restrictions** | 20 | foodExcitement (8), restrictions (6), placesToAvoid (6) |
| **Personality & Style** | 15 | travelPersonality (8), planningStyle (7) |
| **Budget** | 10 | spendingStyle (5), travelWith (5) |

### Array Field Requirements

Some fields are arrays that require minimum items for credit:

- `activities`: 2 items minimum
- `placeTypes`: 2 items minimum  
- `foodExcitement`: 1 item minimum
- `travelPersonality`: 1 item minimum
- `restrictions`: 0 items (can be empty)
- `placesToAvoid`: 0 items (can be empty)

### Field Validation

- **String fields**: Must be non-empty and not just whitespace
- **Array fields**: Must meet minimum length requirements
- **Optional fields**: `restrictions` and `placesToAvoid` get credit even when empty

## Usage Examples

### Basic Usage

```typescript
import { getProfileScore, getNextSuggestedField } from '@/services/profileScore';

// Get profile score
const scoreResult = getProfileScore(userProfile);
console.log(`Profile is ${scoreResult.totalScore}% complete`);

// Get next suggestion
const suggestion = getNextSuggestedField(userProfile);
if (suggestion) {
  console.log(`Complete ${suggestion.field} for +${suggestion.weight} points`);
}
```

### Custom Configuration

```typescript
import { getProfileScore, DEFAULT_PROFILE_SCORE_CONFIG } from '@/services/profileScore';

const customConfig = {
  ...DEFAULT_PROFILE_SCORE_CONFIG,
  weights: {
    ...DEFAULT_PROFILE_SCORE_CONFIG.weights,
    basicInfo: { total: 50, firstName: 15, lastName: 15, gender: 10, ageGroup: 10 },
    preferences: { total: 50, activities: 25, placeTypes: 25 },
    // Set others to 0 to focus only on basics + preferences
  }
};

const result = getProfileScore(profile, customConfig);
```

### React Integration

```typescript
import { useProfileCompleteness } from '@/services/profileScoreExamples';

function ProfileWidget({ profile }) {
  const { score, nextSuggestion, isComplete } = useProfileCompleteness(profile);
  
  return (
    <div>
      <div>Completion: {score}%</div>
      {nextSuggestion && (
        <div>Next: Complete {nextSuggestion.field}</div>
      )}
    </div>
  );
}
```

## Edge Cases Handled

### Null/Undefined Profiles
- Returns 0 score with all fields marked as missing
- Suggests `firstName` as the first field to complete

### Empty Profiles  
- Gives credit for optional empty arrays (`restrictions`, `placesToAvoid`)
- Results in 12-point base score from these fields

### Partial Arrays
- Arrays below minimum threshold get no credit
- Arrays at/above threshold get full credit

### Whitespace-Only Strings
- Treated as empty/incomplete
- Must have meaningful content to get credit

## Testing

The service includes comprehensive unit tests covering:

- ✅ Null and undefined profiles
- ✅ Empty profiles with various configurations
- ✅ Fully completed profiles
- ✅ Partial arrays below/at/above thresholds
- ✅ Deterministic scoring consistency
- ✅ Custom configuration validation
- ✅ Field suggestion priority logic
- ✅ Edge cases and error conditions

Run tests:
```bash
npm test -- profileScore
```

## Technical Details

### Deterministic Scoring
- Same input always produces same output
- No randomness or time-dependent factors
- Suitable for caching and comparison

### Performance
- O(1) complexity for most operations
- Memoization-friendly (pure functions)
- Lightweight calculations suitable for real-time use

### Type Safety
- Full TypeScript support
- Compile-time validation of field names
- Proper handling of optional/nullable fields

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic Weights**: Adjust weights based on user behavior
2. **Contextual Scoring**: Different weights for different use cases
3. **Progressive Scoring**: Bonus points for completing entire sections
4. **Quality Scoring**: Consider not just presence but quality of data
5. **Machine Learning**: Learn optimal weights from user engagement data
