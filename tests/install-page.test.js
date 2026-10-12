import { describe, it, expect } from 'vitest';
import { isInstallPath, installMode, chromeIntent } from '../src/lib/install-page.js';

const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const WEBVIEW_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S911B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36';
const WHATSAPP_ANDROID = `${CHROME_ANDROID} WhatsApp/2.24.1`;
const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const FB_IPHONE = `${SAFARI_IPHONE} [FBAN/FBIOS;FBAV/480.0]`;
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

describe('install page', () => {
    it('answers on /instalar only', () => {
        expect(isInstallPath('/instalar')).toBe(true);
        expect(isInstallPath('/instalar/')).toBe(true);
        expect(isInstallPath('/Instalar')).toBe(true);
        expect(isInstallPath('/')).toBe(false);
        expect(isInstallPath('/instalarlo')).toBe(false);
    });
    it('tells apart Chrome, app browsers, iPhone and the installed app', () => {
        expect(installMode(CHROME_ANDROID)).toBe('android');
        expect(installMode(WEBVIEW_ANDROID)).toBe('android-inapp');
        expect(installMode(WHATSAPP_ANDROID)).toBe('android-inapp');
        expect(installMode(SAFARI_IPHONE)).toBe('ios');
        expect(installMode(FB_IPHONE)).toBe('ios-inapp');
        expect(installMode(DESKTOP)).toBe('desktop');
        expect(installMode('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', { platform: 'MacIntel', maxTouchPoints: 5 })).toBe('ios');
        expect(installMode(CHROME_ANDROID, { standalone: true })).toBe('installed');
    });
    it('builds the link that reopens the page in Chrome', () => {
        expect(chromeIntent('https://buscador-juridico.com/instalar')).toBe('intent://buscador-juridico.com/instalar#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fbuscador-juridico.com%2Finstalar;end');
    });
});
