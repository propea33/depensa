// ═══════════════════════════════════════════════════════
//  UI RENDERING
// ═══════════════════════════════════════════════════════

function getSelectedExpenses() {
    if (selectedMonth === liveMonthKey()) return expenses;
    // Hardcoded HISTORY (pre-rollover months)
    const histIdx = MONTH_MAP[selectedMonth];
    if (histIdx !== undefined) return HISTORY[histIdx].expenses;
    // Extra months archived in localStorage by rollover
    try {
        const extra = JSON.parse(localStorage.getItem('depensa_history_extra') || '[]');
        const found = extra.find(e => e.key === selectedMonth);
        if (found) return found.expenses;
    } catch (_) {}
    return expenses;
}

// Set by main.js after a successful add so we can auto-focus the new card.
let pendingScrollExpenseId = null;
const EXPENSE_VIEW_STORAGE_KEY = 'depensa_expense_view';
let expenseViewMode = localStorage.getItem(EXPENSE_VIEW_STORAGE_KEY) === 'list' ? 'list' : 'icons';
const EXPENSE_SORT_STORAGE_KEY = 'depensa_expense_sort';
const EXPENSE_SORT_LABELS = {
    categories: 'Par Catégories',
    amount_desc: 'Plus grandes',
    amount_asc: 'Plus petites',
};
let expenseSortMode = localStorage.getItem(EXPENSE_SORT_STORAGE_KEY) || 'categories';
if (!['categories', 'amount_desc', 'amount_asc'].includes(expenseSortMode)) expenseSortMode = 'categories';

function setExpenseViewMode(mode) {
    expenseViewMode = mode === 'list' ? 'list' : 'icons';
    localStorage.setItem(EXPENSE_VIEW_STORAGE_KEY, expenseViewMode);
    renderExpenses();
}

function setExpenseSortMode(mode) {
    expenseSortMode = ['categories', 'amount_desc', 'amount_asc'].includes(mode) ? mode : 'categories';
    localStorage.setItem(EXPENSE_SORT_STORAGE_KEY, expenseSortMode);
    renderExpenses();
}

function syncExpenseViewControls() {
    const iconsBtn = $('expenseViewIcons');
    const listBtn  = $('expenseViewList');
    if (!iconsBtn || !listBtn) return;
    iconsBtn.classList.toggle('active', expenseViewMode === 'icons');
    listBtn.classList.toggle('active', expenseViewMode === 'list');
}

function syncExpenseSortControls() {
    const sortBtnLabel = $('sortBtnLabel');
    if (sortBtnLabel) sortBtnLabel.textContent = EXPENSE_SORT_LABELS[expenseSortMode] || 'Par Catégories';
    document.querySelectorAll('#sortMenu .sort-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === expenseSortMode);
    });
}

const EXPENSE_GROUP_ORDER = [
    { key: 'maison',    label: 'Maison' },
    { key: 'streaming', label: 'Services Streaming' },
    { key: 'cell',      label: 'Cellulaire' },
    { key: 'bouffe',    label: 'Bouffe' },
    { key: 'transport', label: 'Transport & Auto' },
    { key: 'sante',     label: 'Santé & Bien-être' },
    { key: 'famille',   label: 'Famille & Éducation' },
    { key: 'loisirs',   label: 'Loisirs' },
    { key: 'autres',    label: 'Autres' },
];

const GROUP_BY_CAT = {
    habitation:  'maison',
    electricite: 'maison',
    internet:    'maison',

    streaming:   'streaming',
    cell:        'cell',

    epicerie:    'bouffe',
    restaurant:  'bouffe',
    cafe:        'bouffe',

    auto:        'transport',
    transport:   'transport',
    gaz:         'transport',

    pharmacie:   'sante',
    gym:         'sante',

    ecole:       'famille',
    garderie:    'famille',

    loisir:      'loisirs',
    spectacles:  'loisirs',
    voyage:      'loisirs',
    linge:       'loisirs',
};

const CAT_SORT_WEIGHT = {
    habitation: 1,
    electricite: 2,
    internet: 3,
    gaz: 4,
    streaming: 5,
    cell: 6,
    epicerie: 7,
    restaurant: 8,
    cafe: 9,
    auto: 10,
    transport: 11,
    pharmacie: 12,
    gym: 13,
    ecole: 14,
    garderie: 15,
    loisir: 16,
    spectacles: 17,
    voyage: 18,
    linge: 19,
};

function expenseGroupKey(catId) {
    return GROUP_BY_CAT[catId] || 'autres';
}

function groupExpensesForDisplay(list) {
    const grouped = new Map();
    EXPENSE_GROUP_ORDER.forEach(g => grouped.set(g.key, []));

    list.forEach(exp => grouped.get(expenseGroupKey(exp.cat)).push(exp));

    const out = [];
    EXPENSE_GROUP_ORDER.forEach(g => {
        const items = grouped.get(g.key);
        if (!items || items.length === 0) return;
        items.sort((a, b) => {
            const wa = CAT_SORT_WEIGHT[a.cat] || 999;
            const wb = CAT_SORT_WEIGHT[b.cat] || 999;
            if (wa !== wb) return wa - wb;
            return a.name.localeCompare(b.name, 'fr');
        });
        out.push({ label: g.label, items });
    });
    return out;
}

