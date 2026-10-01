/**
 * Supabase Auth answers in English; readers get Spanish. Matches the error code when present and
 * falls back to the message text (older endpoints only send text).
 */
const RULES = [
    { test: /email_not_confirmed|email not confirmed/i, text: 'Tu correo aún no está confirmado. Abre el correo «Confirma tu cuenta del Buscador Jurídico» (revisa también Spam) y toca el botón.', notConfirmed: true },
    { test: /invalid_credentials|invalid login credentials/i, text: 'Correo o contraseña incorrectos. Revisa los datos o usa «¿Olvidaste tu contraseña?».' },
    { test: /user_already_exists|already registered|already been registered/i, text: 'Ese correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.' },
    { test: /weak_password|password should be|password is too weak|at least \d+ characters/i, text: 'La contraseña es muy débil. Usa al menos 8 caracteres, combinando letras y números.' },
    { test: /same_password|should be different/i, text: 'Usa una contraseña distinta a la anterior.' },
    { test: /over_email_send_rate_limit|email rate limit|rate limit|too many requests|only request this after/i, text: rateText },
    { test: /email_address_invalid|invalid format|unable to validate email/i, text: 'El correo no tiene un formato válido.' },
    { test: /signup_disabled|signups not allowed/i, text: 'Por ahora no se pueden crear cuentas nuevas.' },
    { test: /error sending|sending confirmation|sending recovery|smtp/i, text: 'No pudimos enviar el correo. Intenta de nuevo en unos minutos.' },
    { test: /otp_expired|token has expired|expired/i, text: 'El enlace o código venció. Pide uno nuevo.' },
    { test: /user_not_found|user not found/i, text: 'No encontramos una cuenta con ese correo.' },
    { test: /failed to fetch|network|load failed/i, text: 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.' },
];

function rateText(source) {
    const seconds = /after (\d+) seconds?/i.exec(source)?.[1];
    return seconds ? `Por seguridad, espera ${seconds} segundos antes de intentarlo de nuevo.` : 'Demasiados intentos seguidos. Espera un minuto e intenta de nuevo.';
}

/** Returns { text, notConfirmed } in Spanish for any auth error. */
export function authError(error) {
    const source = `${error?.code || ''} ${error?.message || error || ''}`;
    for (const rule of RULES) {
        if (rule.test.test(source)) return { text: typeof rule.text === 'function' ? rule.text(source) : rule.text, notConfirmed: Boolean(rule.notConfirmed) };
    }
    return { text: 'Algo salió mal. Intenta de nuevo en un momento.', notConfirmed: false };
}
