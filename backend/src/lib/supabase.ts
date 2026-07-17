import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicKey, getSupabaseUrl } from '@/utils/supabase/config';

const supabaseUrl = getSupabaseUrl() || 'https://placeholder-project.supabase.co';
const supabasePublicKey = getSupabasePublicKey() || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabasePublicKey);
