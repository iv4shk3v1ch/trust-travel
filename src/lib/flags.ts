/**
 * Feature Flags Utility
 * 
 * Provides a simple way to enable/disable features based on environment variables
 * or localStorage for client-side overrides.
 */

// Default flag values
const DEFAULT_FLAGS: Record<string, boolean> = {
  UX_UPGRADES: false,
  BETA_FEATURES: false,
  ADVANCED_ANALYTICS: false,
  NEW_DASHBOARD: false,
  EXPERIMENTAL_AI: false,
};

/**
 * Check if a feature flag is enabled
 * Priority: localStorage > environment variables > default values
 */
export function isEnabled(key: string): boolean {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    try {
      // Check localStorage first (allows runtime overrides for testing)
      const localStorageKey = `feature_flag_${key}`;
      const localValue = localStorage.getItem(localStorageKey);
      
      if (localValue !== null) {
        return localValue === 'true';
      }
    } catch (error) {
      // localStorage might not be available in some environments
      console.warn(`Failed to read feature flag from localStorage: ${key}`, error);
    }
  }

  // Check environment variables (server-side or build-time)
  const envKey = `NEXT_PUBLIC_FLAG_${key}`;
  const envValue = process.env[envKey];
  
  if (envValue !== undefined) {
    return envValue === 'true';
  }

  // Fall back to default value
  return DEFAULT_FLAGS[key] ?? false;
}

/**
 * Set a feature flag value in localStorage (client-side only)
 * Useful for testing and development
 */
export function setFlag(key: string, value: boolean): void {
  if (typeof window === 'undefined') {
    console.warn('setFlag can only be used in browser environment');
    return;
  }

  try {
    const localStorageKey = `feature_flag_${key}`;
    localStorage.setItem(localStorageKey, value.toString());
    console.log(`Feature flag ${key} set to ${value}`);
  } catch (error) {
    console.error(`Failed to set feature flag ${key}:`, error);
  }
}

/**
 * Remove a feature flag from localStorage
 * This will make the flag fall back to environment or default values
 */
export function clearFlag(key: string): void {
  if (typeof window === 'undefined') {
    console.warn('clearFlag can only be used in browser environment');
    return;
  }

  try {
    const localStorageKey = `feature_flag_${key}`;
    localStorage.removeItem(localStorageKey);
    console.log(`Feature flag ${key} cleared from localStorage`);
  } catch (error) {
    console.error(`Failed to clear feature flag ${key}:`, error);
  }
}

/**
 * Get all available feature flags and their current values
 * Useful for debugging and admin interfaces
 */
export function getAllFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  
  Object.keys(DEFAULT_FLAGS).forEach(key => {
    flags[key] = isEnabled(key);
  });
  
  return flags;
}

/**
 * Debug utility to log all feature flags
 * Only runs in development mode
 */
export function debugFlags(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.group('🚩 Feature Flags Status');
  Object.entries(getAllFlags()).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✅ ON' : '❌ OFF'}`);
  });
  console.groupEnd();
}
