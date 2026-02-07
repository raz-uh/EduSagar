import { supabase } from './supabaseService';
import { UserProfile, Language } from '../types';

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  try {
    // Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Failed to create account' };
    }

    // Create user profile in database
    const newUser: UserProfile = {
      id: authData.user.id,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`,
      language: Language.EN,
      walletAddress: '',
      totalPoints: 0,
      weeklyPoints: 0,
      badges: [],
      streak: 0,
      lastActiveDate: new Date().toISOString(),
      srsData: {},
      sbtCredentials: [],
    };

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return { user: null, error: 'Failed to create user profile' };
    }

    return { user: profileData, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Unknown error' };
  }
}

/**
 * Sign in user with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Failed to sign in' };
    }

    // Fetch user profile from database
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return { user: null, error: 'Failed to load user profile' };
    }

    return { user: profileData, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Unknown error' };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (error: any) {
    return { error: error.message || 'Unknown error' };
  }
}

/**
 * Get current session user
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return null;
    }

    // Fetch user profile from database
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    return profileData;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: UserProfile | null) => void
) {
  const { data } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        const profile = await getCurrentUser();
        callback(profile);
      } else {
        callback(null);
      }
    }
  );

  return data?.subscription;
}

/**
 * Reset password via email
 */
export async function resetPassword(email: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message || 'Unknown error' };
  }
}
