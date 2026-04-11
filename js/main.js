// ═══════════════════════════════════════════════════════
//  MAIN — Event listeners & bootstrap
// ═══════════════════════════════════════════════════════

const THEME_STORAGE_KEY = 'depensa_theme';

function applyTheme(theme) {
    const finalTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', finalTheme);
    $('toggleKnob').textContent = finalTheme === 'dark' ? '🌙' : '☀️';
    updateSavingsChartColors();
    if (typeof donutChart !== 'undefined' && donutChart) donutChart.update('none');
}

function initTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    applyTheme(saved === 'dark' ? 'dark' : 'light');
}

// ─── Modal form event listeners ───────────────────────

// ─── Icon preview — debounce sur le champ nom ──────────
let _iconDebounce = null;
$('eName').addEventListener('input', () => {
    clearTimeout(_iconDebounce);
    _iconDebounce = setTimeout(refreshIconPreview, 180);
});

$('recurringToggle').addEventListener('click', () => setRecurring(!isRecurring));
$('alertsToggle').addEventListener('click', () => setAlerts(!isAlerts));
$('catSearch').addEventListener('input', () => buildCatGrid());

$('eFrequency').addEventListener('change', updateAmountLabel);
$('eAmount').addEventListener('input', updateAmountLabel);

$('openModal').addEventListener('click', _guardedOpenModal);
$('closeModal').addEventListener('click', closeModal);
$('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

function _guardedOpenModal() {
    if (!billingCanAddExpense()) { billingShowUpgradeModal(); return; }
    openAddModal();
}

$('expenseForm').addEventListener('submit', e => {
    e.preventDefault();
    const name   = $('eName').value.trim();
    const amount = roundMoney(parseFloat($('eAmount').value));
    if (!name || isNaN(amount) || amount <= 0) return;

    // Handle custom category
    let finalCat = selCat;
    const selectedCatObj = allCats().find(c => c.id === selCat);
    if (selectedCatObj && selectedCatObj.custom) {
        const customName = $('customCatName').value.trim();
        if (!customName) { $('customCatName').focus(); return; }
        // Reuse existing custom cat with same name, or create a new one
        const slug = 'custom_' + customName.toLowerCase().replace(/\s+/g, '_');
        const CUSTOM_COLORS = ['#a78bfa','#34d399','#fb923c','#38bdf8','#f472b6','#a3e635','#e879f9'];
        if (!customCats.find(c => c.id === slug)) {
            const color = CUSTOM_COLORS[customCats.length % CUSTOM_COLORS.length];
            customCats.push({ id:slug, name:customName, icon:'📦', color });
        }
        finalCat = slug;
    }

    const frequency = $('eFrequency').value;
    const notes     = $('eNotes').value.trim();
    const monthly   = frequency === 'annuel' ? amount / 12 : amount;

    if (editingId !== null) {
        const exp = expenses.find(e => e.id === editingId);
        if (exp) { exp.name = name; exp.cat = finalCat; exp.amount = amount; exp.recurring = isRecurring; exp.frequency = frequency; exp.notes = notes; exp.alerts = isAlerts; dbUpdateExpense(exp); }
        showToast(`✓ ${name} mis à jour — ${fmt(monthly)}/mois`);
    } else {
        const exp = { id: nextId++, name, cat: finalCat, amount, recurring: isRecurring, frequency, notes, alerts: isAlerts };
        expenses.push(exp);
        dbInsertExpense(exp);
        pendingScrollExpenseId = exp.id;
        showToast(`✓ ${name} ajouté — ${fmt(monthly)}/mois`);
    }

    refresh();
    closeModal();
});

// Patch the form submit to handle sim target
$('expenseForm').addEventListener('submit', function simFormPatch(e) {
    // Only handle if target is 'sim' — the main submit handler covers 'real'
    if (editingTarget !== 'sim') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const name   = $('eName').value.trim();
    const amount = roundMoney(parseFloat($('eAmount').value));
    if (!name || isNaN(amount) || amount <= 0) return;

    let finalCat = selCat;
    const selectedCatObj = allCats().find(c => c.id === selCat);
    if (selectedCatObj && selectedCatObj.custom) {
        const customName = $('customCatName').value.trim();
        if (!customName) { $('customCatName').focus(); return; }
        const slug = 'custom_' + customName.toLowerCase().replace(/\s+/g,'_');
        const CUSTOM_COLORS=['#a78bfa','#34d399','#fb923c','#38bdf8','#f472b6','#a3e635','#e879f9'];
        if (!customCats.find(c=>c.id===slug)) { customCats.push({id:slug,name:customName,icon:'📦',color:CUSTOM_COLORS[customCats.length%CUSTOM_COLORS.length]}); }
        finalCat = slug;
    }

    const frequency=($('eFrequency').value||'mensuel'), notes=($('eNotes').value.trim());
    const monthly = frequency==='annuel' ? amount/12 : amount;

    if (simEditingId !== null) {
        const exp = simExpenses.find(e=>e.id===simEditingId);
        if (exp) { exp.name=name; exp.cat=finalCat; exp.amount=amount; exp.recurring=isRecurring; exp.frequency=frequency; exp.notes=notes; }
        showToast(`✓ ${name} mis à jour — ${fmt(monthly)}/mois`);
    } else {
        simExpenses.push({id:simNextId++,name,cat:finalCat,amount,recurring:isRecurring,frequency,notes});
        showToast(`✓ ${name} ajouté en simulation — ${fmt(monthly)}/mois`);
    }

    editingTarget = 'real';
    simEditingId  = null;
    closeModal();
    simRender();
}, true); // capture phase so it fires first

// ─── History modal ────────────────────────────────────

$('closeHistoryModal').addEventListener('click', () => $('historyOverlay').classList.remove('open'));
$('historyOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) $('historyOverlay').classList.remove('open'); });

// ─── Recurring filter ─────────────────────────────────

$('recurringFilter').addEventListener('click', () => {
    showRecurringOnly = !showRecurringOnly;
    $('recurringFilter').classList.toggle('active', showRecurringOnly);
    renderExpenses();
});

// ─── Sort dropdown (expenses) ────────────────────────

$('sortBtn').addEventListener('click', e => {
    e.stopPropagation();
    $('sortWrap').classList.toggle('open');
});
document.addEventListener('click', () => $('sortWrap').classList.remove('open'));
$('sortMenu').addEventListener('click', e => e.stopPropagation());
document.querySelectorAll('#sortMenu .sort-item').forEach(btn => {
    btn.addEventListener('click', () => {
        setExpenseSortMode(btn.dataset.sort);
        $('sortWrap').classList.remove('open');
    });
});

const expenseViewIcons = $('expenseViewIcons');
const expenseViewList  = $('expenseViewList');
if (expenseViewIcons) {
    expenseViewIcons.addEventListener('click', () => setExpenseViewMode('icons'));
}
if (expenseViewList) {
    expenseViewList.addEventListener('click', () => setExpenseViewMode('list'));
}

// ─── Month selector ───────────────────────────────────

$('monthTabs').addEventListener('click', e => {
    const tab = e.target.closest('.month-tab');
    if (!tab) return;
    selectedMonth = tab.dataset.month;
    document.querySelectorAll('.month-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $('yearPopover').classList.remove('open');
    $('yearBadge').setAttribute('aria-expanded', 'false');
    renderExpenses();
    updateDonut();
});

// ─── Year badge popover ───────────────────────────────

$('yearBadge').addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = $('yearPopover').classList.toggle('open');
    $('yearBadge').setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

document.addEventListener('click', e => {
    if (!$('yearBadge').contains(e.target) && !$('yearPopover').contains(e.target)) {
        $('yearPopover').classList.remove('open');
        $('yearBadge').setAttribute('aria-expanded', 'false');
    }
});

// ─── Ticker toggle ────────────────────────────────────

$('tickerToggle').addEventListener('click', () => {
    const bar     = $('tickerBar');
    const btn     = $('tickerToggle');
    const hidden  = bar.classList.toggle('hidden');
    btn.textContent = hidden ? '▼' : '▲';
});

// ─── Theme toggle ─────────────────────────────────────

$('themeBtn').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
});

// ─── Export dropdown ──────────────────────────────────

$('exportBtn').addEventListener('click', e => {
    e.stopPropagation();
    $('exportWrap').classList.toggle('open');
});
document.addEventListener('click', () => $('exportWrap').classList.remove('open'));
$('exportMenu').addEventListener('click', e => e.stopPropagation());
$('exportPDFBtn').addEventListener('click', () => { $('exportWrap').classList.remove('open'); exportPDF(); });
$('exportCSVBtn').addEventListener('click', () => { $('exportWrap').classList.remove('open'); exportCSV(); });


// ─── Simulation overlay modal ─────────────────────────

$('closeSimOverlay').addEventListener('click', () => $('simOverlay').classList.remove('open'));
$('simModalCancel').addEventListener('click', () => $('simOverlay').classList.remove('open'));
$('simOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) $('simOverlay').classList.remove('open'); });

$('simModalApply').addEventListener('click', () => {
    if (pendingSimId === null) return;
    simOverrides[pendingSimId] = pendingSimAmt; // null = hidden, obj = override
    $('simOverlay').classList.remove('open');
    activateSimulation();
});

$('simQuitBtn').addEventListener('click', deactivateSimulation);

// ─── Simulation section navigation ───────────────────

const simNavBtn = $('simNavBtn');
if (simNavBtn) {
    simNavBtn.addEventListener('click', () => {
        if ($('simContent').style.display === 'none' || !$('simContent').style.display) openSimSection();
        else closeSimSection();
    });
}

$('simBackBtn').addEventListener('click', closeSimSection);
$('simResetBtn').addEventListener('click', resetSimSection);
$('simAddBtn').addEventListener('click', openSimAddModal);

// ─── Sticky mobile CTA ────────────────────────────────

$('stickyAdd').addEventListener('click', _guardedOpenModal);

// ─── Auth screen ──────────────────────────────────────

$('authOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAuthScreen();
});
$('tabLogin').addEventListener('click', () => {
    _authMode = 'login';
    _authRender();
});
$('tabSignup').addEventListener('click', () => {
    _authMode = 'signup';
    _authRender();
});

// ─── Onboarding wizard ────────────────────────────────

$('onbNextBtn').addEventListener('click', _onbNext);
$('onbBackBtn').addEventListener('click', _onbBack);
$('onbSkipBtn').addEventListener('click', _onbSkip);

// ─── Demo banner ──────────────────────────────────────

$('demoEraseBtn').addEventListener('click', eraseAllData);
$('demoDismissBtn').addEventListener('click', hideDemoBanner);

// ─── Avatar menu (logout + settings) ─────────────────

// Forcer hidden au démarrage (indépendant du CSS/cache)
$('avatarMenu').style.display = 'none';
let _avatarMenuOpen = false;

$('userAvatar').addEventListener('click', e => {
    e.stopPropagation();
    _avatarMenuOpen = !_avatarMenuOpen;
    $('avatarMenu').style.display = _avatarMenuOpen ? 'block' : 'none';
});
document.addEventListener('click', () => {
    _avatarMenuOpen = false;
    $('avatarMenu').style.display = 'none';
});
$('avatarMenu').addEventListener('click', e => e.stopPropagation());
$('logoutBtn').addEventListener('click', async () => {
    _avatarMenuOpen = false;
    $('avatarMenu').style.display = 'none';
    await authSignOut();
    location.href = '/';
});

// ─── Settings modal ───────────────────────────────────

// Forcer hidden au démarrage (indépendant du CSS/cache)
$('settingsOverlay').style.display = 'none';

function _syncAlertToggles() {
    const prefs = loadAlertPrefs();
    const hikeBtn    = $('toggleHikeAlerts');
    const savingsBtn = $('toggleSavingsAlerts');
    if (hikeBtn)    hikeBtn.setAttribute('aria-pressed', prefs.hikeAlertsEnabled ? 'true' : 'false');
    if (savingsBtn) savingsBtn.setAttribute('aria-pressed', prefs.savingsAlertsEnabled ? 'true' : 'false');
}

async function _openSettings() {
    _avatarMenuOpen = false;
    $('avatarMenu').style.display = 'none';
    // Refresh session to get latest user_metadata before pre-filling
    await authGetSession();
    $('sFirstName').value = authUserFirstName() || '';
    $('sLastName').value  = authUserLastName()  || '';
    $('sNewPassword').value = '';
    $('sConfirmPassword').value = '';
    $('settingsNameMsg').textContent = '';
    $('settingsNameMsg').className = 'settings-msg';
    $('settingsPasswordMsg').textContent = '';
    $('settingsPasswordMsg').className = 'settings-msg';
    _syncAlertToggles();
    $('settingsOverlay').style.display = 'flex';
}

function _closeSettings() {
    $('settingsOverlay').style.display = 'none';
}

$('settingsBtn').addEventListener('click', _openSettings);
$('settingsClose').addEventListener('click', _closeSettings);
$('settingsOverlay').addEventListener('click', e => {
    if (e.target === $('settingsOverlay')) _closeSettings();
});

$('toggleHikeAlerts')?.addEventListener('click', () => {
    const prefs = loadAlertPrefs();
    prefs.hikeAlertsEnabled = !prefs.hikeAlertsEnabled;
    saveAlertPrefs(prefs);
    _syncAlertToggles();
    renderExpenses();
});

$('toggleSavingsAlerts')?.addEventListener('click', () => {
    const prefs = loadAlertPrefs();
    prefs.savingsAlertsEnabled = !prefs.savingsAlertsEnabled;
    saveAlertPrefs(prefs);
    _syncAlertToggles();
    renderExpenses();
});

// ─── Budget alerts panel ───────────────────────────────

$('budgetAlertsBtn')?.addEventListener('click', () => {
    _avatarMenuOpen = false;
    $('avatarMenu').style.display = 'none';
    _renderBudgetAlerts();
    $('budgetAlertsOverlay').style.display = 'flex';
});
$('budgetAlertsClose')?.addEventListener('click', () => {
    $('budgetAlertsOverlay').style.display = 'none';
});
$('budgetAlertsOverlay')?.addEventListener('click', e => {
    if (e.target === $('budgetAlertsOverlay')) $('budgetAlertsOverlay').style.display = 'none';
});

// ─── Budget alerts ─────────────────────────────────────

const BUDGET_ALERTS_KEY = 'depensa_budget_alerts';

function _loadBudgetAlerts() {
    try { return JSON.parse(localStorage.getItem(BUDGET_ALERTS_KEY) || '[]'); }
    catch (_) { return []; }
}
function _saveBudgetAlerts(arr) {
    localStorage.setItem(BUDGET_ALERTS_KEY, JSON.stringify(arr));
}

function _renderBudgetAlerts() {
    const list = $('budgetAlertsList');
    if (!list) return;
    const alerts = _loadBudgetAlerts();
    const groups = [
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
    list.innerHTML = alerts.map((a, i) => `
        <div class="budget-alert-row" data-idx="${i}">
            <select class="ba-cat">
                ${groups.map(g => `<option value="${g.key}" ${g.key === a.cat ? 'selected' : ''}>${g.label}</option>`).join('')}
            </select>
            <input type="number" class="ba-amt" value="${a.amount}" min="1" placeholder="$">
            <button type="button" class="budget-alert-del" title="Supprimer">✕</button>
        </div>
    `).join('');

    list.querySelectorAll('.budget-alert-del').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.closest('[data-idx]').dataset.idx);
            const arr = _loadBudgetAlerts();
            arr.splice(idx, 1);
            _saveBudgetAlerts(arr);
            _renderBudgetAlerts();
        });
    });
    list.querySelectorAll('.ba-cat, .ba-amt').forEach(el => {
        el.addEventListener('change', () => {
            const arr = _loadBudgetAlerts();
            list.querySelectorAll('.budget-alert-row').forEach((row, i) => {
                arr[i].cat    = row.querySelector('.ba-cat').value;
                arr[i].amount = parseFloat(row.querySelector('.ba-amt').value) || 0;
            });
            _saveBudgetAlerts(arr);
        });
    });
}

