const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

let client = null;

const isSupabaseConfigured = () => Boolean(env.supabaseUrl && (env.supabaseAnonKey || env.supabaseServiceRoleKey));

const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    const key = env.supabaseServiceRoleKey || env.supabaseAnonKey;
    client = createClient(env.supabaseUrl, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
  }

  return client;
};

module.exports = {
  isSupabaseConfigured,
  getSupabaseClient
};