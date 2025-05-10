
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const SUPABASE_URL = "https://meitoqhuhwqhzjywbxyf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1laXRvcWh1aHdxaHpqeXdieHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1ODc2NTksImV4cCI6MjA2MjE2MzY1OX0.pmTYmg50t1r4Vmk2y_MWDCzz2-5hVgJfHonQUDG4HwU";

// Import the extended supabase client like this:
// import { supabaseExtended } from "@/integrations/supabase/customClient";

export const supabaseExtended = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