function renderExpenses() {
    const grid   = $('expenseList');
    grid.innerHTML = '';
    grid.classList.toggle('expense-grid-list', expenseViewMode === 'list');
    syncExpenseViewControls();
    syncExpenseSortControls();

    const isPast = selectedMonth !== liveMonthKey();
    const source = getSelectedExpenses();
    const filtered = showRecurringOnly ? source.filter(e => e.recurring) : source;

    // Count badge
    const countEl = $('expenseCount');
    if (countEl) countEl.textContent = `(${source.length})`;

    // Show/hide add button and recurring filter in past-month mode
    $('openModal').style.display       = isPast ? 'none' : '';
    $('recurringFilter').style.display = isPast ? 'none' : '';

    // Price hike detection (only for current Mars month)
    const hikes = (!isPast) ? detectPriceHikes() : [];
    const hikeMap = new Map(hikes.map(h => [h.id, h]));

    // Hike alert banner — show one undismissed hike at a time
    let hikeBanner = $('hikeBanner');
    if (!hikeBanner) {
        hikeBanner = document.createElement('div');
        hikeBanner.id = 'hikeBanner';
        grid.parentElement.insertBefore(hikeBanner, grid);
    }
    const pendingHikes = hikes.filter(h => !dismissedHikeIds.has(h.id));
    if (pendingHikes.length > 0) {
        const h = pendingHikes[0];
        const counter = pendingHikes.length > 1 ? `<span class="hike-counter">${pendingHikes.length} alertes</span>` : '';
        hikeBanner.innerHTML = `<div class="hike-alert-banner">
            <span class="hike-icon">⚠️</span>
            <div class="hike-text">Hausse détectée sur <strong>${h.name}</strong> (+${Math.round(h.pct * 100)}% vs mois dernier) — Vérifie ton contrat ou compare les offres.</div>
            ${counter}
            <button class="hike-dismiss-btn" data-hike-id="${h.id}">Ok</button>
        </div>`;
        hikeBanner.querySelector('.hike-dismiss-btn').addEventListener('click', () => {
            dismissedHikeIds.add(h.id);
            renderExpenses();
        });
    } else {
        hikeBanner.innerHTML = '';
    }

    // Savings congratulation banners (current month only)
    let savingsBanner = $('savingsBanner');
    if (!savingsBanner) {
        savingsBanner = document.createElement('div');
        savingsBanner.id = 'savingsBanner';
        grid.parentElement.insertBefore(savingsBanner, hikeBanner);
    }
    if (!isPast) {
        const pendingSavings = detectSavings().filter(s => !dismissedSavingsIds.has(s.id));
        savingsBanner.innerHTML = pendingSavings.map(s => `
            <div class="savings-alert-banner" data-savings-id="${s.id}">
                <span class="savings-icon">🎉</span>
                <div class="savings-text">${savingsMessage(s)}</div>
                <div class="savings-actions">
                    <button class="savings-share-btn" data-savings-id="${s.id}" title="Partager">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        Partager
                    </button>
                    <button class="savings-dismiss-btn" data-savings-id="${s.id}">✓ Merci!</button>
                </div>
            </div>`).join('');

        savingsBanner.querySelectorAll('.savings-dismiss-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                dismissedSavingsIds.add(Number(btn.dataset.savingsId));
                renderExpenses();
            });
        });

        savingsBanner.querySelectorAll('.savings-share-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const sid = Number(btn.dataset.savingsId);
                const s   = detectSavings().find(x => x.id === sid);
                if (!s) return;

                const shareText = buildShareText(s);
                const shareUrl  = window.location.origin + '/landing.html';

                // Native share on mobile
                if (navigator.share) {
                    navigator.share({ title: 'Depensa', text: shareText + ' → ' + shareUrl });
                    return;
                }

                // Toggle popover on desktop
                const existing = btn.parentElement.querySelector('.share-popover');
                if (existing) { existing.remove(); return; }

                const encText = encodeURIComponent(shareText + ' → ');
                const encUrl  = encodeURIComponent(shareUrl);
                const encMail = encodeURIComponent(shareText + '\n\n→ ' + shareUrl);
                const popover = document.createElement('div');
                popover.className = 'share-popover';
                popover.innerHTML = `
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${encText}" target="_blank" class="share-link share-fb" title="Facebook">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
                        Facebook
                    </a>
                    <a href="https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}" target="_blank" class="share-link share-x" title="X (Twitter)">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        X (Twitter)
                    </a>
                    <a href="mailto:?subject=J'ai économisé avec Depensa!&body=${encMail}" class="share-link share-email" title="Courriel">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Courriel
                    </a>
                `;
                btn.parentElement.style.position = 'relative';
                btn.parentElement.appendChild(popover);
                setTimeout(() => {
                    document.addEventListener('click', function closePopover() {
                        popover.remove();
                        document.removeEventListener('click', closePopover);
                    });
                }, 0);
            });
        });
    } else {
        savingsBanner.innerHTML = '';
    }

    // Place the view toggle strictly below all alert banners, right above the expense list.
    const viewRow = $('expenseViewRow');
    if (viewRow) {
        const hasSavings = savingsBanner && savingsBanner.innerHTML.trim().length > 0;
        const hasHikes   = hikeBanner && hikeBanner.innerHTML.trim().length > 0;
        if (hasHikes) {
            hikeBanner.insertAdjacentElement('afterend', viewRow);
        } else if (hasSavings) {
            savingsBanner.insertAdjacentElement('afterend', viewRow);
        } else {
            grid.parentElement.insertBefore(viewRow, grid);
        }
    }

    let cardIndex = 0;
    const grouped = expenseSortMode === 'categories'
        ? groupExpensesForDisplay(filtered)
        : [{
            label: null,
            items: [...filtered].sort((a, b) => {
                const diff = effectiveMonthly(a) - effectiveMonthly(b);
                if (expenseSortMode === 'amount_desc') return -diff;
                if (expenseSortMode === 'amount_asc') return diff;
                return 0;
            }),
        }];
    grouped.forEach(group => {
        if (group.label) {
            const header = document.createElement('div');
            header.className = 'expense-group-header';
            header.textContent = group.label;
            grid.appendChild(header);
        }

        group.items.forEach(exp => {
            const cat = getCAT(exp.cat);
            const el  = document.createElement('div');
            el.dataset.expenseId = String(exp.id);
            const isSimOverridden = simulationMode && simOverrides.hasOwnProperty(exp.id);
            const hasHike = hikeMap.has(exp.id);
            el.className = 'expense-card' + (isSimOverridden ? ' sim-overridden' : '') + (hasHike ? ' hike-detected' : '');
            el.style.animationDelay = (cardIndex * 35) + 'ms';
            cardIndex += 1;

            // Amount display: use effective monthly, show hint if annual
            const effAmt = effectiveMonthly(exp);
            const isAnnual = exp.frequency === 'annuel';
            const isOneTime = !exp.recurring;
            const amountDisplay = isSimOverridden && simOverrides[exp.id] === null
                ? `<div class="expense-monthly" style="color:var(--text-3);text-decoration:line-through">${fmt(monthlyAmount(exp))}</div><div style="font-size:10px;color:var(--amber)">Masqué en simulation</div>`
                : isOneTime
                    ? `<div class="expense-monthly">${fmt(effAmt)}</div>`
                    : `<div class="expense-monthly">${fmt(effAmt)}<span style="font-size:10px;font-weight:400;color:var(--text-2)">/mois</span></div>
                       ${isAnnual ? `<div style="font-size:10px;color:var(--text-2)">${fmt(exp.amount)}/an</div>` : `<div class="expense-yearly">${fmt(effAmt * 12)}/an</div>`}`;

            const recurBadge = exp.recurring
                ? `<div class="recurring-badge"><span class="badge-icon">↻</span> Récurrent</div>`
                : '';
            const freqBadge = isAnnual
                ? `<span class="expense-freq-badge annual">Annuel</span>`
                : '';
            const simTag  = isSimOverridden ? `<span class="sim-active-tag">🔬 Sim</span>` : '';
            const hikeTag = hasHike ? `<span class="hike-badge">⚠ +${Math.round(hikeMap.get(exp.id).pct * 100)}%</span>` : '';

            const alertsOn = exp.alerts !== false && !exp.recurring;
            const actions = !isPast ? `
                <div class="card-actions">
                    <button class="action-btn action-btn-alerts ${alertsOn ? '' : 'alerts-off'}" data-id="${exp.id}" title="${alertsOn ? 'Alertes actives — cliquer pour désactiver' : 'Alertes désactivées — cliquer pour activer'}">${alertsOn ? '🔔' : '🔕'}</button>
                    <button class="action-btn action-btn-edit" data-id="${exp.id}">✏️ Modifier</button>
                    <button class="action-btn action-btn-del"  data-id="${exp.id}">✕ Supprimer</button>
                </div>` : '';

            el.innerHTML = `
                <div class="expense-icon" style="background:${cat.color}1a">${getExpenseIconHTML(exp.name, exp.cat)}</div>
                <div class="expense-info">
                    <div class="expense-name">${exp.name}${simTag}${hikeTag}</div>
                    ${amountDisplay}
                    <div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:2px;">${recurBadge}${freqBadge}</div>
                </div>
                ${actions}
            `;
            grid.appendChild(el);
        });
    });

    // Empty state
    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-2);font-size:13px;">Aucune dépense trouvée.</div>`;
    }

    if (!isPast) {
        grid.querySelectorAll('.action-btn-alerts').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const exp = expenses.find(x => x.id === parseInt(btn.dataset.id));
                if (!exp) return;
                exp.alerts = exp.alerts === false;
                dbUpdateExpense(exp);
                renderExpenses();
            });
        });
        grid.querySelectorAll('.action-btn-edit').forEach(btn => {
            btn.addEventListener('click', e => { e.stopPropagation(); openEditModal(parseInt(btn.dataset.id)); });
        });
        grid.querySelectorAll('.action-btn-del').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id       = parseInt(btn.dataset.id);
                const expToDel = expenses.find(x => x.id === id);
                if (expToDel) dbDeleteExpense(expToDel);
                const card = btn.closest('.expense-card');
                card.style.transition = 'opacity 0.22s, transform 0.22s';
                card.style.opacity = '0'; card.style.transform = 'scale(0.92)';
                setTimeout(() => { expenses = expenses.filter(x => x.id !== id); refresh(); }, 210);
            });
        });
    }

    // Auto-scroll + premium focus animation on freshly added expense card.
    if (!isPast && pendingScrollExpenseId !== null) {
        const selector = `.expense-card[data-expense-id="${pendingScrollExpenseId}"]`;
        const targetCard = grid.querySelector(selector);

        // If recurring filter hides the new expense, disable it once to reveal item.
        if (!targetCard && showRecurringOnly) {
            showRecurringOnly = false;
            $('recurringFilter').classList.toggle('active', false);
            renderExpenses();
            return;
        }

        if (targetCard) {
            requestAnimationFrame(() => {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                targetCard.classList.add('expense-card-added');
                setTimeout(() => targetCard.classList.remove('expense-card-added'), 1400);
            });
        }
        pendingScrollExpenseId = null;
    }

    const monthTotal = totalMonthly(source);
    $('totalMonthly').textContent = fmt(monthTotal);
    $('yearTotal').textContent    = fmt(projectedYearly());

    const lbl = $('donutMonthLabel');
    if (lbl) lbl.textContent = MONTH_LABELS[selectedMonth] || 'Mars 2026';

    const mlbl = $('selectedMonthLabel');
    if (mlbl) mlbl.textContent = MONTH_LABELS[selectedMonth] || 'Mars 2026';

    renderLegend();
    renderScoreBlock();
}

