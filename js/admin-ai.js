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
        freeModelDailyRequests: null
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

    const updateFreeModelDailyRequests = (value) => {
        if (value && ['limit', 'used', 'remaining'].every((key) => Number.isSafeInteger(value[key]) && value[key] >= 0)) {
            state.freeModelDailyRequests = value;
        }
        renderQuota();
    };

    const renderQuota = () => {
        quotaNode.hidden = false;
        const daily = state.freeModelDailyRequests;
        quotaNode.textContent = daily
            ? `OpenRouter free-model daily usage for this key: ${daily.used} used · ${daily.remaining} remaining of ${daily.limit}. Per-minute and provider limits may also apply.`
            : 'OpenRouter free-model limits apply. The current key’s daily request counter is unavailable.';
    };

    const rateLimitMessage = (error) => {
        const rate = error && error.rateLimit;
        if (!rate || !rate.source) return error.message;
        const reset = rate.resetAt ? new Date(rate.resetAt).toLocaleString() : null;
        const secs = rate.retryAfterSeconds;
        const retry = Number.isSafeInteger(secs) ? ` Try again in about ${secs} second${secs === 1 ? '' : 's'}.` : '';
        switch (rate.source) {
            case 'openrouter_free_tier_per_minute':
                return `OpenRouter's shared free-model per-minute limit was reached${rate.remaining !== undefined ? ` (${rate.remaining} requests remaining)` : ''}.${reset ? ` Resets around ${reset}.` : ''}${retry}`;
            case 'openrouter_free_tier_daily':
                return `OpenRouter's free-model daily limit was reached.${reset ? ` Resets around ${reset}.` : ' It typically resets at midnight UTC.'}${retry}`;
            case 'upstream_provider_shared_pool':
                return `The selected model provider${rate.provider ? ` (${rate.provider})` : ''} has no shared capacity right now. This is a provider availability limit; the assistant already tried backup models; try again in a minute.${retry}`;
            case 'openrouter_in_flight_budget':
                return `OpenRouter's in-flight request budget is full.${retry || ' Wait for an active request to finish, then try again.'}`;
            case 'openrouter_key_limit':
                return `The OpenRouter API key reached its configured request limit. Check the key's limits in OpenRouter.${retry}`;
            case 'openrouter_credits':
                return `OpenRouter reports a key or account credit restriction. Check the key/account settings; the assistant will not switch to a paid model.${retry}`;
            default:
                return error.message;
        }
    };

    const hasOther = () => state.allowNonZdr && [...state.models.values()].some((entry) => !entry.strict);

    const renderModelNote = () => {
        if (modelSelect.value === 'auto') {
            modelNote.hidden = false;
            modelNote.textContent = hasOther()
                ? 'Auto picks the healthiest free model from live uptime and this site’s recent results, zero-retention models first, and switches if one is busy. You’ll be asked once whether it may also use models that may retain prompts. Model charge: $0.'
                : 'Auto picks the healthiest zero-retention free model and switches if one is busy. Model charge: $0.';
            return;
        }
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

    const safeSiteHref = (href) => {
        if (typeof href !== 'string' || !href || href.startsWith('//') || href.length > 300) {
            return null;
        }
        try {
            const url = new URL(href, window.location.href);
            if (url.origin !== window.location.origin || !/^\/(?:[a-z0-9-]+\.html|contract\.html)$/.test(url.pathname)) {
                return null;
            }
            if (url.pathname.endsWith('/contract.html') && !/^\?article=[a-z0-9-]+$/.test(url.search)) {
                return null;
            }
            if (!url.pathname.endsWith('/contract.html') && url.search) {
                return null;
            }
            return `${url.pathname}${url.search}`;
        } catch (_) {
            return null;
        }
    };

    const makeSiteLink = (label, href) => {
        const safeHref = safeSiteHref(href);
        if (!safeHref) {
            return document.createTextNode(label);
        }
        const link = document.createElement('a');
        link.className = 'adm-ai-link';
        link.href = safeHref;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = label;
        return link;
    };

    const linkifyArticleCitations = (node, text, articleLinks) => {
        const variants = new Map();
        (Array.isArray(articleLinks) ? articleLinks : []).forEach((entry) => {
            if (!entry || typeof entry.citation !== 'string') {
                return;
            }
            variants.set(entry.citation, entry.href);
            variants.set(entry.citation.replace(/^CBA\s+/i, ''), entry.href);
        });
        const phrases = [...variants.keys()].filter(Boolean).sort((a, b) => b.length - a.length);
        if (!phrases.length) {
            node.textContent = text;
            return;
        }
        const pattern = new RegExp(`(?<![A-Za-z0-9])(?:${phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![A-Za-z0-9])`, 'gi');
        let lastIndex = 0;
        let match;
        while ((match = pattern.exec(text))) {
            node.append(document.createTextNode(text.slice(lastIndex, match.index)));
            const href = variants.get(match[0]) || variants.get(phrases.find((phrase) => phrase.toLowerCase() === match[0].toLowerCase()));
            node.append(makeSiteLink(match[0], href));
            lastIndex = match.index + match[0].length;
        }
        node.append(document.createTextNode(text.slice(lastIndex)));
    };

    const appendMessage = (role, text, sources, sourceLinks, articleLinks, meta) => {
        const empty = log.querySelector('.adm-ai-empty');
        if (empty) {
            empty.remove();
        }
        const row = P.el('div', `adm-ai-msg adm-ai-msg--${role}`);
        row.append(P.el('span', 'adm-ai-who', role === 'user' ? 'You' : 'Assistant'));
        const answer = P.el('p', 'adm-ai-text');
        if (role === 'assistant') {
            linkifyArticleCitations(answer, text, articleLinks);
        } else {
            answer.textContent = text;
        }
        row.append(answer);
        if (role === 'assistant') {
            const source = P.el('p', 'adm-ai-source');
            if (sources && sources.length) {
                source.append(document.createTextNode('Sources: '));
                const hrefByCitation = new Map((sourceLinks || []).map((entry) => [entry.citation, entry.href]));
                sources.forEach((citation, index) => {
                    if (index) {
                        source.append(document.createTextNode(' · '));
                    }
                    source.append(makeSiteLink(citation, hrefByCitation.get(citation)));
                });
            } else {
                source.textContent = 'No matching site source was found.';
            }
            row.append(source);
            if (meta && meta.answeredBy && meta.answeredBy.name && (meta.fellBack || meta.auto)) {
                const why = meta.fellBack ? (meta.auto ? ' (the first pick was busy)' : ' because the selected model was busy or returned nothing') : '';
                row.append(P.el('p', 'adm-ai-source', `${meta.fellBack && !meta.auto ? 'Answered by backup model' : 'Answered by'} ${meta.answeredBy.name}${why}.`));
            }
        }
        log.append(row);
        log.scrollTop = log.scrollHeight;
        return row;
    };

    // Short health hint from live uptime and this site's own recent results.
    const healthLabel = (model) => {
        if (model.coolingDown || (model.recentFailed > 0 && !model.recentOk)) return ' · busy recently';
        if (model.recentOk > 0) return ' · worked recently';
        if (Number.isFinite(model.uptime30m) && model.uptime30m < 90) return ` · ${Math.round(model.uptime30m)}% up`;
        return '';
    };
    const byRank = (a, b) => (a.rank || 999) - (b.rank || 999);

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
            group.append(new Option(`${model.name} — ${suffix}${healthLabel(model)}`, model.id));
        });
        modelSelect.append(group);
    };

    const fillModels = (data) => {
        updateFreeModelDailyRequests(data.freeModelDailyRequests);
        state.models = new Map((data.catalog.models || []).map((model) => [model.id, model]));
        state.allowNonZdr = Boolean(data.allowNonZdr);
        state.configured = Boolean(data.configured);

        const previous = modelSelect.value;
        modelSelect.replaceChildren();
        const strict = [...state.models.values()].filter((model) => model.strict).sort(byRank);
        const other = [...state.models.values()].filter((model) => !model.strict).sort(byRank);
        if (state.models.size) {
            modelSelect.append(new Option('Auto — healthiest free model right now (recommended)', 'auto'));
        }
        addGroup('Zero data retention (recommended)', strict, false);
        addGroup(
            state.allowNonZdr ? 'Other free models (may retain prompts)' : 'Other free models (disabled by the server)',
            other,
            !state.allowNonZdr
        );

        const previousModel = state.models.get(previous);
        if (previousModel && (previousModel.strict || state.allowNonZdr)) {
            modelSelect.value = previous;
        } else if (state.models.size) {
            modelSelect.value = 'auto';
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

    // quiet: background refresh of health labels after an answer; never touches status or busy state.
    const loadModels = async (force, quiet) => {
        if (quiet) {
            try {
                const data = await P.api('/api/admin?ai=1');
                if (data.catalog && data.catalog.ok && !state.sending) {
                    const keepText = statusNode.hidden ? '' : statusNode.textContent;
                    const keepClass = statusNode.className;
                    fillModels(data);
                    if (keepText) {
                        statusNode.textContent = keepText;
                        statusNode.className = keepClass;
                        statusNode.hidden = false;
                    }
                }
            } catch (err) {
                console.error('AI model health refresh failed', err);
            }
            return;
        }
        modelSelect.disabled = true;
        refreshBtn.disabled = true;
        sendBtn.disabled = true;
        status(force ? 'Refreshing free models…' : 'Loading free models…');
        try {
            const data = await P.api(`/api/admin?ai=1${force ? '&refresh=1' : ''}`);
            updateFreeModelDailyRequests(data.freeModelDailyRequests);
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
        const auto = modelSelect.value === 'auto';
        const model = auto ? { id: 'auto', name: 'Auto', strict: !hasOther() } : state.models.get(modelSelect.value);
        if (auto && !model.strict && state.approvedNonZdr !== 'auto' && state.autoStrictOnly !== true) {
            const widen = window.confirm(
                'Auto uses zero-retention models first. If they are all busy, may it also use free models whose providers may retain or use prompts?\n\nOK = allow them (non-confidential questions only)\nCancel = zero-retention models only'
            );
            if (widen) {
                state.approvedNonZdr = 'auto';
            } else {
                state.autoStrictOnly = true;
            }
        }
        if (auto) {
            model.strict = state.approvedNonZdr !== 'auto';
            if (model.strict && ![...state.models.values()].some((entry) => entry.strict)) {
                status('No zero-retention free model is available. Choose Auto again and allow other free models, or pick a model.', 'error');
                state.autoStrictOnly = false;
                return;
            }
        }
        if (!model) {
            status('Choose a free model first.', 'error');
            return;
        }
        if (!auto && !model.strict) {
            if (!state.allowNonZdr) {
                status('That model is disabled by the server because its provider may retain prompts.', 'error');
                return;
            }
            if (state.approvedNonZdr !== model.id) {
                const ok = window.confirm(
                    `${model.name} is not verified for zero data retention. Its provider may retain or use the prompt. If it is busy, the assistant may retry on other free models, which may also retain prompts. Continue only with non-confidential questions.`
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
        const pending = appendMessage('assistant', 'Checking the site sources and asking the model (free models can take up to a minute; busy ones are retried automatically)…');
        pending.classList.add('adm-ai-msg--pending');
        pending.setAttribute('role', 'status');
        pending.setAttribute('aria-live', 'polite');
        const spinner = document.createElement('span');
        spinner.className = 'adm-ai-spinner';
        spinner.setAttribute('aria-hidden', 'true');
        pending.querySelector('.adm-ai-who').prepend(spinner);
        try {
            const data = await P.api('/api/admin', {
                method: 'POST',
                body: {
                    action: 'ask',
                    model: model.id,
                    messages: outgoing,
                    acceptNonZdr: auto ? state.approvedNonZdr === 'auto' : !model.strict
                }
            });
            updateFreeModelDailyRequests(data.freeModelDailyRequests);
            pending.remove();
            appendMessage('assistant', data.answer, data.sources, data.sourceLinks, data.articleLinks, { fellBack: data.fellBack, auto: data.auto, answeredBy: data.answeredBy });
            if (data.fellBack || data.auto) {
                loadModels(false, true);
            }
            state.history = [...outgoing, { role: 'assistant', content: data.answer }];
            if (state.history.length > 8) {
                state.history = state.history.slice(state.history.length - 8);
            }
            renderQuota();
        } catch (err) {
            console.error('AI question failed', err);
            updateFreeModelDailyRequests(err.freeModelDailyRequests);
            pending.remove();
            bubble.remove();
            if (!log.children.length) {
                emptyLog();
            }
            input.value = question;
            updateCount();
            status(rateLimitMessage(err), 'error');
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
        state.autoStrictOnly = false;
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
