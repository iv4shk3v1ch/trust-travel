// Simple analytics tracking function
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function track(_event: string, _properties?: Record<string, string | number | boolean | null | undefined>) {
  if (typeof window !== 'undefined') {
    // TODO: Replace with actual analytics service (e.g., Posthog, Mixpanel, etc.)
    // Example:
    // posthog.capture(_event, _properties);
    // mixpanel.track(_event, _properties);
    // gtag('event', _event, _properties);
    
    // For development, you can uncomment the line below:
    // console.log('Analytics event:', _event, _properties);
  }
}