function renderLegend() {
    const d = buildDonutDataFrom(getSelectedExpenses());
    const total = d.data.reduce((a,b) => a+b, 0);
    const legend = $('legend');
    legend.innerHTML = '';
    d.labels.forEach((label, i) => {
        const pct = total ? Math.round(d.data[i] / total * 100) : 0;
        const div = document.createElement('div');
        div.className = 'legend-item';
        div.innerHTML = `
            <div class="legend-dot" style="background:${d.borders[i]}"></div>
            <span>${label}</span>
            <span class="legend-pct">${pct}%</span>
        `;
        legend.appendChild(div);
    });
}

// ═══════════════════════════════════════════════════════
//  RENDER RECOMMENDATIONS
// ═══════════════════════════════════════════════════════

function renderRecs() {
    const grid   = $('recGrid');
    const totalSave = RECS.reduce((s, r) => s + r.saveYearly, 0);
    grid.innerHTML = '';

    RECS.forEach(rec => {
        const card = document.createElement('div');
        card.className = 'rec-card';
        card.id = 'rc-' + rec.id;

        const isApplied = appliedRecs.has(rec.id);
        let bodyContent = '';
        if (!rec.dynamic) {
            const rows = rec.rows.map(r => `
                <tr class="${r.badge === 'current' ? 'row-current' : r.badge === 'best' ? 'row-best' : ''}">
                    <td>
                        ${r.name}
                        ${r.badge === 'current' ? '<span class="badge badge-current">Actuel</span>' : ''}
                        ${r.badge === 'best'    ? '<span class="badge badge-best">Meilleur</span>'  : ''}
                    </td>
                    <td>${r.plan}</td>
                    <td style="font-family:'Outfit',sans-serif;font-weight:700;">${fmt(r.price)}/mois</td>
                </tr>
            `).join('');
            bodyContent = `
                <table class="compare-table">
                    <thead><tr><th>Fournisseur</th><th>Forfait</th><th>Prix</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="rec-tip">${rec.tip}</div>
                <button class="apply-btn" data-id="${rec.id}" ${isApplied ? 'disabled' : ''}>${isApplied ? '✓ Appliqué!' : 'Appliquer cette optimisation ✓'}</button>
            `;
        }

        if (isApplied) card.classList.add('applied');

        card.innerHTML = `
            <div class="rec-header-inner">
                <div class="rec-icon" style="background:${rec.color}1a">${rec.icon}</div>
                <div class="rec-info">
                    <div class="rec-name">${rec.name}</div>
                    <div class="rec-desc">${rec.desc}</div>
                </div>
                <div class="rec-applied-badge">✓ Appliqué — -${fmt(rec.saveMonthly)}/mois</div>
                <div class="rec-save-badge">
                    <div class="rec-monthly-save">-${fmt(rec.saveMonthly)}/mois</div>
                    <div class="rec-yearly-save">-${fmt(rec.saveYearly)}/an</div>
                </div>
                <span class="rec-chevron">▼</span>
            </div>
            <div class="rec-body">
                <div class="rec-body-inner">${bodyContent}</div>
            </div>
        `;

        // Toggle accordion
        card.querySelector('.rec-header-inner').addEventListener('click', () => {
            const wasOpen = card.classList.contains('open');
            card.classList.toggle('open');
            if (!wasOpen && rec.dynamic) {
                loadDynamicRec(rec, card);
            }
        });

        // Apply btn (static recs only)
        if (!rec.dynamic) {
            card.querySelector('.apply-btn').addEventListener('click', e => {
                e.stopPropagation();
                applyRec(rec, card);
            });
        }

        grid.appendChild(card);
    });
}