$('addBudgetAlertBtn')?.addEventListener('click', () => {
    const arr = _loadBudgetAlerts();
    arr.push({ cat: 'maison', amount: 0 });
    _saveBudgetAlerts(arr);
    _renderBudgetAlerts();
});

const dismissedBudgetAlertKeys = new Set();

function checkBudgetAlerts() {
    const alerts = _loadBudgetAlerts();
    if (!alerts.length) return;

    const GROUP_BY_CAT_LOCAL = {
        habitation:'maison', electricite:'maison', internet:'maison',
        streaming:'streaming', cell:'cell',
        epicerie:'bouffe', restaurant:'bouffe', cafe:'bouffe',
        auto:'transport', transport:'transport', gaz:'transport',
        pharmacie:'sante', gym:'sante',
        ecole:'famille', garderie:'famille',
        loisir:'loisirs', spectacles:'loisirs', voyage:'loisirs', linge:'loisirs',
    };

    const totals = {};
    expenses.forEach(exp => {
        const g = GROUP_BY_CAT_LOCAL[exp.cat] || 'autres';
        totals[g] = (totals[g] || 0) + effectiveMonthly(exp);
    });

    const container = document.getElementById('budgetAlertBanners');
    if (!container) return;
    container.innerHTML = '';

    const GROUP_LABELS = {
        maison:'Maison', streaming:'Services Streaming', cell:'Cellulaire',
        bouffe:'Bouffe', transport:'Transport & Auto', sante:'Santé & Bien-être',
        famille:'Famille & Éducation', loisirs:'Loisirs', autres:'Autres',
    };

    alerts.forEach(a => {
        const total = totals[a.cat] || 0;
        const key = a.cat;
        if (a.amount > 0 && total > a.amount && !dismissedBudgetAlertKeys.has(key)) {
            const div = document.createElement('div');
            div.className = 'budget-alert-exceeded';
            div.innerHTML = `⚠️ <span><strong>${GROUP_LABELS[a.cat] || a.cat}</strong> : ${fmt(total)} / limite ${fmt(a.amount)}</span><button class="budget-alert-ok-btn">Ok</button>`;
            div.querySelector('.budget-alert-ok-btn').addEventListener('click', () => {
                dismissedBudgetAlertKeys.add(key);
                div.remove();
            });
            container.appendChild(div);
        }
    });
}



