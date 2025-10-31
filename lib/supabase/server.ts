import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for server-side usage with cookies
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem(key: string) {
            return cookieStore.get(key)?.value ?? null;
          },
          setItem(key: string, value: string) {
            cookieStore.set({ name: key, value, httpOnly: true });
          },
          removeItem(key: string) {
            cookieStore.delete(key);
          },
        },
      },
    }
  );
}

/**
 * Alias for backward compatibility
 */
export async function createClient() {
  return createServerClient();
}

/**
 * Get the current authenticated user on the server
 */
export async function getServerUser() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

