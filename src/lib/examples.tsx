/**
 * Example integration of feature flags and analytics in the travel app
 * This shows how to use the utilities in real components
 */

import React from 'react';
import { isEnabled, getAllFlags, debugFlags } from '@/lib/flags';
import { track, trackClick, trackFeatureUsage, getSessionStats, getStoredEvents } from '@/lib/track';

// Example: Enhanced button component with analytics
export function AnalyticsButton({ 
  children, 
  onClick, 
  trackingId,
  className,
  ...props 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  trackingId: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const handleClick = () => {
    // Track the click event
    trackClick(trackingId, {
      component: 'AnalyticsButton',
      timestamp: Date.now(),
    });
    
    // Call original onClick if provided
    onClick?.();
  };

  return (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

// Example: Feature-flagged component
export function UXUpgradesExample() {
  const hasUXUpgrades = isEnabled('UX_UPGRADES');

  if (hasUXUpgrades) {
    // Track feature usage
    trackFeatureUsage('UX_UPGRADES', {
      component: 'UXUpgradesExample',
      version: 'enhanced',
    });

    return (
      <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
        <h2 className="text-white text-xl font-bold">✨ Enhanced UX</h2>
        <p className="text-purple-100">
          You&apos;re seeing the new and improved user experience!
        </p>
        <AnalyticsButton
          trackingId="ux_upgrade_cta"
          className="mt-4 bg-white text-purple-600 px-4 py-2 rounded"
        >
          Try New Features
        </AnalyticsButton>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-gray-800 text-xl font-bold">Standard Experience</h2>
      <p className="text-gray-600">
        The classic, reliable interface you know and love.
      </p>
      <AnalyticsButton
        trackingId="standard_cta"
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Continue
      </AnalyticsButton>
    </div>
  );
}

// Example: Page-level analytics integration
export function withPageTracking<T extends object>(
  Component: React.ComponentType<T>,
  pageName: string
) {
  return function TrackedPage(props: T) {
    React.useEffect(() => {
      // Track page view
      track('page_view', {
        page: pageName,
        timestamp: Date.now(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      });
    }, []);

    return <Component {...props} />;
  };
}

// Example usage in a page component:
// const TrackedDashboard = withPageTracking(DashboardPage, 'dashboard');
// export default TrackedDashboard;

// Example: A/B testing with feature flags
export function ABTestExample() {
  const showNewButton = isEnabled('UX_UPGRADES');
  const variant = showNewButton ? 'B' : 'A';

  // Track A/B test exposure
  track('ab_test_exposure', {
    test: 'button_design',
    variant,
    component: 'ABTestExample',
  });

  return (
    <div className="p-4">
      <h3>A/B Test: Button Design</h3>
      {showNewButton ? (
        <AnalyticsButton
          trackingId="ab_test_button_b"
          className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-full"
        >
          🚀 Modern Button (Variant B)
        </AnalyticsButton>
      ) : (
        <AnalyticsButton
          trackingId="ab_test_button_a"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Classic Button (Variant A)
        </AnalyticsButton>
      )}
    </div>
  );
}

// Debug component for development
export function FeatureFlagsDebug() {
  const flags = getAllFlags();
  const stats = getSessionStats();
  const events = getStoredEvents();

  React.useEffect(() => {
    debugFlags();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-xs">
      <h4 className="font-bold mb-2">🔧 Debug Info</h4>
      
      <div className="mb-2">
        <strong>Feature Flags:</strong>
        <ul>
          {Object.entries(flags).map(([key, value]) => (
            <li key={key}>
              {key}: {value ? '✅' : '❌'}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mb-2">
        <strong>Analytics:</strong>
        <div>Events: {stats.eventsCount}</div>
        <div>Session: {stats.sessionId.slice(-8)}</div>
        <div>Stored: {events.length}</div>
      </div>
    </div>
  );
}
