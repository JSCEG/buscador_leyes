import { describe, expect, it } from 'vitest';
import { authError } from '../src/lib/auth-errors.js';

describe('authError', () => {
    it('translates the common Supabase Auth errors to Spanish', () => {
        expect(authError({ code: 'email_not_confirmed', message: 'Email not confirmed' })).toEqual({ text: expect.stringContaining('aún no está confirmado'), notConfirmed: true });
        expect(authError({ message: 'Invalid login credentials' }).text).toMatch(/Correo o contraseña incorrectos/);
        expect(authError({ message: 'User already registered' }).text).toMatch(/ya tiene una cuenta/);
        expect(authError({ code: 'weak_password', message: 'Password should be at least 6 characters.' }).text).toMatch(/muy débil/);
        expect(authError({ message: 'Unable to validate email address: invalid format' }).text).toMatch(/formato válido/);
        expect(authError(new TypeError('Failed to fetch')).text).toMatch(/Sin conexión/);
    });

    it('keeps the wait time from rate-limit messages', () => {
        expect(authError({ message: 'For security purposes, you can only request this after 42 seconds.' }).text).toBe('Por seguridad, espera 42 segundos antes de intentarlo de nuevo.');
        expect(authError({ code: 'over_email_send_rate_limit', message: 'email rate limit exceeded' }).text).toMatch(/Espera un minuto/);
    });

    it('never shows English for unknown errors', () => {
        expect(authError({ message: 'Something unexpected happened' })).toEqual({ text: 'Algo salió mal. Intenta de nuevo en un momento.', notConfirmed: false });
        expect(authError(undefined).notConfirmed).toBe(false);
    });
});
