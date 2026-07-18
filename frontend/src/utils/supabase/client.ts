import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';
import { getSupabasePublicKey, getSupabaseUrl, isSupabaseConfigured } from './config';

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

export { isSupabaseConfigured };

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
    getSupabaseUrl(),
    getSupabasePublicKey()
  );
}
