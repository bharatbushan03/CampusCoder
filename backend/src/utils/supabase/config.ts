const placeholderPattern = /placeholder|your[-_\s]|example|dummy|substitute/i;

export function getSupabaseUrl() {
  return process.env.SUPABASE_URL || '';
}

export function getSupabasePublicKey() {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  );
}

export function getSupabaseSecretKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  );
}

function hasRealValue(value: string) {
  return Boolean(value) && !placeholderPattern.test(value);
}

export function isSupabaseConfigured() {
  const url = getSupabaseUrl();
  const publicKey = getSupabasePublicKey();
  const hasSupportedPublicKey =
    publicKey.startsWith('sb_publishable_') || publicKey.length > 40;

  return (
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    hasRealValue(url) &&
    hasSupportedPublicKey &&
    hasRealValue(publicKey)
  );
}
