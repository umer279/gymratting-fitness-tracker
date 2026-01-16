
import { createClient } from '@supabase/supabase-js';

// These environment variables should be configured for the app to work.
// You can find these in your Supabase project's API settings.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
