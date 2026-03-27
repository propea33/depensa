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
        if (exp) { exp.name = name; exp.cat = finalCat; exp.amount = amount; exp.recurring = isRecurring; exp.frequency = frequency; exp.notes = notes; }
        showToast(`✓ ${name} mis à jour — ${fmt(monthly)}/mois`);
    } else {
        expenses.push({ id: nextId++, name, cat: finalCat, amount, recurring: isRecurring, frequency, notes });
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

document.querySelectorAll('.month-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        selectedMonth = tab.dataset.month;
        document.querySelectorAll('.month-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderExpenses();
        updateDonut();
    });
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

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════

renderExpenses();
renderRecs();
renderTicker();

requestAnimationFrame(() => {
    initDonut();
    initSavings();
});

// Charge les prix ISP + Cell depuis le scraper GitHub (async, non-bloquant)
loadISPPrices();
loadCellPrices();
