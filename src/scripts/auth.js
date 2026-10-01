import { supabase } from '../lib/supabase.js';

let currentUser = null;
const authListeners = [];
let authSubscription = null;

function notifyAuthListeners() {
    authListeners.forEach(cb => cb(currentUser));
    // Listeners run again once the server confirms (or denies) admin rights.
    const user = currentUser;
    refreshAdmin().then(() => { if (currentUser === user) authListeners.forEach(cb => cb(currentUser)); });
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

    authSubscription = supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user ?? null;
        notifyAuthListeners();
        // The reset-password email brings the reader back signed in for this purpose only.
        if (event === 'PASSWORD_RECOVERY') window.dispatchEvent(new CustomEvent('auth:recovery'));
    });
}

export function getCurrentUser() {
    return currentUser;
}

export function isLoggedIn() {
    return currentUser !== null;
}

// Admin rights are decided by the database (explorer_is_admin: app_metadata role or
// explorer_editors). user_metadata is editable by the user, so it never grants anything.
let adminFor = null;
let adminValue = false;

export function isAdmin() {
    return Boolean(currentUser) && adminFor === currentUser.id && adminValue;
}

async function refreshAdmin() {
    const user = currentUser;
    if (!user) { adminFor = null; adminValue = false; return; }
    let allowed = false;
    try {
        const { data, error } = await supabase.rpc('explorer_is_admin');
        allowed = !error && data === true;
    } catch { allowed = false; }
    if (currentUser?.id !== user.id) return;
    adminFor = user.id;
    adminValue = allowed;
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
            emailRedirectTo: `${location.origin}/`,
        },
    });
    if (error) throw error;
    return data.user;
}

/** Sends the branded reset-password email; the link returns to this site. */
export async function requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/` });
    if (error) throw error;
}

export async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
}

export async function resendConfirmation(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}/` } });
    if (error) throw error;
}

/** Confirms the signed-in user's current password before a sensitive change. */
export async function verifyCurrentPassword(password) {
    const email = currentUser?.email;
    if (!email) throw new Error('Sin sesión');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
}

export async function updateDisplayName(fullName) {
    const { data, error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    if (error) throw error;
    currentUser = data.user ?? currentUser;
    authListeners.forEach(cb => cb(currentUser));
    return currentUser;
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
