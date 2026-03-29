// ═══════════════════════════════════════════════════════
//  MAIN — Event listeners & bootstrap
// ═══════════════════════════════════════════════════════

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

$('openModal').addEventListener('click', openAddModal);
$('closeModal').addEventListener('click', closeModal);
$('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

$('expenseForm').addEventListener('submit', e => {
    e.preventDefault();
    const name   = $('eName').value.trim();
    const amount = parseFloat($('eAmount').value);
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
    const amount = parseFloat($('eAmount').value);
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
    const html  = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    $('toggleKnob').textContent = isDark ? '☀️' : '🌙';
    updateSavingsChartColors();
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

$('simNavBtn').addEventListener('click', () => {
    if ($('simContent').style.display === 'none' || !$('simContent').style.display) openSimSection();
    else closeSimSection();
});

$('simBackBtn').addEventListener('click', closeSimSection);
$('simResetBtn').addEventListener('click', resetSimSection);
$('simAddBtn').addEventListener('click', openSimAddModal);

// ─── Sticky mobile CTA ────────────────────────────────

$('stickyAdd').addEventListener('click', openAddModal);

// ─── Auth screen ──────────────────────────────────────

$('tabLogin').addEventListener('click', () => {
    _authMode = 'login';
    _authRender();
});
$('tabSignup').addEventListener('click', () => {
    _authMode = 'signup';
    _authRender();
});
$('authSkipBtn').addEventListener('click', async () => {
    closeAuthScreen();
    // Pas de compte → données démo en mémoire + bannière
    showDemoBanner();
    renderExpenses();
    renderRecs();
    renderTicker();
    requestAnimationFrame(() => { initDonut(); initSavings(); });
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
    location.reload();
});

// ─── Settings modal ───────────────────────────────────

// Forcer hidden au démarrage (indépendant du CSS/cache)
$('settingsOverlay').style.display = 'none';

function _openSettings() {
    _avatarMenuOpen = false;
    $('avatarMenu').style.display = 'none';
    $('sFirstName').value = authUserFirstName() || '';
    $('sLastName').value  = authUserLastName()  || '';
    $('sNewPassword').value = '';
    $('sConfirmPassword').value = '';
    $('settingsNameMsg').textContent = '';
    $('settingsNameMsg').className = 'settings-msg';
    $('settingsPasswordMsg').textContent = '';
    $('settingsPasswordMsg').className = 'settings-msg';
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
        updateHeaderName();
        msg.textContent = 'Nom mis à jour.';
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
    // Initialise le client Supabase (no-op en mode offline)
    dbInit();

    // Charge les prix ISP + Cell en arrière-plan
    loadISPPrices();
    loadCellPrices();

    // ── Initialise le système de mois (dynamique) ───────
    initMonthSystem();
    buildMonthTabs();

    // ── Mode offline (file://) → dashboard directement ──
    if (DB_OFFLINE) {
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
        openAuthScreen();
        return;
    }

    // Session active → vérifier si l'onboarding est fait
    if (!authHasCompletedOnboarding()) {
        openOnboarding();
        return;
    }

    // Onboarding terminé → charger les données
    const dbData = await dbBootstrap();
    if (dbData !== null && dbData.length > 0) {
        expenses = dbData;
        nextId   = Math.max(...dbData.map(e => e.id)) + 1;
    }

    // Enregistrer le mois courant si c'est la première connexion
    if (!localStorage.getItem('depensa_live_month')) {
        localStorage.setItem('depensa_live_month', liveMonthKey());
    }
    // Vérifier si le mois a changé depuis la dernière visite
    await checkMonthRollover();

    updateHeaderName();
    renderExpenses();
    renderRecs();
    renderTicker();
    requestAnimationFrame(() => { initDonut(); initSavings(); });
    scheduleMidnightCheck();
})();
