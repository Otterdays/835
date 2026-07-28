// [TRACE: ARCHITECTURE.md]
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const userInput = document.getElementById('login-username');
    const passInput = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');

    if (!form || !window.Auth) {
        return;
    }

    const showError = (message) => {
        if (!errorEl) {
            return;
        }
        errorEl.textContent = message;
        errorEl.hidden = !message;
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        showError('');

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in…';
        }

        try {
            const result = await Auth.login(userInput?.value, passInput?.value);
            if (!result.ok) {
                showError(result.error || 'Sign-in failed.');
                passInput?.focus();
                passInput?.select();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign in';
                }
                return;
            }
            window.location.href = Auth.HOME;
        } catch (err) {
            console.error('Login submit failed', err);
            showError('Sign-in failed. Try again.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign in';
            }
        }
    });

    userInput?.focus();
});