$('settingsNameForm').addEventListener('submit', async e => {
    e.preventDefault();
    const firstName = $('sFirstName').value.trim();
    const lastName  = $('sLastName').value.trim();
    if (!firstName) { $('sFirstName').focus(); return; }
    const btn = $('settingsNameBtn');
    const msg = $('settingsNameMsg');
    btn.disabled = true;
    msg.textContent = '';
    msg.className = 'settings-msg';
    try {
        await authUpdateProfile(firstName, lastName);
        // Re-fill fields with confirmed saved values
        $('sFirstName').value = authUserFirstName() || '';
        $('sLastName').value  = authUserLastName()  || '';
        updateHeaderName();
        msg.textContent = 'Nom mis à jour ✓';
        msg.className = 'settings-msg ok';
    } catch (err) {
        msg.textContent = err.message || 'Erreur.';
        msg.className = 'settings-msg err';
    } finally {
        btn.disabled = false;
    }
});

$('settingsPasswordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const pw1 = $('sNewPassword').value;
    const pw2 = $('sConfirmPassword').value;
    const msg = $('settingsPasswordMsg');
    const btn = $('settingsPasswordBtn');
    msg.className = 'settings-msg';
    if (pw1.length < 6) {
        msg.textContent = 'Minimum 6 caractères.';
        msg.className = 'settings-msg err';
        return;
    }
    if (pw1 !== pw2) {
        msg.textContent = 'Les mots de passe ne correspondent pas.';
        msg.className = 'settings-msg err';
        return;
    }
    btn.disabled = true;
    msg.textContent = '';
    try {
        await authUpdatePassword(pw1);
        msg.textContent = 'Mot de passe mis à jour.';
        msg.className = 'settings-msg ok';
        $('sNewPassword').value = '';
        $('sConfirmPassword').value = '';
    } catch (err) {
        msg.textContent = err.message || 'Erreur.';
        msg.className = 'settings-msg err';
    } finally {
        btn.disabled = false;
    }
});

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════

