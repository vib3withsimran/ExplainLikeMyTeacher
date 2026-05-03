import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://oqszcpqiiyjmxegbybqu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xc3pjcHFpaXlqbXhlZ2J5YnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3ODczNTgsImV4cCI6MjA5MzM2MzM1OH0.4KQ9EzcODY85DhDolCngrgIArmYUoQbHHR5p3OcpglQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    // Note: WebCrypto warning ("will default to plain") is harmless.
    // PKCE with 'plain' method works correctly — the key advantage is
    // tokens come as ?code= query params (preserved on Android)
    // instead of #access_token= hash fragments (stripped on Android).
  },
});
