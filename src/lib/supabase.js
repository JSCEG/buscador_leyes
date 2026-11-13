import { createClient } from '@supabase/supabase-js';
import { observeAcervoFetch } from './service-availability.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: observeAcervoFetch((...args) => fetch(...args),
        () => window.dispatchEvent(new Event('acervo:check-service'))) },
});
