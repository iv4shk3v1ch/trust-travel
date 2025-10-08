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
    full_name: string;
    age: number;
    gender: string;
    activities: string[];
    personality_traits: string[];
    trip_style: string;
    budget_level: string;
  };
}

export interface UserWhoTrustsMe {
  id: string;
  source_user: string;
  trust_level: number;
  created_at: string;
  profiles: {
    full_name: string;
    age: number;
    gender: string;
    activities: string[];
    personality_traits: string[];
    trip_style: string;
    budget_level: string;
  };
}

// Check if current user has connected to a target user
export async function isUserConnected(targetUserId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('trust_links')
      .select('id')
      .eq('source_user', user.id)
      .eq('target_user', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking connection:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking connection:', error);
    return false;
  }
}

// Create a connection from current user to target user
export async function connectToUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    console.log('Connecting user:', user.id, 'to target:', targetUserId);

    if (user.id === targetUserId) {
      return { success: false, error: 'Cannot connect to yourself' };
    }

    // Check if connection already exists
    const alreadyConnected = await isUserConnected(targetUserId);
    if (alreadyConnected) {
      console.log('Already connected to user:', targetUserId);
      return { success: false, error: 'Already connected to this user' };
    }

    console.log('Creating new connection...');

    // Create the connection
    const { data, error } = await supabase
      .from('trust_links')
      .insert({
        source_user: user.id,
        target_user: targetUserId,
        trust_level: 1 // Direct connection
      });

    if (error) {
      console.error('Error creating connection:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return { success: false, error: `Failed to create connection: ${error.message}` };
    }

    console.log('Connection created successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Error connecting to user:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// Remove connection from current user to target user
export async function disconnectFromUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('trust_links')
      .delete()
      .eq('source_user', user.id)
      .eq('target_user', targetUserId);

    if (error) {
      console.error('Error removing connection:', error);
      return { success: false, error: 'Failed to remove connection' };
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user for getMyConnections');
      return [];
    }

    console.log('Fetching my connections for user:', user.id);

    // Get trust links first
    const { data: links, error: linksError } = await supabase
      .from('trust_links')
      .select('id, target_user, trust_level, created_at')
      .eq('source_user', user.id)
      .order('created_at', { ascending: false });

    if (linksError) {
      console.error('Error fetching trust links:', {
        code: linksError.code,
        message: linksError.message,
        details: linksError.details,
        hint: linksError.hint
      });
      return [];
    }

    console.log('Trust links found:', links?.length || 0);

    if (!links || links.length === 0) {
      return [];
    }

    // Get profiles for each target user
    const targetUserIds = links.map(link => link.target_user);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, age, gender, activities, personality_traits, trip_style, budget_level')
      .in('id', targetUserIds);

    if (profilesError) {
      console.error('Error fetching profiles:', {
        code: profilesError.code,
        message: profilesError.message
      });
      return [];
    }

    console.log('Profiles found:', profiles?.length || 0);

    // Combine the data
    return links.map(link => {
      const profile = profiles?.find(p => p.id === link.target_user);
      return {
        id: link.id,
        target_user: link.target_user,
        trust_level: link.trust_level,
        created_at: link.created_at,
        profiles: profile
      };
    }).filter(item => item.profiles) as UserConnection[];
  } catch (error) {
    console.error('Error fetching connections:', error);
    return [];
  }
}

// Get users who have connected to the current user (who trust the current user)
export async function getUsersWhoTrustMe(): Promise<UserWhoTrustsMe[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user for getUsersWhoTrustMe');
      return [];
    }

    console.log('Fetching users who trust me for user:', user.id);

    // Get trust links where current user is the target
    const { data: links, error: linksError } = await supabase
      .from('trust_links')
      .select('id, source_user, trust_level, created_at')
      .eq('target_user', user.id)
      .order('created_at', { ascending: false });

    if (linksError) {
      console.error('Error fetching trust links:', {
        code: linksError.code,
        message: linksError.message,
        details: linksError.details,
        hint: linksError.hint
      });
      return [];
    }

    console.log('Trust links found:', links?.length || 0);

    if (!links || links.length === 0) {
      return [];
    }

    // Get profiles for each source user
    const sourceUserIds = links.map(link => link.source_user);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, age, gender, activities, personality_traits, trip_style, budget_level')
      .in('id', sourceUserIds);

    if (profilesError) {
      console.error('Error fetching profiles:', {
        code: profilesError.code,
        message: profilesError.message
      });
      return [];
    }

    console.log('Profiles found:', profiles?.length || 0);

    // Combine the data
    return links.map(link => {
      const profile = profiles?.find(p => p.id === link.source_user);
      return {
        id: link.id,
        source_user: link.source_user,
        trust_level: link.trust_level,
        created_at: link.created_at,
        profiles: profile
      };
    }).filter(item => item.profiles) as UserWhoTrustsMe[];
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('trust_links')
      .select('id')
      .eq('source_user', sourceUserId)
      .eq('target_user', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if user connected to me:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking if user connected to me:', error);
    return false;
  }
}
