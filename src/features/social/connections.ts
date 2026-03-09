import { supabase } from '@/core/database/supabase';

export interface TrustLink {
  id: string;
  source_user: string;
  target_user: string;
  trust_level: number;
  created_at: string;
}

export interface UserConnection {
  id: string;
  target_user: string;
  trust_level: number;
  created_at: string;
  profiles: {
    full_name: string | null;
    age: number | null;
    gender: string | null;
    activities?: string[] | null;
    personality_traits?: string[] | null;
    trip_style?: string | null;
    budget: string | null;
    env_preference?: string | null;
    activity_style?: string | null;
    food_restrictions?: string | null;
  };
}

export interface UserWhoTrustsMe {
  id: string;
  source_user: string;
  trust_level: number;
  created_at: string;
  profiles: {
    full_name: string | null;
    age: number | null;
    gender: string | null;
    activities?: string[] | null;
    personality_traits?: string[] | null;
    trip_style?: string | null;
    budget: string | null;
    env_preference?: string | null;
    activity_style?: string | null;
    food_restrictions?: string | null;
  };
}

async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session?.access_token || null;
}

async function callConnectionsApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: 'User not authenticated' };

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`/api/connections${path}`, {
    ...options,
    headers
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = (payload as { error?: string } | null)?.error || 'Request failed';
    return { error: message };
  }

  return { data: payload as T };
}

// Check if current user has connected to a target user
export async function isUserConnected(targetUserId: string): Promise<boolean> {
  try {
    const result = await callConnectionsApi<{ iConnectedToThem: boolean }>(
      `?mode=status&targetUserId=${encodeURIComponent(targetUserId)}`,
      { method: 'GET' }
    );

    if (result.error) {
      console.error('Error checking connection:', result.error);
      return false;
    }

    return Boolean(result.data?.iConnectedToThem);
  } catch (error) {
    console.error('Error checking connection:', error);
    return false;
  }
}

// Create a connection from current user to target user
export async function connectToUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await callConnectionsApi<{ ok: boolean; alreadyConnected?: boolean }>(
      '',
      {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      }
    );

    if (result.error) {
      return { success: false, error: `Failed to create connection: ${result.error}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error connecting to user:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// Remove connection from current user to target user
export async function disconnectFromUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await callConnectionsApi<{ ok: boolean }>(
      '',
      {
        method: 'DELETE',
        body: JSON.stringify({ targetUserId })
      }
    );

    if (result.error) {
      console.error('Error removing connection:', result.error);
      return { success: false, error: `Failed to remove connection: ${result.error}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting from user:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// Get all users that the current user has connected to
export async function getMyConnections(): Promise<UserConnection[]> {
  try {
    const result = await callConnectionsApi<{ rows: UserConnection[] }>(
      '?mode=my',
      { method: 'GET' }
    );

    if (result.error) {
      console.error('Error fetching my connections:', result.error);
      return [];
    }
    return result.data?.rows || [];
  } catch (error) {
    console.error('Error fetching connections:', error);
    return [];
  }
}

// Get users who have connected to the current user (who trust the current user)
export async function getUsersWhoTrustMe(): Promise<UserWhoTrustsMe[]> {
  try {
    const result = await callConnectionsApi<{ rows: UserWhoTrustsMe[] }>(
      '?mode=trusted_by',
      { method: 'GET' }
    );

    if (result.error) {
      console.error('Error fetching users who trust me:', result.error);
      return [];
    }

    return result.data?.rows || [];
  } catch (error) {
    console.error('Error fetching users who trust me:', error);
    return [];
  }
}

// Check if there's mutual trust between current user and target user
export async function isMutualConnection(targetUserId: string): Promise<{ 
  iConnectedToThem: boolean; 
  theyConnectedToMe: boolean; 
  isMutual: boolean; 
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { iConnectedToThem: false, theyConnectedToMe: false, isMutual: false };

    // Check both directions
    const [iConnectedToThem, theyConnectedToMe] = await Promise.all([
      isUserConnected(targetUserId),
      checkIfUserConnectedToMe(targetUserId)
    ]);

    return {
      iConnectedToThem,
      theyConnectedToMe,
      isMutual: iConnectedToThem && theyConnectedToMe
    };
  } catch (error) {
    console.error('Error checking mutual connection:', error);
    return { iConnectedToThem: false, theyConnectedToMe: false, isMutual: false };
  }
}

// Helper function to check if a specific user has connected to current user
async function checkIfUserConnectedToMe(sourceUserId: string): Promise<boolean> {
  try {
    const result = await callConnectionsApi<{ theyConnectedToMe: boolean }>(
      `?mode=status&targetUserId=${encodeURIComponent(sourceUserId)}`,
      { method: 'GET' }
    );

    if (result.error) {
      console.error('Error checking if user connected to me:', result.error);
      return false;
    }

    return Boolean(result.data?.theyConnectedToMe);
  } catch (error) {
    console.error('Error checking if user connected to me:', error);
    return false;
  }
}