function loadDynamicRec(rec, card) {
    const bodyInner = card.querySelector('.rec-body-inner');

    if (rec.id === 'streaming') {
        const streamExpenses = expenses.filter(e => e.cat === 'streaming');
        const currentCost = streamExpenses.reduce((s, e) => s + monthlyAmount(e), 0);

        bodyInner.innerHTML = `
            <div class="search-loading">
                <div class="search-spinner"></div>
                <span>Recherche des meilleurs prix streaming…</span>
            </div>`;

        setTimeout(() => {
            const normalize = s => (s || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9+]/g, '');

            const subscribedByProvider = new Map();
            streamExpenses.forEach(exp => {
                const key = normalize(exp.name);
                const monthly = monthlyAmount(exp);
                if (!subscribedByProvider.has(key) || monthly < subscribedByProvider.get(key)) {
                    subscribedByProvider.set(key, monthly);
                }
            });

            const sorted = [...STREAMING_PLANS].sort((a, b) => b.price - a.price);

            let timestampLabel = '';
            if (streamingPricesUpdatedAt) {
                const d = new Date(streamingPricesUpdatedAt);
                timestampLabel = 'Scraped le ' + d.toLocaleDateString('fr-CA', { day:'numeric', month:'long', year:'numeric' }) + ' à ' + d.toLocaleTimeString('fr-CA', { hour:'2-digit', minute:'2-digit' });
            } else {
                timestampLabel = 'Prix estimés — <a href="https://github.com/propea33/depensa/tree/main/streaming-scraper" target="_blank" style="color:var(--accent)">configurer le scraper</a>';
            }

            let totalPotentialSave = 0;
            const rows = sorted.map((p, i) => {
                const key = normalize(p.provider);
                const currentProviderPrice = subscribedByProvider.get(key);
                const isSubscribed = typeof currentProviderPrice === 'number';
                const saving = isSubscribed ? Math.max(0, currentProviderPrice - p.price) : 0;
                totalPotentialSave += saving;

                const estimBadge = !p.scraped_ok
                    ? '<span style="font-size:10px;color:var(--text-3);background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:4px;margin-left:4px;">estimé</span>'
                    : '';
                const dropBadge = p.price_drop && p.delta < 0
                    ? `<span style="font-size:10px;color:#065f46;background:#d1fae5;padding:1px 5px;border-radius:4px;margin-left:4px;">↘ baisse ${fmt(Math.abs(p.delta))}</span>`
                    : '';

                return `
                    <a class="plan-row ${isSubscribed ? 'plan-current' : ''}"
                       href="${p.url}" target="_blank" rel="noopener"
                       style="animation-delay:${i * 55}ms">
                        <div class="plan-provider">
                            ${p.provider}${estimBadge}${dropBadge}
                            <small>${p.plan_name || 'Mensuel'}</small>
                        </div>
                        <span class="plan-speed">${isSubscribed ? 'Abonné' : 'Non abonné'}</span>
                        <div style="text-align:right;min-width:80px;">
                            <div class="plan-price">${fmt(p.price)}<span style="font-size:11px;font-weight:400;color:var(--text-2)">/mois</span></div>
                            ${saving > 0 ? `<div class="plan-savings">-${fmt(saving)}/mois<div class="plan-savings-year">-${fmt(saving * 12)}/an</div></div>` : ''}
                        </div>
                        ${isSubscribed ? '<span class="plan-tag plan-tag-current">Actuel</span>' : ''}
                        <span class="plan-link-icon">↗</span>
                    </a>
                `;
            }).join('');

            bodyInner.innerHTML = `
                <div class="search-result-header">
                    <span class="search-current-cost">Vos abonnements actuels : <strong>${fmt(currentCost)}/mois</strong></span>
                    <span class="search-timestamp">${timestampLabel}</span>
                </div>
                ${rows}
                ${totalPotentialSave > 0
                    ? `<div class="rec-tip">💡 En optimisant vos services actifs, vous pouvez économiser <strong>${fmt(totalPotentialSave)}/mois</strong> soit <strong>${fmt(totalPotentialSave * 12)}/an</strong>.</div>`
                    : `<div class="rec-tip">✅ Aucun gain évident détecté sur vos abonnements actifs pour le moment.</div>`
                }
            `;
        }, 900);
    }

    if (rec.id === 'internet') {
        const currentCost = expenses
            .filter(e => e.cat === 'internet')
            .reduce((s, e) => s + e.amount, 0);

        bodyInner.innerHTML = `
            <div class="search-loading">
                <div class="search-spinner"></div>
                <span>Recherche des meilleurs forfaits Internet au Québec…</span>
            </div>`;

        setTimeout(() => {
            const sorted = [...INTERNET_PLANS].sort((a, b) => b.price - a.price);
            const best   = sorted.filter(p => p.price < currentCost)
                                 .sort((a, b) => a.price - b.price)[0];

            // Timestamp : prefer scraper date, fallback to today
            let timestampLabel = '';
            if (ispPricesUpdatedAt) {
                const d = new Date(ispPricesUpdatedAt);
                timestampLabel = 'Scraped le ' + d.toLocaleDateString('fr-CA', { day:'numeric', month:'long', year:'numeric' }) + ' à ' + d.toLocaleTimeString('fr-CA', { hour:'2-digit', minute:'2-digit' });
            } else {
                timestampLabel = 'Prix estimés — <a href="https://github.com/TON_USER/isp-scraper" target="_blank" style="color:var(--accent)">configurer le scraper</a>';
            }

            const rows = sorted.map((p, i) => {
                const isCurrent = p.price === currentCost;
                const isBest    = best && p.provider === best.provider;
                const saving    = currentCost - p.price;
                const estimBadge = !p.scraped_ok
                    ? '<span style="font-size:10px;color:var(--text-3);background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:4px;margin-left:4px;">estimé</span>'
                    : '';

                return `
                    <a class="plan-row ${isCurrent ? 'plan-current' : isBest ? 'plan-best' : ''}"
                       href="${p.url}" target="_blank" rel="noopener"
                       style="animation-delay:${i * 55}ms">
                        <div class="plan-provider">
                            ${p.provider}${estimBadge}
                            <small>${p.type}${p.note ? ' · ' + p.note : ''}</small>
                        </div>
                        <span class="plan-speed">${p.speed}</span>
                        <div style="text-align:right;min-width:80px;">
                            <div class="plan-price">${fmt(p.price)}<span style="font-size:11px;font-weight:400;color:var(--text-2)">/mois</span></div>
                            ${saving > 0 ? `<div class="plan-savings">-${fmt(saving)}/mois<div class="plan-savings-year">-${fmt(saving * 12)}/an</div></div>` : ''}
                        </div>
                        ${isCurrent ? '<span class="plan-tag plan-tag-current">Actuel</span>' : ''}
                        ${isBest    ? '<span class="plan-tag plan-tag-best">✓ Meilleur</span>'  : ''}
                        <span class="plan-link-icon">↗</span>
                    </a>
                `;
            }).join('');

            const bestSaving = best ? currentCost - best.price : 0;

            bodyInner.innerHTML = `
                <div class="search-result-header">
                    <span class="search-current-cost">Votre forfait actuel : <strong>${fmt(currentCost)}/mois</strong></span>
                    <span class="search-timestamp">${timestampLabel}</span>
                </div>
                ${rows}
                ${bestSaving > 0
                    ? `<div class="rec-tip">💡 En passant à <strong>${best.provider}</strong> (${best.speed}), vous économisez <strong>${fmt(bestSaving)}/mois</strong> soit <strong>${fmt(bestSaving * 12)}/an</strong> — même qualité de réseau.</div>
                       <button class="apply-btn" id="apply-internet">Appliquer cette optimisation ✓</button>`
                    : `<div class="rec-tip">✅ Vous avez déjà le meilleur prix disponible dans votre région!</div>`
                }
            `;

            const applyBtn = card.querySelector('#apply-internet');
            if (applyBtn) {
                applyBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    applyBtn.textContent = '✓ Optimisation appliquée!';
                    applyBtn.disabled = true;
                    showToast(`🎉 Économies de ${fmt(bestSaving)}/mois appliquées!`);
                });
            }
        }, 900);
    }

    if (rec.id === 'cell') {
        const currentCost = expenses
            .filter(e => e.cat === 'cell')
            .reduce((s, e) => s + e.amount, 0);

        bodyInner.innerHTML = `
            <div class="search-loading">
                <div class="search-spinner"></div>
                <span>Recherche des meilleurs forfaits cellulaires au Québec…</span>
            </div>`;

        setTimeout(() => {
            const sorted = [...CELL_PLANS].sort((a, b) => b.price - a.price);
            const best   = sorted.filter(p => p.price < currentCost)
                                 .sort((a, b) => a.price - b.price)[0];

            let timestampLabel = '';
            if (cellPricesUpdatedAt) {
                const d = new Date(cellPricesUpdatedAt);
                timestampLabel = 'Scraped le ' + d.toLocaleDateString('fr-CA', { day:'numeric', month:'long', year:'numeric' }) + ' à ' + d.toLocaleTimeString('fr-CA', { hour:'2-digit', minute:'2-digit' });
            } else {
                timestampLabel = 'Prix estimés — <a href="https://planhub.ca/cell-phone-plans/quebec" target="_blank" style="color:var(--accent)">voir planhub.ca</a>';
            }

            const rows = sorted.map((p, i) => {
                const isCurrent = p.price === currentCost;
                const isBest    = best && p.provider === best.provider;
                const saving    = currentCost - p.price;
                const estimBadge = !p.scraped_ok
                    ? '<span style="font-size:10px;color:var(--text-3);background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:4px;margin-left:4px;">estimé</span>'
                    : '';

                return `
                    <a class="plan-row ${isCurrent ? 'plan-current' : isBest ? 'plan-best' : ''}"
                       href="${p.url}" target="_blank" rel="noopener"
                       style="animation-delay:${i * 55}ms">
                        <div class="plan-provider">
                            ${p.provider}${estimBadge}
                            <small>${p.network ? 'Réseau ' + p.network : ''}</small>
                        </div>
                        <span class="plan-speed">${p.plan_name}</span>
                        <div style="text-align:right;min-width:80px;">
                            <div class="plan-price">${fmt(p.price)}<span style="font-size:11px;font-weight:400;color:var(--text-2)">/mois</span></div>
                            ${saving > 0 ? `<div class="plan-savings">-${fmt(saving)}/mois<div class="plan-savings-year">-${fmt(saving * 12)}/an</div></div>` : ''}
                        </div>
                        ${isCurrent ? '<span class="plan-tag plan-tag-current">Actuel</span>' : ''}
                        ${isBest    ? '<span class="plan-tag plan-tag-best">✓ Meilleur</span>'  : ''}
                        <span class="plan-link-icon">↗</span>
                    </a>
                `;
            }).join('');

            const bestSaving = best ? currentCost - best.price : 0;

            bodyInner.innerHTML = `
                <div class="search-result-header">
                    <span class="search-current-cost">Votre forfait actuel : <strong>${fmt(currentCost)}/mois</strong></span>
                    <span class="search-timestamp">${timestampLabel}</span>
                </div>
                ${rows}
                ${bestSaving > 0
                    ? `<div class="rec-tip">💡 En passant à <strong>${best.provider}</strong> (${best.plan_name}${best.network ? ', réseau ' + best.network : ''}), vous économisez <strong>${fmt(bestSaving)}/mois</strong> soit <strong>${fmt(bestSaving * 12)}/an</strong>.</div>
                       <button class="apply-btn" id="apply-cell">Appliquer cette optimisation ✓</button>`
                    : `<div class="rec-tip">✅ Vous avez déjà le meilleur prix disponible!</div>`
                }
            `;

            const applyBtn = card.querySelector('#apply-cell');
            if (applyBtn) {
                applyBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    applyBtn.textContent = '✓ Optimisation appliquée!';
                    applyBtn.disabled = true;
                    showToast(`🎉 Économies de ${fmt(bestSaving)}/mois appliquées!`);
                });
            }
        }, 900);
    }
}

