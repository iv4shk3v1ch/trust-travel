# Feature Flags & Analytics Utilities

This package provides lightweight utilities for feature flags and analytics tracking in the trust-travel application.

## Feature Flags (`lib/flags.ts`)

### Basic Usage

```typescript
import { isEnabled, setFlag, clearFlag } from '@/lib/flags';

// Check if a feature is enabled
if (isEnabled('UX_UPGRADES')) {
  // Show enhanced UI
}

// Enable a feature for testing (client-side only)
setFlag('UX_UPGRADES', true);

// Disable a feature
setFlag('UX_UPGRADES', false);

// Clear flag (falls back to env/default)
clearFlag('UX_UPGRADES');
```

### Available Flags

- `UX_UPGRADES` - Enhanced user interface features
- `BETA_FEATURES` - Beta functionality
- `ADVANCED_ANALYTICS` - Enhanced tracking
- `NEW_DASHBOARD` - Updated dashboard layout
- `EXPERIMENTAL_AI` - Experimental AI features

### Configuration Priority

1. **localStorage** (runtime overrides for testing)
2. **Environment variables** (`NEXT_PUBLIC_FLAG_*`)
3. **Default values** (defined in code)

### Environment Variables

Set in `.env.local`:
```bash
NEXT_PUBLIC_FLAG_UX_UPGRADES=true
NEXT_PUBLIC_FLAG_BETA_FEATURES=false
```

## Analytics (`lib/track.ts`)

### Basic Usage

```typescript
import { track, trackClick, trackPageView } from '@/lib/track';

// Track custom events
track('user_signup', { method: 'email', plan: 'free' });

// Track clicks
trackClick('header_logo', { section: 'navigation' });

// Track page views
trackPageView('/dashboard');
```

### Available Tracking Functions

- `track(event, data?)` - Generic event tracking
- `trackPageView(page, data?)` - Page view tracking
- `trackClick(element, data?)` - Click tracking
- `trackFormSubmit(form, data?)` - Form submission tracking
- `trackError(error, data?)` - Error tracking
- `trackFeatureUsage(feature, data?)` - Feature usage tracking

### Development Features

- Events are logged to console in development mode
- Events are stored in localStorage for debugging
- Session tracking with automatic session ID generation

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Integration Examples

### Feature-Flagged Component

```typescript
import { isEnabled } from '@/lib/flags';
import { trackFeatureUsage } from '@/lib/track';

export function EnhancedButton() {
  const hasUXUpgrades = isEnabled('UX_UPGRADES');

  if (hasUXUpgrades) {
    trackFeatureUsage('UX_UPGRADES', { component: 'EnhancedButton' });
    return <button className="enhanced-style">✨ Enhanced</button>;
  }

  return <button className="standard-style">Standard</button>;
}
```

### Analytics Integration

```typescript
import { trackClick } from '@/lib/track';

export function AnalyticsButton({ onClick, trackingId, children }) {
  const handleClick = () => {
    trackClick(trackingId);
    onClick?.();
  };

  return <button onClick={handleClick}>{children}</button>;
}
```

### Page Tracking

```typescript
import { track } from '@/lib/track';

export default function DashboardPage() {
  useEffect(() => {
    track('page_view', { page: 'dashboard' });
  }, []);

  return <div>Dashboard content</div>;
}
```

## Development Tools

### Debug Feature Flags

```typescript
import { debugFlags, getAllFlags } from '@/lib/flags';

// Log all flags to console (development only)
debugFlags();

// Get all flags programmatically
const flags = getAllFlags();
console.log(flags); // { UX_UPGRADES: false, BETA_FEATURES: true, ... }
```

### Debug Analytics

```typescript
import { getStoredEvents, clearStoredEvents, getSessionStats } from '@/lib/track';

// Get all stored events (development only)
const events = getStoredEvents();

// Clear stored events
clearStoredEvents();

// Get session statistics
const stats = getSessionStats();
```

## Production Considerations

1. **Feature Flags**: Use environment variables for production deployments
2. **Analytics**: Extend `sendToAnalyticsService()` to integrate with your analytics provider
3. **Storage**: Events are only stored locally in development mode
4. **Performance**: All utilities are lightweight and designed for minimal impact

## File Structure

```
src/lib/
├── flags.ts              # Feature flags utility
├── track.ts              # Analytics tracking utility
├── examples.tsx          # Integration examples
└── __tests__/
    ├── flags-simple.test.ts    # Feature flags tests
    └── track-simple.test.ts    # Analytics tests
```
