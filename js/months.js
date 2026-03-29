// ═══════════════════════════════════════════════════════
//  MONTHS — Dynamic month system + automatic rollover
// ═══════════════════════════════════════════════════════

const MONTH_SHORT_FR = ['Jan','Fév','Mars','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
const MONTH_FULL_FR  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// ── Key helpers ───────────────────────────────────────

function keyToLabel(key) {
    const [year, month] = key.split('-').map(Number);
    return MONTH_FULL_FR[month - 1] + ' ' + year;
}

function keyToShort(key) {
    return MONTH_SHORT_FR[parseInt(key.split('-')[1]) - 1];
}

// Key that is n months before the given key
function prevKey(key, n) {
    let [year, month] = key.split('-').map(Number);
    month -= n;
    while (month <= 0) { month += 12; year--; }
    return year + '-' + String(month).padStart(2, '0');
}

// Maps legacy HISTORY slugs → YYYY-MM keys
const LEGACY_MONTH_KEYS = {
    'oct': '2025-10', 'nov': '2025-11',
    'déc': '2025-12', 'dec': '2025-12',
    'jan': '2026-01',
    'fév': '2026-02', 'fev': '2026-02',
};

// ── Full history array ────────────────────────────────
// Returns [{key, month (short), total, expenses}] sorted oldest→newest

function getFullHistoryArray() {
    const all = [];

    // Hardcoded HISTORY from data.js
    HISTORY.forEach((entry, idx) => {
        const slug = entry.month.toLowerCase();
        const key  = LEGACY_MONTH_KEYS[slug];
        if (key) all.push({ key, month: keyToShort(key), total: entry.total, expenses: entry.expenses });
    });

    // Extra months archived by rollover (localStorage)
    try {
        const extra = JSON.parse(localStorage.getItem('depensa_history_extra') || '[]');
        extra.forEach(e => {
            if (!all.find(a => a.key === e.key)) {
                all.push({ key: e.key, month: keyToShort(e.key), total: e.total, expenses: e.expenses });
            }
        });
    } catch (_) {}

    // Chronological order
    all.sort((a, b) => a.key.localeCompare(b.key));
    return all;
}

// ── Month tab builder ─────────────────────────────────

function buildMonthTabs() {
    const live = liveMonthKey();
    const [liveYear] = live.split('-').map(Number);

    // Last 6 months (5 past + live)
    const months = [];
    for (let i = 5; i >= 0; i--) months.push(prevKey(live, i));

    const prevYearMonths = months.filter(k => parseInt(k) < liveYear);
    const currYearMonths = months.filter(k => parseInt(k.split('-')[0]) >= liveYear);

    // Year badge text (keep the SVG chevron node)
    const badge  = $('yearBadge');
    const chevron = badge.querySelector('.year-chevron');
    badge.textContent = String(liveYear);
    if (chevron) badge.appendChild(chevron);

    // Popover: previous-year months
    const popoverLabel  = $('yearPopover').querySelector('.year-popover-label');
    const popoverMonths = $('yearPopover').querySelector('.year-popover-months');
    if (popoverLabel) popoverLabel.textContent = String(liveYear - 1);
    if (popoverMonths) {
        popoverMonths.innerHTML = prevYearMonths.map(key =>
            `<button class="month-tab${selectedMonth === key ? ' active' : ''}" data-month="${key}">${keyToShort(key)}</button>`
        ).join('');
    }

    // Pills: current-year months
    const pills = $('monthPills');
    if (pills) {
        pills.innerHTML = currYearMonths.map(key => {
            const isLive   = key === live;
            const isActive = key === selectedMonth;
            return `<button class="month-tab${isActive ? ' active' : ''}${isLive ? ' live-tab' : ''}" data-month="${key}">${keyToShort(key)}</button>`;
        }).join('');
    }
}

// ── Month system init ─────────────────────────────────

function initMonthSystem() {
    const live = liveMonthKey();

    // Populate MONTH_MAP + MONTH_LABELS for the last 6 months
    for (let i = 0; i <= 5; i++) {
        const key = prevKey(live, i);
        MONTH_LABELS[key] = keyToLabel(key);
    }

    // Map legacy HISTORY indices into MONTH_MAP
    HISTORY.forEach((entry, idx) => {
        const slug = entry.month.toLowerCase();
        const key  = LEGACY_MONTH_KEYS[slug];
        if (key) MONTH_MAP[key] = idx;
    });

    // Extra localStorage history → also add their labels
    try {
        const extra = JSON.parse(localStorage.getItem('depensa_history_extra') || '[]');
        extra.forEach(e => { MONTH_LABELS[e.key] = keyToLabel(e.key); });
    } catch (_) {}
}

// ── Month rollover ────────────────────────────────────

async function checkMonthRollover() {
    if (DB_OFFLINE) return;

    const nowKey    = liveMonthKey();
    const storedKey = localStorage.getItem('depensa_live_month');

    if (!storedKey) {
        localStorage.setItem('depensa_live_month', nowKey);
        return;
    }
    if (storedKey === nowKey) return;

    // ── Rollover detected ──────────────────────────────
    console.log('[Depensa] Rollover: ' + storedKey + ' → ' + nowKey);

    // Archive current expenses to localStorage
    const snapshot = {
        key:      storedKey,
        total:    expenses.reduce((s, e) => s + (e.frequency === 'annuel' ? e.amount / 12 : e.amount), 0),
        expenses: expenses.map(e => ({
            name: e.name, cat: e.cat, amount: e.amount,
            recurring: e.recurring, frequency: e.frequency || 'mensuel',
        })),
    };
    try {
        const extra = JSON.parse(localStorage.getItem('depensa_history_extra') || '[]');
        if (!extra.find(e => e.key === storedKey)) {
            extra.push(snapshot);
            localStorage.setItem('depensa_history_extra', JSON.stringify(extra));
        }
    } catch (_) {}

    // Delete non-recurring from Supabase + memory
    const nonRecurring = expenses.filter(e => !e.recurring);
    for (const exp of nonRecurring) await dbDeleteExpense(exp);
    expenses = expenses.filter(e => e.recurring);

    localStorage.setItem('depensa_live_month', nowKey);
    console.log('[Depensa] Rollover ✓ — ' + expenses.length + ' récurrentes conservées pour ' + nowKey);
}

// ── Midnight scheduler ────────────────────────────────
// Fires precisely at midnight + 5s so the rollover happens automatically
// for users who leave the page open overnight.

function scheduleMidnightCheck() {
    const now      = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const ms       = midnight - now;
    setTimeout(async () => {
        await checkMonthRollover();
        initMonthSystem();
        buildMonthTabs();
        renderExpenses();
        updateHistoryChart();
        scheduleMidnightCheck(); // reschedule for the following midnight
    }, ms);
}