function applyRec(rec, card) {
    appliedRecs.add(rec.id);
    card.classList.add('applied');
    const applyBtn = card.querySelector('.apply-btn');
    if (applyBtn) { applyBtn.textContent = '✓ Appliqué!'; applyBtn.disabled = true; }
    showToast(`🎉 Économies de ${fmt(rec.saveMonthly)}/mois appliquées!`);
    renderScoreBlock();
    renderRecs();
}

function renderScoreBlock() {}

// ═══════════════════════════════════════════════════════
//  TICKER
// ═══════════════════════════════════════════════════════

function renderTicker() {
    const track = $('tickerTrack');
    // Build one set of items, then duplicate for seamless loop
    const items = expenses.map(exp => {
        return `
            <span class="ticker-item">
                <span class="ticker-item-icon">${getExpenseIconHTML(exp.name, exp.cat)}</span>
                <span class="ticker-item-name">${exp.name}</span>
                <span class="ticker-item-amount">${fmt(monthlyAmount(exp))}</span>
            </span>
            <span class="ticker-sep">·</span>
        `;
    }).join('');

    // Duplicate so the scroll loops seamlessly
    track.innerHTML = items + items;

    // Adjust speed based on content length (more items = faster)
    const duration = Math.max(20, expenses.length * 4);
    track.style.animationDuration = duration + 's';
}

