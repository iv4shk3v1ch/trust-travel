'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/core/database/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface DatabaseProfile {
  id: string
  full_name: string
  age: string
  gender: string
  budget_level: 'low' | 'medium' | 'high'
  activities: string[]
  place_types: string[]
  food_preferences: string[]
  food_restrictions: string[]
  personality_traits: string[]
  trip_style: string
  updated_at: string
}

interface AuthContextType {
  // Auth state
  user: User | null
  profile: DatabaseProfile | null
  session: Session | null
  loading: boolean
  error: string | null

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  
  // OAuth actions
  signInWithGoogle: () => Promise<void>
  
  // Profile actions
  updateProfile: (updates: Partial<DatabaseProfile>) => Promise<void>
  refreshProfile: () => Promise<void>

  // Utility functions
  hasCompletedOnboarding: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<DatabaseProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to create missing profile
  const createMissingProfile = useCallback(async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const fullName = userData.user?.user_metadata?.full_name || 
                      userData.user?.user_metadata?.name || 
                      userData.user?.email?.split('@')[0] || 
                      'User'

      console.log('Creating profile with data:', {
        userId,
        fullName,
        userMetadata: userData.user?.user_metadata
      })

      // First, let's check what fields exist in the profiles table
      const { data: tableInfo, error: schemaError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

      console.log('Table schema check:', { tableInfo, schemaError })

      // Create profile with the correct structure based on your table
      const profileData: Record<string, unknown> = {
        id: userId,
        full_name: fullName,
        age: '',
        gender: '',
        budget_level: 'medium',
        activities: [],
        place_types: [],
        food_preferences: [],
        food_restrictions: [],
        personality_traits: [],
        trip_style: ''
      }

      console.log('Attempting to create profile with fields:', Object.keys(profileData))

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        setError('Failed to create profile. Please try again.')
        return
      }

      console.log('Profile created successfully:', newProfile)
      setProfile(newProfile)
    } catch (err) {
      console.error('Error in createMissingProfile:', err)
      setError('Failed to create profile')
    }
  }, [])

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      console.log('Fetching profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('Profile fetch result:', { 
        data, 
        error,
        hasData: !!data,
        hasError: !!error
      })

      // Handle the case where there's no data and no error (empty result)
      if (!data && !error) {
        console.log('No data and no error - treating as missing profile')
        await createMissingProfile(userId)
        return
      }

      if (error) {
        console.log('Error object keys:', Object.keys(error))
        console.log('Error stringified:', JSON.stringify(error))
        console.log('Error properties:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // Check if it's a "no rows" error or empty error (profile doesn't exist)
        const isEmptyError = Object.keys(error).length === 0 || 
                            JSON.stringify(error) === '{}' ||
                            (!error.code && !error.message && !error.details)
                            
        const isNoRowsError = error.code === 'PGRST116' || 
                             error.message?.includes('no rows returned') ||
                             error.message?.includes('JSON object requested')

        if (isEmptyError || isNoRowsError) {
          console.log('Profile not found (empty error or no rows), creating minimal profile')
          await createMissingProfile(userId)
        } else {
          console.error('Unexpected database error:', error)
          // For now, let's still try to create a profile even if we get an unexpected error
          // This ensures the user can continue even if there's a database schema mismatch
          console.log('Attempting to create profile anyway due to unknown error')
          await createMissingProfile(userId)
        }
      } else if (data) {
        console.log('Profile found successfully:', data)
        setProfile(data)
      }
    } catch (err) {
      console.error('Profile fetch error (catch block):', err)
      setError('Profile loading failed')
    } finally {
      setLoading(false)
    }
  }, [createMissingProfile])

  // Simple auth initialization - no conflicts
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // Email/password sign in
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  // Email/password sign up
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      // For new signups, we'll create the profile in the onboarding flow
      if (data.user) {
        console.log('User created successfully:', data.user.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    // Let the auth state change handler deal with clearing state
    window.location.href = '/'
  }

  // Google OAuth sign in
  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      })

      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign in failed'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  // Update profile
  const updateProfile = async (updates: Partial<DatabaseProfile>) => {
    if (!user) throw new Error('Not authenticated')
    
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profile update failed'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  // Check if user has completed onboarding
  const hasCompletedOnboarding = (): boolean => {
    return !!(profile && 
           profile.full_name && 
           profile.age && 
           profile.gender &&
           profile.activities && 
           profile.activities.length > 0)
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateProfile,
    refreshProfile,
    hasCompletedOnboarding,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext