// Simple analytics tracking function
export function track(event: string, properties?: Record<string, string | number | boolean | null | undefined>) {
  if (typeof window !== 'undefined') {
    console.log('Analytics event:', event, properties);
    
    // TODO: Replace with actual analytics service (e.g., Posthog, Mixpanel, etc.)
    // Example:
    // posthog.capture(event, properties);
    // mixpanel.track(event, properties);
    // gtag('event', event, properties);
  }
}