// ═══════════════════════════════════════════════════════
//  SIMULATION SECTION
// ═══════════════════════════════════════════════════════

function simTotalMonthly() {
    return simExpenses.reduce((s, e) => s + monthlyAmount(e), 0);
}

function openSimSection() {
    // Deep-copy real expenses into simulation
    simExpenses = JSON.parse(JSON.stringify(expenses));
    simNextId   = Math.max(0, ...simExpenses.map(e => e.id)) + 1;
    $('dashContent').style.display  = 'none';
    $('simContent').style.display   = 'block';
    const simNavBtn = $('simNavBtn');
    if (simNavBtn) simNavBtn.classList.add('active');
    simRender();
    requestAnimationFrame(() => { if (!simDonutInst) initSimSectionDonut(); else updateSimSectionDonut(); });
}

function closeSimSection() {
    $('dashContent').style.display = '';
    $('simContent').style.display  = 'none';
    const simNavBtn = $('simNavBtn');
    if (simNavBtn) simNavBtn.classList.remove('active');
    if (simDonutInst) { simDonutInst.destroy(); simDonutInst = null; }
}

function resetSimSection() {
    simExpenses = JSON.parse(JSON.stringify(expenses));
    simNextId   = Math.max(0, ...simExpenses.map(e => e.id)) + 1;
    simRender();
    if (simDonutInst) { simDonutInst.destroy(); simDonutInst = null; }
    requestAnimationFrame(initSimSectionDonut);
    showToast('🔬 Simulation réinitialisée depuis vos vraies dépenses');
}

function renderSimGrid() {
    const grid = $('simExpenseGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const countEl = $('simExpCount');
    if (countEl) countEl.textContent = `(${simExpenses.length})`;

    simExpenses.forEach((exp, idx) => {
        const cat = getCAT(exp.cat);
        const el  = document.createElement('div');
        el.className = 'expense-card';
        el.style.animationDelay = (idx * 30) + 'ms';
        const effAmt = monthlyAmount(exp);
        const isAnnual = exp.frequency === 'annuel';
        el.innerHTML = `
            <div class="expense-icon" style="background:${cat.color}1a">${getExpenseIconHTML(exp.name, exp.cat)}</div>
            <div class="expense-info">
                <div class="expense-name">${exp.name}</div>
                <div class="expense-monthly" style="color:#f59e0b">${fmt(effAmt)}<span style="font-size:10px;font-weight:400;color:var(--text-2)">/mois</span></div>
                ${isAnnual ? `<div style="font-size:10px;color:var(--text-2)">${fmt(exp.amount)}/an</div>` : `<div class="expense-yearly">${fmt(effAmt*12)}/an</div>`}
                ${exp.recurring ? `<div class="recurring-badge"><span class="badge-icon">↻</span> Récurrent</div>` : ''}
            </div>
            <div class="card-actions">
                <button class="action-btn action-btn-edit" data-id="${exp.id}">✏️ Modifier</button>
                <button class="action-btn action-btn-del"  data-id="${exp.id}">✕ Retirer</button>
            </div>
        `;
        grid.appendChild(el);
    });

    if (simExpenses.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-2);font-size:13px;">Aucune dépense simulée.</div>`;
    }

    grid.querySelectorAll('.action-btn-edit').forEach(btn => {
        btn.addEventListener('click', e => { e.stopPropagation(); openSimEditModal(parseInt(btn.dataset.id)); });
    });
    grid.querySelectorAll('.action-btn-del').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const card = btn.closest('.expense-card');
            card.style.transition='opacity 0.22s,transform 0.22s';
            card.style.opacity='0'; card.style.transform='scale(0.92)';
            setTimeout(() => { simExpenses = simExpenses.filter(x=>x.id!==id); simRender(); }, 210);
        });
    });
}

function renderSimTotals() {
    const monthly = simTotalMonthly();
    const realMonthly = expenses.reduce((s,e)=>s+monthlyAmount(e),0);
    const diff = realMonthly - monthly;

    const el = $('simMonthlyTotal');
    if (el) el.textContent = fmt(monthly);
    const yr = $('simYearFigure');
    if (yr) yr.textContent = fmt(monthly * 12);

    const diffEl = $('simDiffSummary');
    if (diffEl) {
        diffEl.innerHTML = `
            <div style="text-align:center">
                <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:15px;color:var(--text-2)">${fmt(realMonthly)}</div>
                <div style="font-size:10px;color:var(--text-3);margin-top:2px">Réel/mois</div>
            </div>
            <div style="font-size:18px;color:var(--text-3)">→</div>
            <div style="text-align:center">
                <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:15px;color:#f59e0b">${fmt(monthly)}</div>
                <div style="font-size:10px;color:var(--text-3);margin-top:2px">Simulé/mois</div>
            </div>
            <div style="text-align:center">
                <div style="font-family:'Outfit',sans-serif;font-weight:800;font-size:16px;color:${diff>0?'var(--green)':diff<0?'var(--red)':'var(--text-3)'}">${diff>0?'-'+fmt(diff):diff<0?'+'+fmt(-diff):'='}</div>
                <div style="font-size:10px;color:var(--text-3);margin-top:2px">${diff>0?'économie':diff<0?'augmentation':'identique'}</div>
            </div>
        `;
    }
}

function simRender() {
    renderSimGrid();
    renderSimTotals();
    updateSimSectionDonut();
}

// ═══════════════════════════════════════════════════════
//  SIMULATION MODE (inline overlay on main dashboard)
// ═══════════════════════════════════════════════════════

function openRecSimulation(rec) {
    // Map rec to matching expenses by category
    const catMap = { cell:'cell', streaming:'streaming', internet:'internet' };
    const cat = catMap[rec.id];
    const matched = expenses.filter(e => e.cat === cat);
    if (!matched.length) { showToast('Aucune dépense correspondante trouvée.'); return; }

    // Apply saving proportionally across matched expenses
    const currentTotal = matched.reduce((s, e) => s + monthlyAmount(e), 0);
    const newTotal = Math.max(0, currentTotal - rec.saveMonthly);

    matched.forEach(exp => {
        const ratio = currentTotal > 0 ? monthlyAmount(exp) / currentTotal : 1 / matched.length;
        simOverrides[exp.id] = { amount: Math.round(newTotal * ratio * 100) / 100, frequency: 'mensuel' };
    });

    activateSimulation();
    showToast(`🔬 Simulation: -${fmt(rec.saveMonthly)}/mois sur ${rec.name}`);
}

function activateSimulation() {
    simulationMode = true;
    $('simBanner').classList.add('active');
    $('simDonutCard').classList.add('active');
    refresh();
    // Init or update sim donut after render
    requestAnimationFrame(() => {
        if (!simDonutChartInst) initSimDonut();
        else updateSimDonut();
    });
}

function deactivateSimulation() {
    simulationMode = false;
    simOverrides = {};
    $('simBanner').classList.remove('active');
    destroySimDonut();
    refresh();
}

function runRoast() {}

// ═══════════════════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════════════════

