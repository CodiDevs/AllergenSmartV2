import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://eeggyyyabxqwszixomgj.supabase.co';
const supabaseAnonKey = 'sb_publishable_X6ZVLX96RtBycaoZFnxOvw_TkOKUe8a';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
