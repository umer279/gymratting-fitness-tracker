
import { createClient } from '@supabase/supabase-js';

// These environment variables should be configured for the app to work.
// You can find these in your Supabase project's API settings.
const supabaseUrl = "";
const supabaseAnonKey = "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
