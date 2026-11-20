// [TRACE: LLM_INTEGRATION.md]
// Admin AI panel. The page and this file are gated by middleware.js; every request
// is re-checked by api/admin. Model IDs come from the server catalog and are
// re-validated there, so changing this file cannot unlock a paid model.
// All conversation text is rendered with textContent, never innerHTML.
document.addEventListener('DOMContentLoaded', () => {
    const P = window.ProfileUI;
    const box = document.getElementById('adm-ai');
    if (!P || !box) {
        return;
    }

    const modelSelect = document.getElementById('adm-ai-model');
    const refreshBtn = document.getElementById('adm-ai-refresh');
    const modelNote = document.getElementById('adm-ai-model-note');
    const quotaNode = document.getElementById('adm-ai-quota');
    const log = document.getElementById('adm-ai-log');
    const input = document.getElementById('adm-ai-input');
    const countNode = document.getElementById('adm-ai-count');
    const clearBtn = document.getElementById('adm-ai-clear');
    const sendBtn = document.getElementById('adm-ai-send');
    const statusNode = document.getElementById('adm-ai-status');

    const state = {
        models: new Map(),
        allowNonZdr: false,
        configured: false,
        ready: false,
        sending: false,
        loaded: false,
        history: [],
        approvedNonZdr: null,
        limits: { perHour: 10, perDay: 30, hourRemaining: null, dayRemaining: null }
    };

    const status = (text, type = 'info') => P.status(statusNode, text, type);
    const clearStatus = () => {
        statusNode.hidden = true;
        statusNode.textContent = '';
    };

    const formatContext = (size) => {
        const n = Number(size) || 0;
        return n >= 1000000 ? `${(n / 1000000).toFixed(1)}M context` : `${Math.round(n / 1000)}k context`;
    };

    const emptyLog = () => {
        const empty = P.el('p', 'pf-muted adm-ai-empty', 'No questions yet. Choose a model, type a question, and press Send.');
        log.replaceChildren(empty);
    };

    const renderQuota = () => {
        const { hourRemaining, dayRemaining, perHour, perDay } = state.limits;
        if (hourRemaining === null || dayRemaining === null) {
            quotaNode.hidden = true;
            return;
        }
        quotaNode.hidden = false;
        quotaNode.textContent = `Questions remaining: ${hourRemaining} this hour (limit ${perHour}) · ${dayRemaining} today, site-wide (limit ${perDay}).`;
    };

    const renderModelNote = () => {
        const model = state.models.get(modelSelect.value);
        if (!model) {
            modelNote.hidden = true;
            return;
        }
        modelNote.hidden = false;
        if (model.strict) {
            const providers = model.providers.length ? model.providers.join(', ') : 'verified ZDR endpoint';
            modelNote.textContent = `Zero data retention: ${providers}. Model charge: $0. Free capacity is limited and models can disappear.`;
        } else {
            modelNote.textContent = 'This model is not verified for zero data retention. Its provider may retain or use prompts. Model charge: $0.';
        }
    };

    const updateCount = () => {
        countNode.textContent = `${input.value.length} / 2000`;
    };

    const setBusy = (busy) => {
        modelSelect.disabled = busy || !state.ready;
        input.disabled = busy || !state.ready;
        sendBtn.disabled = busy || !state.ready;
        refreshBtn.disabled = busy;
        clearBtn.disabled = busy || !state.history.length;
        sendBtn.textContent = busy ? 'Thinking…' : 'Send';
        log.setAttribute('aria-busy', busy ? 'true' : 'false');
    };

    const appendMessage = (role, text, sources) => {
        const empty = log.querySelector('.adm-ai-empty');
        if (empty) {
            empty.remove();
        }
        const row = P.el('div', `adm-ai-msg adm-ai-msg--${role}`);
        row.append(P.el('span', 'adm-ai-who', role === 'user' ? 'You' : 'Assistant'));
        row.append(P.el('p', 'adm-ai-text', text));
        if (role === 'assistant') {
            row.append(
                P.el(
                    'p',
                    'adm-ai-source',
                    sources && sources.length ? `Sources: ${sources.join(' · ')}` : 'No matching site source was found.'
                )
            );
        }
        log.append(row);
        log.scrollTop = log.scrollHeight;
        return row;
    };

    const addGroup = (label, models, disabled) => {
        if (!models.length) {
            return;
        }
        const group = document.createElement('optgroup');
        group.label = label;
        group.disabled = disabled;
        models.forEach((model) => {
            const suffix = model.strict
                ? `${formatContext(model.contextLength)} · $0 · ${model.providers.join(', ') || 'ZDR'}`
                : `${formatContext(model.contextLength)} · $0 · may retain/use prompts`;
            group.append(new Option(`${model.name} — ${suffix}`, model.id));
        });
        modelSelect.append(group);
    };

    const fillModels = (data) => {
        state.models = new Map((data.catalog.models || []).map((model) => [model.id, model]));
        state.allowNonZdr = Boolean(data.allowNonZdr);
        state.configured = Boolean(data.configured);
        state.limits = { ...state.limits, ...(data.limits || {}) };

        const previous = modelSelect.value;
        modelSelect.replaceChildren();
        const strict = [...state.models.values()].filter((model) => model.strict);
        const other = [...state.models.values()].filter((model) => !model.strict);
        addGroup('Zero data retention (recommended)', strict, false);
        addGroup(
            state.allowNonZdr ? 'Other free models (may retain prompts)' : 'Other free models (disabled by the server)',
            other,
            !state.allowNonZdr
        );

        const previousModel = state.models.get(previous);
        if (previousModel && (previousModel.strict || state.allowNonZdr)) {
            modelSelect.value = previous;
        } else if (strict.length) {
            modelSelect.value = strict[0].id;
        } else if (state.allowNonZdr && other.length) {
            modelSelect.value = other[0].id;
        }

        state.ready = state.configured && (strict.length > 0 || (state.allowNonZdr && other.length > 0));
        if (!state.models.size) {
            modelSelect.append(new Option('No free text models available', ''));
            status('No free text models are available right now. Use Refresh models to try again.', 'error');
        } else if (!state.configured) {
            status('The AI assistant is not configured on the server. Ask the site owner to set OPENROUTER_API_KEY.', 'error');
        } else if (!state.ready) {
            status('No zero-retention free model is available right now. Use Refresh models to try again.', 'error');
        } else {
            clearStatus();
        }
        renderModelNote();
        renderQuota();
        updateCount();
        setBusy(false);
    };

    const loadModels = async (force) => {
        modelSelect.disabled = true;
        refreshBtn.disabled = true;
        sendBtn.disabled = true;
        status(force ? 'Refreshing free models…' : 'Loading free models…');
        try {
            const data = await P.api(`/api/admin?ai=1${force ? '&refresh=1' : ''}`);
            if (!data.catalog || !data.catalog.ok) {
                state.ready = false;
                modelSelect.replaceChildren(new Option('Free model catalog unavailable', ''));
                status((data.catalog && data.catalog.error) || 'The free model catalog is unavailable right now.', 'error');
                renderModelNote();
                renderQuota();
                setBusy(false);
                return;
            }
            fillModels(data);
            if (state.ready && force) {
                status('Free model list refreshed.', 'info');
            }
        } catch (err) {
            console.error('AI model list failed', err);
            state.ready = false;
            modelSelect.replaceChildren(new Option('Free model catalog unavailable', ''));
            status(err.message, 'error');
            renderModelNote();
            setBusy(false);
        }
    };

    const send = async () => {
        if (state.sending) {
            return;
        }
        if (!state.ready) {
            status('The AI assistant is not ready. Refresh the free models first.', 'error');
            return;
        }
        const question = input.value.trim();
        if (!question) {
            status('Type a question first.', 'error');
            input.focus();
            return;
        }
        if (question.length > 2000) {
            status('Questions must be 2,000 characters or fewer.', 'error');
            return;
        }
        const model = state.models.get(modelSelect.value);
        if (!model) {
            status('Choose a free model first.', 'error');
            return;
        }
        if (!model.strict) {
            if (!state.allowNonZdr) {
                status('That model is disabled by the server because its provider may retain prompts.', 'error');
                return;
            }
            if (state.approvedNonZdr !== model.id) {
                const ok = window.confirm(
                    `${model.name} is not verified for zero data retention. Its provider may retain or use the prompt. Continue only with non-confidential questions.`
                );
                if (!ok) {
                    return;
                }
                state.approvedNonZdr = model.id;
            }
        }

        let outgoing = [...state.history, { role: 'user', content: question }];
        if (outgoing.length > 8) {
            outgoing = outgoing.slice(outgoing.length - 8);
        }

        state.sending = true;
        clearStatus();
        input.value = '';
        updateCount();
        setBusy(true);
        const bubble = appendMessage('user', question);
        try {
            const data = await P.api('/api/admin', {
                method: 'POST',
                body: {
                    action: 'ask',
                    model: model.id,
                    messages: outgoing,
                    acceptNonZdr: !model.strict
                }
            });
            appendMessage('assistant', data.answer, data.sources);
            state.history = [...outgoing, { role: 'assistant', content: data.answer }];
            if (state.history.length > 8) {
                state.history = state.history.slice(state.history.length - 8);
            }
            state.limits.hourRemaining = Math.max(0, (state.limits.hourRemaining || 0) - 1);
            state.limits.dayRemaining = Math.max(0, (state.limits.dayRemaining || 0) - 1);
            renderQuota();
        } catch (err) {
            console.error('AI question failed', err);
            bubble.remove();
            if (!log.children.length) {
                emptyLog();
            }
            input.value = question;
            updateCount();
            status(err.message, 'error');
        } finally {
            state.sending = false;
            setBusy(false);
            input.focus();
        }
    };

    const clearConversation = () => {
        if (state.sending) {
            return;
        }
        state.history = [];
        state.approvedNonZdr = null;
        input.value = '';
        updateCount();
        emptyLog();
        clearStatus();
        setBusy(false);
        input.focus();
    };

    input.addEventListener('input', updateCount);
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            send();
        }
    });
    modelSelect.addEventListener('change', renderModelNote);
    sendBtn.addEventListener('click', send);
    refreshBtn.addEventListener('click', () => loadModels(true));
    clearBtn.addEventListener('click', clearConversation);

    const ensureLoaded = () => {
        if (state.loaded) {
            return;
        }
        state.loaded = true;
        loadModels(false);
    };
    box.addEventListener('toggle', () => {
        if (box.open) {
            ensureLoaded();
        }
    });
    if (box.open) {
        ensureLoaded();
    }

    emptyLog();
    updateCount();
    setBusy(false);
});
