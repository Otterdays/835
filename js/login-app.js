// [TRACE: ARCHITECTURE.md]
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const submitBtn = document.getElementById('login-submit');

    if (!form) {
        return;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Entering…</span> <span class="enter-arrow" aria-hidden="true">&rarr;</span>';
        }

        if (window.Auth && typeof window.Auth.grantAccess === 'function') {
            window.Auth.grantAccess();
        }

        const target = (window.Auth && window.Auth.HOME) ? window.Auth.HOME : 'home.html';
        window.location.href = target;
    });

    submitBtn?.focus();
});