(async () => {
    // Applique le thème sauvegardé (light par défaut)
    initTheme();

    // Initialise le client Supabase (no-op en mode offline)
    dbInit();

    // Charge les prix ISP + Cell + Streaming + Gym en arrière-plan
    loadISPPrices();
    loadCellPrices();
    loadStreamingPrices();
    loadGymPrices();

    // ── Initialise le système de mois (dynamique) ───────
    initMonthSystem();
    buildMonthTabs();

    // ── Mode offline (file://) → dashboard directement ──
    if (DB_OFFLINE) {
        _removeVeil();
        renderExpenses();
        renderRecs();
        renderTicker();
        requestAnimationFrame(() => { initDonut(); initSavings(); });
        scheduleMidnightCheck();
        return;
    }

    // ── Mode cloud → vérifier la session Supabase Auth ──
    const session = await authGetSession();

    if (!session) {
        openAuthScreen(); // _removeVeil() est appelé dans openAuthScreen
        return;
    }

    // Session active → vérifier si l'onboarding est fait
    if (!authHasCompletedOnboarding()) {
        _removeVeil();
        openOnboarding();
        return;
    }

    // Onboarding terminé → charger les données (vider les données démo d'abord)
    expenses = [];
    nextId   = 1;

    // Vider l'historique démo — un utilisateur authentifié n'a pas cet historique fictif
    HISTORY.splice(0);
    Object.keys(MONTH_MAP).forEach(k => delete MONTH_MAP[k]);
    initMonthSystem();
    buildMonthTabs();

    const dbData = await dbBootstrap();
    if (dbData !== null && dbData.length > 0) {
        expenses = dbData;
        nextId   = Math.max(...dbData.map(e => e.id)) + 1;
    } else if (dbData === null) {
        showToast('⚠️ Erreur de chargement des données. Vérifiez votre connexion.');
    }

    // Enregistrer le mois courant si c'est la première connexion
    if (!localStorage.getItem('depensa_live_month')) {
        localStorage.setItem('depensa_live_month', liveMonthKey());
    }
    // Vérifier si le mois a changé depuis la dernière visite
    await checkMonthRollover();

    await billingLoadProfile();
    billingRenderTrialBanner();
    await billingHandleReturn();

    updateHeaderName();
    _removeVeil();
    renderExpenses();
    renderRecs();
    renderTicker();
    requestAnimationFrame(() => { initDonut(); initSavings(); });
    scheduleMidnightCheck();
})();
