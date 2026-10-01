/**
 * What an auth email link brought the reader back for (password reset, sign-up confirmation,
 * email change) or the error it carries. Read once, as early as possible: the Supabase client
 * consumes and clears these URL parameters on load, and fires its events before the app listens.
 * main.js imports this module first for that reason.
 */
function read() {
    if (typeof location === 'undefined') return { type: null, error: null };
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(location.search);
    const pick = key => hash.get(key) || query.get(key);
    return {
        type: pick('type'),                                   // recovery | signup | email_change | magiclink | invite
        error: pick('error_description') || pick('error'),
        errorCode: pick('error_code'),
    };
}

export const authReturn = read();
