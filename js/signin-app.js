// [TRACE: ACCOUNTS.md]
// Sign in, create account, and change password. All text goes in with textContent.
document.addEventListener('DOMContentLoaded', async () => {
    const $ = (selector) => document.querySelector(selector);

    const status = (node, text, isError = false) => {
        node.textContent = text;
        node.hidden = !text;
        node.classList.toggle('is-error', isError);
        // Errors interrupt a screen reader; progress and success do not.
        node.setAttribute('role', isError ? 'alert' : 'status');
    };

    // Swap a submit button's label while a request is running.
    const busy = (button, label) => {
        const idle = button.textContent;
        button.disabled = true;
        button.textContent = label;
        button.setAttribute('aria-busy', 'true');
        return () => {
            button.disabled = false;
            button.textContent = idle;
            button.removeAttribute('aria-busy');
        };
    };

    document.querySelectorAll('[data-password-toggle]').forEach((toggle) => {
        const input = document.getElementById(toggle.getAttribute('aria-controls'));
        toggle.addEventListener('click', () => {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            toggle.textContent = show ? 'Hide' : 'Show';
            toggle.setAttribute('aria-pressed', String(show));
        });
    });

    // Only same-folder .html pages are allowed as a return target (no open redirects).
    const requested = new URLSearchParams(location.search).get('next');
    const safeNext =
        requested && /^[a-z0-9-]+\.html$/i.test(requested) && !['signin.html', 'index.html'].includes(requested)
            ? requested
            : 'home.html';

    const NEXT_LABELS = {
        'forum.html': 'the Community Forum',
        'members.html': 'the Member Directory',
        'profile.html': 'member profiles',
        'profile-edit.html': 'your profile'
    };
    if (NEXT_LABELS[requested]) {
        const note = $('#account-next');
        note.textContent = `Sign in or create an account to continue to ${NEXT_LABELS[requested]}.`;
        note.hidden = false;
    }

    await Auth.whenReady();

    const wantsPassword = location.hash === '#password';
    if (Auth.isSignedIn()) {
        if (!wantsPassword) {
            location.replace(safeNext);
            return;
        }
        // Signed-in members who came here to change a password see only that form.
        $('#account-columns').hidden = true;
        $('#account-title').textContent = 'Your account';
        $('#account-lead').textContent = `Signed in as ${Auth.account().username}.`;
        $('#password').hidden = false;
        $('#password input').focus();
    }

    const signup = $('#signup-form');
    const info = await Auth.registrationInfo();
    const signupNote = $('#signup-note');
    if (!Auth.accountsAvailable()) {
        signupNote.textContent =
            'Accounts are not available in this static preview. Use the live site or npm run vercel:dev.';
        signup.querySelector('button[type="submit"]').disabled = true;
    } else if (info && !info.open) {
        signupNote.textContent = 'New accounts are closed right now. Ask a steward.';
        signup.querySelector('button[type="submit"]').disabled = true;
    } else {
        signupNote.hidden = true;
        $('#signup-code-wrap').hidden = !info?.codeRequired;
    }

    $('#signin-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const done = busy(event.currentTarget.querySelector('button[type="submit"]'), 'Signing in…');
        status($('#signin-status'), '');
        const result = await Auth.login(form.get('username'), form.get('password'));
        if (result.ok) {
            status($('#signin-status'), 'Signed in. One moment…');
            location.assign(safeNext);
            return;
        }
        status($('#signin-status'), result.error, true);
        done();
    });

    signup.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const done = busy(event.currentTarget.querySelector('button[type="submit"]'), 'Creating account…');
        status($('#signup-status'), '');
        const result = await Auth.register(Object.fromEntries(form));
        if (result.ok) {
            status($('#signup-status'), 'Account created. One moment…');
            location.assign(safeNext === 'home.html' ? 'profile-edit.html' : safeNext);
            return;
        }
        status($('#signup-status'), result.error, true);
        done();
    });

    $('#password-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const statusNode = $('#password-status');
        if (!Auth.isSignedIn()) {
            status(statusNode, 'Sign in before changing your password.', true);
            return;
        }
        const form = new FormData(event.currentTarget);
        const done = busy(event.currentTarget.querySelector('button[type="submit"]'), 'Updating…');
        status(statusNode, '');
        try {
            const res = await fetch('/api/auth/password', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(Object.fromEntries(form))
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Could not change your password.');
            }
            status(statusNode, 'Password updated. Sending you to sign in again…');
            setTimeout(() => Auth.logout(), 1500);
        } catch (err) {
            console.error('Password change failed', err);
            status(statusNode, err.message, true);
            done();
        }
    });
});
