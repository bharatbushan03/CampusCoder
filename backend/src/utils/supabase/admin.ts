import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';
import { getSupabaseSecretKey, getSupabaseUrl } from './config';

export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseSecretKey();

  if (!serviceRoleKey) {
    console.warn('Warning: SUPABASE_SECRET_KEY is missing. Admin queries requiring bypass will fail.');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
