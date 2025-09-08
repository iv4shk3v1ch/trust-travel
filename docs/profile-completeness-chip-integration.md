# Profile Completeness Chip Integration Guide

This guide shows how to integrate the Profile Completeness Chip into your dashboard header for a seamless user experience.

## Overview

The Profile Completeness Chip is a compact UI component that displays:
- A circular progress ring indicating completion percentage
- Color-coded progress (red → yellow → green)
- Interactive sheet showing missing items with deep links
- Smart messaging: "Your profile is X% smart"

## Implementation

### 1. Basic Integration

```tsx
import { ProfileCompletenessChip } from '@/components/ui/ProfileCompletenessChip';
import { useUserProfile } from '@/hooks/useUserProfile';

function Header() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.id);

  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center h-16 px-4">
        <div>Brand Logo</div>
        <div className="flex items-center space-x-4">
          <ProfileCompletenessChip profile={profile} />
          <span>{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
```

### 2. Dashboard Layout Integration

The chip is automatically included in the dashboard header through the layout:

```tsx
// src/app/dashboard/layout.tsx
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header /> {/* Includes ProfileCompletenessChip */}
      <main>{children}</main>
    </div>
  );
}
```

### 3. Profile Hook Usage

```tsx
// src/hooks/useUserProfile.ts
export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<UserPreferences | null>(null);
  
  useEffect(() => {
    if (!userId) return;
    
    // Fetch user profile from API
    fetchUserProfile(userId).then(setProfile);
  }, [userId]);

  return { profile, loading, error };
}
```

## Component Features

### Progress Visualization
- **Ring Progress**: SVG-based circular progress indicator
- **Color Coding**: 
  - Red: 0-49% complete
  - Yellow: 50-79% complete  
  - Green: 80-100% complete
- **Percentage Display**: Shows exact completion percentage

### Interactive Sheet
When clicked, opens a bottom sheet with:
- **Title**: "Your profile is {score}% smart"
- **Subtitle**: "Add these to boost accuracy"
- **Missing Items List**: Prioritized by importance and points
- **CTA Buttons**: Direct links to form sections
- **Completion State**: Celebration when 100% complete

### Deep Link Integration
Each missing field links to its specific form section:
```
/profile?step=1#firstName  → Basic Info - First Name
/profile?step=2#activities → Preferences - Activities
/profile?step=3#foodExcitement → Food - Preferences
etc.
```

## Customization

### Custom Styling
```tsx
<ProfileCompletenessChip 
  profile={profile} 
  className="custom-positioning-classes"
/>
```

### Profile Scoring Configuration
```tsx
import { getProfileScore, DEFAULT_PROFILE_SCORE_CONFIG } from '@/services/profileScore';

const customConfig = {
  ...DEFAULT_PROFILE_SCORE_CONFIG,
  weights: {
    basicInfo: { total: 40, firstName: 12, lastName: 12, gender: 8, ageGroup: 8 },
    preferences: { total: 60, activities: 30, placeTypes: 30 }
  }
};

const { score } = getProfileScore(profile, customConfig);
```

## Demo Pages

Test the implementation on these demo pages:

### Full Integration Demo
- **URL**: `/profile-demo`
- **Features**: Interactive profile state switching, live chip updates
- **Use Case**: Development testing and stakeholder demos

### Test Environment
- **URL**: `/test-env`  
- **Features**: Side-by-side comparison of different completion states
- **Use Case**: Component testing and visual verification

## User Experience Flow

1. **User sees chip** in dashboard header with current completion %
2. **Clicks chip** → Bottom sheet slides up
3. **Reviews missing items** → Prioritized list with point values
4. **Clicks "Complete"** → Direct navigation to form section
5. **Completes field** → Returns to dashboard
6. **Sees updated progress** → Higher percentage and fewer missing items

## Best Practices

### Performance
- Use React.memo for ProfileCompletenessChip if profile updates frequently
- Cache profile scores using useMemo when config is static
- Debounce profile updates to avoid excessive re-calculations

### Accessibility
- Ensure adequate color contrast for progress colors
- Add aria-label to progress ring for screen readers
- Include keyboard navigation for sheet interactions

### Mobile Optimization
- Sheet auto-adjusts to mobile viewport (max-h-[80vh])
- Touch-friendly button sizes (min 44px)
- Swipe-to-dismiss gesture support

### Analytics
Track user engagement:
```tsx
import { track } from '@/lib/track';

// When chip is clicked
track('profile_completeness_chip_clicked', { 
  currentScore: score,
  missingFieldsCount: missingItems.length 
});

// When CTA is clicked
track('profile_completion_cta_clicked', { 
  field: item.field,
  section: item.section,
  pointValue: item.weight 
});
```

## Implementation Checklist

- [ ] Install ProfileCompletenessChip component
- [ ] Add to Header component 
- [ ] Implement useUserProfile hook
- [ ] Configure profile scoring weights
- [ ] Set up deep links in profile form
- [ ] Test on different profile completion states
- [ ] Add analytics tracking
- [ ] Verify mobile responsiveness
- [ ] Test accessibility compliance

## Troubleshooting

### Common Issues

**Chip not appearing**
- Verify user is authenticated
- Check profile data is loading
- Ensure component is imported correctly

**Progress not updating**
- Check profile updates trigger re-renders
- Verify scoring configuration is correct
- Debug with console.log in useEffect

**Deep links not working**
- Ensure profile form handles URL parameters
- Check route configuration
- Verify field name mapping is correct

**Sheet not opening**
- Check z-index conflicts
- Verify click handlers are attached
- Test on different screen sizes

For more details, see the [Profile Completeness Service Documentation](./profile-completeness-service.md).
