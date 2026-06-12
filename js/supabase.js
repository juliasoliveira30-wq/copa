// Mercado da Copa - Supabase Configuration
// IMPORTANT: Replace with your Supabase project credentials
const SUPABASE_URL = 'https://lflihdiisnbpbbpbgoah.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbGloZGlpc25icGJicGJnb2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDE3MDcsImV4cCI6MjA5NjgxNzcwN30.rq-RVsN1xVOInJpn0CN2wW8Fj-3uEONZqHUcbInycxY';

let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized');
        return supabaseClient;
    } else {
        console.warn('⚠️ Supabase library not loaded. Running in demo mode.');
        return null;
    }
}

function getSupabase() {
    return supabaseClient;
}

// Check if we're in demo mode (no Supabase configured)
function isDemoMode() {
    return !supabaseClient || SUPABASE_URL === 'https://lflihdiisnbpbbpbgoah.supabase.co';
}
