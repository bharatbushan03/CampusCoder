import { createClient } from '@supabase/supabase-js';
import { Database } from '@campuscoder/backend/types/database.types';
import { getSupabaseUrl } from './config';

export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!serviceRoleKey) {
    console.warn('Warning: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is missing. Admin queries requiring bypass will fail.');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
