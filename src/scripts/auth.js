import { supabase } from '../lib/supabase.js';

let currentUser = null;
const authListeners = [];
let authSubscription = null;

function notifyAuthListeners() {
    authListeners.forEach(cb => cb(currentUser));
}

export async function initAuth() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('[Auth] Error obteniendo sesión actual:', sessionError);
    } else {
        currentUser = sessionData.session?.user ?? null;
        notifyAuthListeners();
    }

    if (authSubscription) {
        authSubscription.subscription.unsubscribe();
    }

    authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user ?? null;
        notifyAuthListeners();
    });
}

export function getCurrentUser() {
    return currentUser;
}

export function isLoggedIn() {
    return currentUser !== null;
}

export function isAdmin() {
    // Si el usuario tiene un metadato is_admin o role: admin, o un email específico
    if (!currentUser) return false;
    const metadata = currentUser.user_metadata || {};
    return metadata.role === 'admin' || metadata.is_admin === true || currentUser.email === 'admin@sener.gob.mx';
}

export function onAuthChange(cb) {
    authListeners.push(cb);
    cb(currentUser);
}

export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
}

export async function register(email, password, fullName) {
    const metadata = {};
    if (typeof fullName === 'string' && fullName.trim()) {
        metadata.full_name = fullName.trim();
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata,
        },
    });
    if (error) throw error;
    return data.user;
}

export async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// ── DB operations ─────────────────────────────────────────────────────────────

export async function dbGetFavorites() {
    const user = getCurrentUser();
    if (!user) return [];
    const { data, error } = await supabase
        .from('user_favorites')
        .select('articulo_id')
        .eq('user_id', user.id);
    if (error) throw error;
    return data.map(r => r.articulo_id);
}

export async function dbAddFavorite(articuloId) {
    const user = getCurrentUser();
    if (!user) return;
    const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, articulo_id: articuloId });
    if (error && error.code !== '23505') throw error; // ignore unique constraint
}

export async function dbRemoveFavorite(articuloId) {
    const user = getCurrentUser();
    if (!user) return;
    const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('articulo_id', articuloId);
    if (error) throw error;
}

export async function dbGetAllNotes() {
    const user = getCurrentUser();
    if (!user) return {};
    const { data, error } = await supabase
        .from('user_notes')
        .select('articulo_id, nota')
        .eq('user_id', user.id);
    if (error) throw error;
    const result = {};
    for (const r of data) result[r.articulo_id] = r.nota;
    return result;
}

export async function dbSaveNote(articuloId, text) {
    const user = getCurrentUser();
    if (!user) return;
    if (text.trim()) {
        const { error } = await supabase
            .from('user_notes')
            .upsert({
                user_id: user.id,
                articulo_id: articuloId,
                nota: text.trim(),
                updated_at: new Date().toISOString()
            });
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('user_notes')
            .delete()
            .eq('user_id', user.id)
            .eq('articulo_id', articuloId);
        if (error) throw error;
    }
}
