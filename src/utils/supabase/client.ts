import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return (
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    !/placeholder|your-|example|dummy/i.test(url) &&
    anonKey.length > 40 &&
    !/placeholder|your-|example|dummy/i.test(anonKey)
  );
}

function createUnavailableQuery() {
  const result = {
    data: null,
    error: new Error('Supabase is not configured for this environment.'),
    count: null,
    status: 503,
    statusText: 'Service Unavailable',
  };

  const query = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return Promise.resolve(result).then.bind(Promise.resolve(result));
        }
        return () => query;
      },
    }
  );

  return query;
}

function createUnavailableClient(): BrowserSupabaseClient {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => undefined,
          },
        },
      }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error('Supabase Auth is not configured.'),
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error('Supabase Auth is not configured.'),
      }),
      resetPasswordForEmail: async () => ({
        data: null,
        error: new Error('Supabase Auth is not configured.'),
      }),
      updateUser: async () => ({
        data: { user: null },
        error: new Error('Supabase Auth is not configured.'),
      }),
    },
    from: () => createUnavailableQuery(),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error('Supabase Storage is not configured.') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as BrowserSupabaseClient;
}

export function createClient(): BrowserSupabaseClient {
  if (!isSupabaseConfigured()) {
    return createUnavailableClient();
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}
