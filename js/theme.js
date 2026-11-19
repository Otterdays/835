// [TRACE: ARCHITECTURE.md]
// Light / dark appearance for the whole portal. Loaded in <head> (before the page paints) so the
// right colors are in place immediately. The choice is "dark" (the default), "light" or
// "auto" (follow the device), and is remembered on this device only. The toggle itself is built by js/shell.js.
(() => {
    const KEY = 'oe835_theme';
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const read = () => {
        try {
            const value = window.localStorage.getItem(KEY);
            return value === 'light' || value === 'auto' ? value : 'dark';
        } catch (err) {
            console.error('Theme preference unavailable', err);
            return 'dark';
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
            window.localStorage.setItem(KEY, pref === 'light' || pref === 'auto' ? pref : 'dark');
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