function exportCSV() {
    const monthLabel = MONTH_LABELS[selectedMonth] || 'Mars 2026';
    const source = getSelectedExpenses();
    const BOM = '\uFEFF';

    let csv = `"Dépenses – ${monthLabel}"\n\n`;
    csv += `"Nom","Catégorie","Mensuel","Annuel","Fréquence","Notes"\n`;
    source.forEach(exp => {
        const cat = getCAT(exp.cat);
        const monthly = monthlyAmount(exp);
        const row = [exp.name, cat.name, fmt(monthly), fmt(monthly*12), exp.frequency==='annuel'?'Annuel':'Mensuel', exp.notes||''];
        csv += row.map(v => `"${v}"`).join(',') + '\n';
    });

    // Category totals
    const catMap = {};
    source.forEach(exp => {
        const cat = getCAT(exp.cat);
        catMap[cat.name] = (catMap[cat.name] || 0) + monthlyAmount(exp);
    });
    csv += `\n"Totaux par catégorie"\n"Catégorie","Mensuel","Annuel"\n`;
    Object.entries(catMap).sort((a,b) => b[1]-a[1]).forEach(([name, total]) => {
        csv += `"${name}","${fmt(total)}","${fmt(total*12)}"\n`;
    });
    const grand = source.reduce((s,e) => s + monthlyAmount(e), 0);
    csv += `"TOTAL","${fmt(grand)}","${fmt(grand*12)}"\n`;
    csv += `\n"Rapport généré par Depensa – Optimiseur de factures"\n`;

    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `Depensa_${monthLabel.replace(/ /g,'_')}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

function exportPDF() {
    const monthLabel = MONTH_LABELS[selectedMonth] || 'Mars 2026';
    const source     = getSelectedExpenses();
    const chartImg   = donutChart ? donutChart.toBase64Image('image/png', 1) : null;
    const grand      = source.reduce((s,e) => s + monthlyAmount(e), 0);

    // Category map
    const catMap = {};
    source.forEach(exp => {
        const cat = getCAT(exp.cat);
        if (!catMap[cat.name]) catMap[cat.name] = { total:0, icon:cat.icon, color:cat.color };
        catMap[cat.name].total += monthlyAmount(exp);
    });
    const catRows = Object.entries(catMap).sort((a,b) => b[1].total - a[1].total).map(([name, d]) => `
        <tr>
            <td>${d.icon} ${name}</td>
            <td class="amt">${fmt(d.total)}<span class="per">/mois</span></td>
            <td class="dim">${fmt(d.total*12)}/an</td>
            <td class="bar-cell"><div class="bar" style="width:${Math.round(d.total/grand*100)}%;background:${d.color}"></div></td>
            <td class="pct dim">${Math.round(d.total/grand*100)}%</td>
        </tr>`).join('');

    const expRows = source.map(exp => {
        const cat      = getCAT(exp.cat);
        const m        = monthlyAmount(exp);
        const iconUrl  = getExpenseIcon(exp.name, exp.cat);
        const iconHTML = iconUrl
            ? `<img src="${iconUrl}" width="14" height="14" style="border-radius:3px;vertical-align:middle;margin-right:5px;" onerror="this.replaceWith(document.createTextNode('${cat.icon}'))">`
            : `${cat.icon} `;
        return `<tr>
            <td>${iconHTML}${exp.name}</td>
            <td><span class="pill" style="background:${cat.color}20;color:${cat.color}">${cat.icon} ${cat.name}</span></td>
            <td class="amt">${fmt(m)}<span class="per">/mois</span></td>
            <td class="dim">${fmt(m*12)}/an</td>
            <td class="dim">${exp.frequency==='annuel'?'Annuel':'Mensuel'}</td>
            <td class="dim notes">${exp.notes||'—'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Depensa – ${monthLabel}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700&family=Figtree:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Figtree',sans-serif;color:#0f172a;background:#fff;padding:32px 40px;font-size:13px;line-height:1.5}
h1{font-family:'Outfit',sans-serif;font-size:26px;font-weight:700}
h2{font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;margin-bottom:14px;padding-bottom:8px;border-bottom:1.5px solid #e2e8f0}
.header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:32px;padding-bottom:18px;border-bottom:2.5px solid #6366f1}
.subtitle{color:#64748b;font-size:13px;margin-top:3px}
.logo{font-family:'Outfit',sans-serif;font-weight:700;font-size:16px;color:#6366f1}
.logo span{color:#a5b4fc}
.section{margin-bottom:32px}
.chart-row{display:flex;gap:32px;align-items:flex-start}
.chart-img{width:190px;height:190px;flex-shrink:0}
.chart-side{flex:1}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:7px 10px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;border-bottom:1.5px solid #e2e8f0}
td{padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
tr:last-child td{border-bottom:none}
.amt{font-weight:600;color:#0f172a;white-space:nowrap}
.dim{color:#64748b}
.notes{max-width:130px;font-size:11px}
.per{font-size:10px;font-weight:400;color:#94a3b8;margin-left:2px}
.badge{display:inline-block;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600}
.badge.fixe{background:#ede9fe;color:#7c3aed}.badge.variable{background:#cffafe;color:#0891b2}
.pill{display:inline-block;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600}
.bar-cell{width:110px}.bar{height:6px;border-radius:3px}
.pct{width:36px;font-weight:600}
.total-row td{font-weight:700;font-size:14px;border-top:2px solid #e2e8f0;padding-top:10px}
.footer{margin-top:40px;padding-top:14px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:11px}
@media print{body{padding:20px}@page{margin:16mm}}
</style></head><body>
<div class="header">
  <div><h1>${monthLabel}</h1><div class="subtitle">Rapport de dépenses mensuel</div></div>
  <div class="logo">Depen<span>sa</span></div>
</div>

<div class="section">
  <div class="chart-row">
    ${chartImg ? `<img class="chart-img" src="${chartImg}" alt="Répartition">` : ''}
    <div class="chart-side">
      <h2>Répartition par catégorie</h2>
      <table>
        <thead><tr><th>Catégorie</th><th>Mensuel</th><th>Annuel</th><th colspan="2">Part</th></tr></thead>
        <tbody>
          ${catRows}
          <tr class="total-row">
            <td>Total</td><td class="amt">${fmt(grand)}/mois</td>
            <td class="dim">${fmt(grand*12)}/an</td><td colspan="2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<div class="section">
  <h2>Liste des dépenses</h2>
  <table>
    <thead><tr><th>Nom</th><th>Catégorie</th><th>Mensuel</th><th>Annuel</th><th>Fréquence</th><th>Notes</th></tr></thead>
    <tbody>${expRows}</tbody>
  </table>
</div>

<div class="footer">Rapport généré par Depensa – Optimiseur de factures</div>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(html);
    win.document.close();
    win.addEventListener('load', () => { win.focus(); win.print(); });
}

// ═══════════════════════════════════════════════════════
//  REFRESH (called after any data change)
// ═══════════════════════════════════════════════════════

function refresh() {
    renderExpenses();
    updateDonut();
    updateHistoryChart();
    renderTicker();
    if (simulationMode && simDonutChartInst) updateSimDonut();
}
