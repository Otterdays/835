// [TRACE: ARCHITECTURE.md]
// Light / dark appearance for the whole portal. Loaded in <head> (before the page paints) so the
// right colors are in place immediately. The choice is "auto" (follow the device), "light" or
// "dark", and is remembered on this device only. The toggle itself is built by js/shell.js.
(() => {
    const KEY = 'oe835_theme';
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const read = () => {
        try {
            const value = window.localStorage.getItem(KEY);
            return value === 'light' || value === 'dark' ? value : 'auto';
        } catch (err) {
            console.error('Theme preference unavailable', err);
            return 'auto';
        }
    };

    const apply = () => {
        const pref = read();
        const dark = pref === 'dark' || (pref === 'auto' && media.matches);
        const root = document.documentElement;
        root.dataset.theme = dark ? 'dark' : 'light';
        root.dataset.themePref = pref;
        document.dispatchEvent(new CustomEvent('sitetheme:change', { detail: { pref, dark } }));
    };

    const set = (pref) => {
        try {
            if (pref === 'light' || pref === 'dark') {
                window.localStorage.setItem(KEY, pref);
            } else {
                window.localStorage.removeItem(KEY);
            }
        } catch (err) {
            console.error('Theme preference could not be saved', err);
        }
        apply();
    };

    media.addEventListener('change', apply);
    // Another tab changed the setting.
    window.addEventListener('storage', (event) => {
        if (event.key === KEY) {
            apply();
        }
    });

    apply();
    window.SiteTheme = { get: read, set };
})();
