# Profile Update Toast System

A celebration system that shows contextual toasts when users complete meaningful profile updates, with smart deduplication and analytics tracking.

## Overview

The Profile Update Toast System provides:
- **Contextual Messages**: Field-specific celebrations tailored to Trento travel context
- **Smart Deduplication**: Prevents spam from rapid/repeated updates  
- **Analytics Tracking**: Fires `track('profile_boost', { field, delta })` events
- **Visual Feedback**: Animated toasts with emojis and color coding

## Implementation

### 1. Toast Components

**Toast Component** (`src/components/ui/Toast.tsx`)
- Individual toast with entrance/exit animations
- Type-based styling (success, info, warning, error)
- Auto-dismiss with configurable duration
- Manual dismiss button

**Toast Manager** (`src/components/ui/ToastManager.tsx`)
- Context provider for toast system
- Toast queue management and stacking
- Profile boost toast logic with field-specific messages
- Deduplication with 2-second window

### 2. Profile Update Service

**ProfileUpdateService** (`src/services/profileUpdateService.ts`)
- Detects field changes between old and new profiles
- Calculates score deltas for each changed field
- Integrates with existing `saveProfile` function
- Triggers toasts only for meaningful changes (delta > 0)

**Hook Integration** (`src/hooks/useProfileUpdateToasts.ts`)
- Connects ProfileUpdateService with ToastManager
- Provides `saveProfileWithToasts` function for components

### 3. Integration Points

**Form Components**
- `MultiStepForm` uses `saveProfileWithToasts` for step updates
- Automatic toast triggering on successful saves
- Fallback to regular save if toast save fails

**Root Layout**
- `ToastProvider` wraps entire application
- Global toast state management

## Toast Messages

### Contextual Messages by Field

| Field | Message | Emoji |
|-------|---------|-------|
| **firstName** | "Great! Now your recommendations will feel more personal" | 👋 |
| **lastName** | "Perfect! Your profile is looking more complete" | 📝 |
| **activities** | "Now we'll recommend more hidden hiking trails near Trento" | 🌲 |
| **placeTypes** | "Excellent! We'll find the perfect spots that match your vibe" | 🗺️ |
| **foodExcitement** | "Delicious! We'll suggest the best local eateries in Trento" | 🍝 |
| **restrictions** | "Got it! We'll only recommend safe dining options for you" | 🛡️ |
| **travelPersonality** | "Perfect! We'll match you with like-minded travel experiences" | 🌟 |
| **spendingStyle** | "Smart! We'll recommend options that fit your budget perfectly" | 💰 |

### Default Fallback
For unmapped fields: "Profile updated! Your recommendations just got {delta} points better 🚀"

## Technical Features

### Deduplication Logic
```typescript
const dedupeKey = `${field}-${Date.now() - (Date.now() % 2000)}`; // 2-second window

if (recentToasts.has(dedupeKey)) return; // Skip if recently shown
```

### Score Delta Calculation
- Compares profile scores before/after each field change
- Only triggers toasts for positive deltas (meaningful improvements)
- Uses profile scoring service weights for accurate impact assessment

### Analytics Integration
```typescript
track('profile_boost', { 
  field: 'activities',    // Field that was updated
  delta: 13              // Points gained from update
});
```

### Staggered Display
Multiple field updates are staggered by 100ms to prevent visual overload:
```typescript
setTimeout(() => {
  this.toastCallback!(field, delta);
}, changedFields.indexOf(field) * 100);
```

## Usage Examples

### Basic Usage in Components
```tsx
import { useProfileUpdateToasts } from '@/hooks/useProfileUpdateToasts';

function ProfileForm() {
  const { saveProfileWithToasts } = useProfileUpdateToasts();

  const handleSave = async (profile: UserPreferences) => {
    const result = await saveProfileWithToasts(profile);
    if (result.success) {
      console.log('Updated fields:', result.changedFields);
      console.log('Score deltas:', result.scoreDeltas);
    }
  };
}
```

### Manual Toast Triggering
```tsx
import { useToast } from '@/components/ui/ToastManager';

function Component() {
  const { showProfileBoostToast } = useToast();

  const triggerCelebration = () => {
    showProfileBoostToast('activities', 13); // Field name and delta
  };
}
```

### Custom Toast Messages
```tsx
const { showToast } = useToast();

showToast({
  message: 'Custom celebration message',
  type: 'success',
  emoji: '🎉',
  duration: 3000
});
```

## Configuration

### Toast Appearance
- **Duration**: Default 4 seconds for profile boosts, 5 seconds for others
- **Position**: Fixed top-right with automatic stacking
- **Animation**: Slide-in from right with fade
- **Styling**: Tailwind-based with dark mode support

### Deduplication Settings
- **Window**: 2 seconds for same field updates
- **Cleanup**: Automatic cleanup after 3 seconds
- **Memory**: In-memory Set for current session

### Analytics Events
- **Event Name**: `profile_boost`
- **Properties**: `{ field: string, delta: number }`
- **Timing**: Fired before toast display
- **Fallback**: Graceful failure if analytics unavailable

## Testing

### Demo Pages

**Profile Toast Demo** (`/profile-toast-demo`)
- Interactive testing with different profile states
- Field-specific update buttons
- Real-time toast preview

**Test Environment** (`/test-env`)
- Basic toast system testing
- Manual trigger buttons
- Integration verification

### Test Scenarios
1. **Single Field Update**: Update one field, verify appropriate toast
2. **Multiple Fields**: Update multiple fields, verify staggered toasts
3. **Rapid Updates**: Test deduplication with quick successive updates
4. **No Delta**: Update field with no score impact, verify no toast
5. **Analytics**: Verify tracking events are fired correctly

## Troubleshooting

### Common Issues

**Toasts Not Appearing**
- Check ToastProvider is wrapping the app in root layout
- Verify useProfileUpdateToasts hook is called in component
- Ensure profile updates result in positive score deltas

**Duplicate Toasts**
- Verify deduplication window is working (2 seconds)
- Check for multiple simultaneous profile saves
- Clear browser storage if testing frequently

**Analytics Not Tracking**
- Verify track function is properly imported
- Check network requests in browser dev tools
- Ensure analytics service is configured

**Styling Issues**
- Verify Tailwind classes are properly compiled
- Check z-index conflicts with other UI elements
- Test in both light and dark modes

### Debug Logging
Enable detailed logging:
```typescript
// In ProfileUpdateService
console.log('Changed fields:', changedFields);
console.log('Score deltas:', scoreDeltas);

// In ToastManager  
console.log('Showing toast for field:', field, 'delta:', delta);
```

## Future Enhancements

### Planned Features
1. **Milestone Celebrations**: Special toasts for completion milestones (25%, 50%, 75%, 100%)
2. **Personalization**: User preference for toast frequency/style
3. **Achievement System**: Unlock badges for completing profile sections
4. **Social Sharing**: Share profile completion achievements
5. **Onboarding Integration**: Guided celebration during first-time setup

### Technical Improvements
1. **Persistence**: Remember dismissed toasts across sessions
2. **Accessibility**: Enhanced screen reader support
3. **Performance**: Virtual scrolling for many simultaneous toasts
4. **Customization**: Theme-based toast styling
5. **Metrics**: Detailed engagement analytics for toast effectiveness

For implementation details, see the source code in:
- `src/components/ui/Toast.tsx`
- `src/components/ui/ToastManager.tsx`  
- `src/services/profileUpdateService.ts`
- `src/hooks/useProfileUpdateToasts.ts`
