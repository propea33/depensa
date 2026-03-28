// ═══════════════════════════════════════════════════════
//  MODAL (add + edit + history + sim)
// ═══════════════════════════════════════════════════════

let isAlerts = true;

function setAlerts(val) {
    isAlerts = val;
    const row = $('alertsToggle').querySelector('.alerts-toggle-row');
    if (row) row.classList.toggle('active', val);
}

// Categories that are inherently one-time (no type/fréquence needed)
const ONE_TIME_CATS = new Set(['epicerie', 'cafe', 'restaurant', 'linge', 'voyage', 'transport', 'gaz']);

// Placeholder personnalisé par catégorie
const CAT_PLACEHOLDERS = {
    habitation:  'ex: Loyer, Hypothèque, Condo…',
    electricite: 'ex: Hydro-Québec, Énergir…',
    internet:    'ex: Vidéotron, Bell, Fizz…',
    cell:        'ex: Telus, Fido, Koodo…',
    auto:        'ex: Honda, Toyota, Assurance auto…',
    epicerie:    'ex: IGA, Maxi, Metro…',
    cafe:        'ex: Starbucks, Tim Hortons…',
    streaming:   'ex: Netflix, Crave, Disney+…',
    pharmacie:   'ex: Jean Coutu, Pharmaprix…',
    spectacles:  'ex: Concert, Théâtre, Festival…',
    ecole:       'ex: Frais de scolarité, Matériel…',
    garderie:    'ex: CPE, Garderie privée…',
    gaz:         'ex: Petro-Canada, Shell, Ultramar…',
    transport:   'ex: Uber, Taxi, STM…',
    assurance:   'ex: Intact, Desjardins, Belair…',
    gym:         'ex: Éconofitness, YMCA…',
    loisir:      'ex: Cinéma, Activité sportive…',
    restaurant:  'ex: Restaurant, Livraison…',
    linge:       'ex: Vêtements, Chaussures…',
    voyage:      'ex: Billet d\'avion, Hôtel…',
    autre:       'ex: Nom de votre dépense…',
};

// ─── Sélecteur de fournisseur ──────────────────────────────────────────────

function showProviderPicker(catId) {
    const picker    = $('providerPicker');
    const nameLabel = $('eNameLabel');
    if (!picker) return;

    const presets = PROVIDER_PRESETS[catId];
    if (!presets) {
        picker.style.display = 'none';
        if (nameLabel) nameLabel.textContent = 'Nom de la dépense';
        return;
    }

    picker.style.display = '';
    if (nameLabel) nameLabel.textContent = 'Fournisseur';

    const currentName = ($('eName').value || '').trim();

    picker.innerHTML = `
        <div class="provider-grid">
            ${presets.map(p => {
                const isSel = p.name === currentName;
                const isOther = !p.domain;
                const logo = isOther
                    ? `<span class="provider-other-icon">✏️</span>`
                    : `<img src="https://www.google.com/s2/favicons?domain=${p.domain}&sz=64"
                              class="provider-logo" alt="${p.name}"
                              onerror="this.outerHTML='<span class=provider-other-icon>📦</span>'">`;
                return `<button type="button"
                                class="provider-btn${isSel ? ' sel' : ''}"
                                data-name="${p.name}">
                            <div class="provider-logo-wrap">${logo}</div>
                            <span class="provider-name">${p.name}</span>
                        </button>`;
            }).join('')}
        </div>`;

    // Auto-remplissage si une seule option réelle (ex: Électricité → Hydro-Québec)
    const realPresets = presets.filter(p => p.domain);
    if (realPresets.length === 1 && !currentName) {
        $('eName').value = realPresets[0].name;
        picker.querySelector(`[data-name="${realPresets[0].name}"]`)?.classList.add('sel');
        refreshIconPreview();
    }

    picker.querySelectorAll('.provider-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            picker.querySelectorAll('.provider-btn').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
            const name = btn.dataset.name;
            if (name === 'Autre') {
                $('eName').value = '';
                $('eName').focus();
            } else {
                $('eName').value = name;
                $('eAmount').focus();
            }
            refreshIconPreview();
        });
    });
}

function buildCatGrid() {
    const grid = $('catGrid');
    grid.innerHTML = '';
    allCats().forEach(cat => {
        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'cat-btn' + (cat.id === selCat ? ' sel' : '');
        btn.innerHTML = `<span class="cat-btn-icon">${cat.icon}</span><span class="cat-btn-name">${cat.name}</span>`;
        btn.addEventListener('click', () => {
            selCat = cat.id;
            grid.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
            updateFormForCat(cat.id);
            showProviderPicker(cat.id);
            refreshIconPreview();
            // Show/hide custom name input
            const wrap = $('customCatWrap');
            if (cat.custom) {
                wrap.classList.add('visible');
                $('customCatName').focus();
            } else {
                wrap.classList.remove('visible');
            }
        });
        grid.appendChild(btn);
    });
    // Sync custom field visibility on open
    const selectedCat = allCats().find(c => c.id === selCat);
    $('customCatWrap').classList.toggle('visible', !!(selectedCat && selectedCat.custom));
}

function updateFormForCat(catId) {
    const isOneTime = ONE_TIME_CATS.has(catId);
    // Placeholder personnalisé
    const ph = CAT_PLACEHOLDERS[catId] || 'ex: Nom de la dépense…';
    $('eName').placeholder = ph;

    $('typeFreqGroup').style.display = isOneTime ? 'none' : '';
    $('amountLabel').textContent = isOneTime
        ? 'Montant ($)'
        : ($('eFrequency').value === 'annuel' ? 'Montant annuel ($)' : 'Montant mensuel ($)');
    if (isOneTime) {
        setRecurring(false);
        $('recurringToggle').style.display = 'none';
    } else {
        $('recurringToggle').style.display = '';
    }
}

function setRecurring(val) {
    isRecurring = val;
    const row = $('recurringToggle').querySelector('.recurring-toggle-row');
    if (row) row.classList.toggle('active', val);
    $('alertsToggle').style.display = val ? 'none' : '';
}

function updateAmountLabel() {
    if (ONE_TIME_CATS.has(selCat)) return; // label stays "Montant ($)"
    const isAnnual = $('eFrequency').value === 'annuel';
    $('amountLabel').textContent = isAnnual ? 'Montant annuel ($)' : 'Montant mensuel ($)';
    const amount = parseFloat($('eAmount').value) || 0;
    const hint = $('amountHint');
    if (isAnnual && amount > 0) {
        hint.textContent = `≈ ${fmt(amount / 12)}/mois`;
        hint.classList.add('visible');
    } else {
        hint.classList.remove('visible');
    }
}

function openAddModal() {
    editingId = null;
    selCat = 'habitation';
    $('expenseForm').reset();
    $('modal-title').textContent  = 'Ajouter une dépense';
    $('modal-submit').textContent = 'Ajouter ✓';
    setRecurring(false);
    setAlerts(true);
    $('eFrequency').value = 'mensuel';
    $('amountHint').classList.remove('visible');
    buildCatGrid();
    updateFormForCat(selCat);
    showProviderPicker(selCat);
    $('modalOverlay').classList.add('open');
    setTimeout(() => {
        refreshIconPreview();
        // Focus sur le montant si un fournisseur est déjà pré-sélectionné
        if ($('eName').value) $('eAmount').focus();
        else $('eName').focus();
    }, 120);
}

function openEditModal(id) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;
    editingId = id;
    selCat = exp.cat;
    $('modal-title').textContent  = 'Modifier la dépense';
    $('modal-submit').textContent = 'Enregistrer ✓';
    setRecurring(exp.recurring ?? false);
    setAlerts(exp.alerts !== false);
    $('eFrequency').value = exp.frequency || 'mensuel';
    $('eNotes').value     = exp.notes     || '';
    buildCatGrid();
    $('eName').value   = exp.name;
    $('eAmount').value = exp.amount;
    updateFormForCat(exp.cat);
    updateAmountLabel();
    showProviderPicker(exp.cat);
    $('modalOverlay').classList.add('open');
    setTimeout(() => { $('eName').focus(); refreshIconPreview(); }, 120);
}

function closeModal() {
    $('modalOverlay').classList.remove('open');
    $('expenseForm').reset();
    $('customCatWrap').classList.remove('visible');
    $('typeFreqGroup').style.display = '';
    $('recurringToggle').style.display = '';
    editingId = null;
    simEditingId = null;
    editingTarget = 'real';
    selCat = 'habitation';
}

// ─── HISTORY MODAL ────────────────────────────────────────────

function openHistoryModal(monthLabel, expList) {
    $('historyModalTitle').textContent = 'Dépenses — ' + monthLabel;

    const total = expList.reduce((s, e) => s + e.amount, 0);

    const rows = expList.map(exp => {
        const cat = getCAT(exp.cat);
        return `
            <tr>
                <td><div class="td-icon" style="background:${cat.color}1a">${getExpenseIconHTML(exp.name, exp.cat)}</div></td>
                <td>${exp.name}</td>
                <td><span class="td-amount">${fmt(exp.amount)}</span><br><span class="td-yearly">${fmt(exp.amount * 12)}/an</span></td>
            </tr>
        `;
    }).join('');

    $('historyTableWrap').innerHTML = `
        <div style="max-height:400px;overflow-y:auto;scrollbar-width:thin;">
            <table class="history-table">
                <thead>
                    <tr>
                        <th style="width:44px;"></th>
                        <th>Dépense</th>
                        <th>Montant</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="2">Total mensuel</td>
                        <td>${fmt(total)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    $('historyOverlay').classList.add('open');
}

// ─── SIMULATION MODAL ─────────────────────────────────────────

function openSimModal(expId) {
    const exp = expenses.find(e => e.id === expId);
    if (!exp) return;
    pendingSimId = expId;

    const monthly = monthlyAmount(exp);
    const simVal  = simOverrides[expId] !== undefined && simOverrides[expId] !== null
        ? simOverrides[expId].amount
        : exp.amount;

    $('simModalBody').innerHTML = `
        <p style="font-size:13px;color:var(--text-2);margin-bottom:14px;">
            Testez virtuellement une modification de <strong style="color:var(--text)">${exp.name}</strong> sans changer vos données réelles.
        </p>
        <div class="form-group">
            <label class="form-label">Nouveau montant simulé</label>
            <div style="display:flex;gap:10px;align-items:center;">
                <input id="simAmountInput" class="form-input" type="number" value="${simVal}" step="0.01" min="0" style="flex:1">
                <select id="simFreqInput" class="form-input" style="width:130px;">
                    <option value="mensuel" ${(exp.frequency||'mensuel')==='mensuel'?'selected':''}>Mensuel</option>
                    <option value="annuel"  ${exp.frequency==='annuel'?'selected':''}>Annuel</option>
                </select>
            </div>
        </div>
        <div class="form-group" style="margin-bottom:0">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-2);cursor:pointer;">
                <input type="checkbox" id="simHideCheck" style="width:16px;height:16px;accent-color:var(--accent)">
                Masquer cette dépense dans la simulation
            </label>
        </div>
        <div class="sim-preview" id="simPreview">
            <div>
                <div class="sim-preview-label">Actuel</div>
                <div class="sim-preview-val">${fmt(monthly)}<span style="font-size:11px;font-weight:400">/mois</span></div>
            </div>
            <div class="sim-preview-arrow">→</div>
            <div id="simPreviewRight">
                <div class="sim-preview-label">Simulé</div>
                <div class="sim-preview-val" id="simPreviewVal">${fmt(simVal)}<span style="font-size:11px;font-weight:400">/mois</span></div>
                <div class="sim-preview-saving" id="simPreviewSaving"></div>
            </div>
        </div>
    `;

    function updateSimPreview() {
        const hidden = $('simHideCheck').checked;
        const newAmt = hidden ? 0 : (parseFloat($('simAmountInput').value) || 0);
        const newFreq = $('simFreqInput').value;
        const newMonthly = newFreq === 'annuel' ? newAmt / 12 : newAmt;
        const diff = monthly - newMonthly;
        $('simPreviewVal').innerHTML = hidden
            ? `<span style="color:var(--text-3);text-decoration:line-through">${fmt(monthly)}</span><br><span style="font-size:11px;color:var(--amber)">Masqué</span>`
            : `${fmt(newMonthly)}<span style="font-size:11px;font-weight:400">/mois</span>`;
        $('simPreviewSaving').textContent = diff > 0 ? `-${fmt(diff)}/mois` : diff < 0 ? `+${fmt(-diff)}/mois` : '';
        $('simPreviewSaving').style.color = diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : '';
        pendingSimAmt = hidden ? null : { amount: newAmt, frequency: newFreq };
    }

    $('simAmountInput').addEventListener('input', updateSimPreview);
    $('simFreqInput').addEventListener('change', updateSimPreview);
    $('simHideCheck').addEventListener('change', () => {
        $('simAmountInput').disabled = $('simHideCheck').checked;
        $('simFreqInput').disabled   = $('simHideCheck').checked;
        updateSimPreview();
    });
    updateSimPreview();

    $('simOverlay').classList.add('open');
}

// ── Sim modal (reuse existing modal, target = sim) ─────

function openSimAddModal() {
    editingTarget = 'sim';
    simEditingId  = null;
    selCat = 'habitation';
    $('expenseForm').reset();
    $('modal-title').textContent  = '🔬 Ajouter (simulation)';
    $('modal-submit').textContent = 'Ajouter ✓';
    setRecurring(true);
    $('eFrequency').value = 'mensuel';
    $('amountHint').classList.remove('visible');
    buildCatGrid();
    $('modalOverlay').classList.add('open');
    setTimeout(() => $('eName').focus(), 120);
}

function openSimEditModal(id) {
    const exp = simExpenses.find(e => e.id === id);
    if (!exp) return;
    editingTarget = 'sim';
    simEditingId  = id;
    selCat = exp.cat;
    $('modal-title').textContent  = '🔬 Modifier (simulation)';
    $('modal-submit').textContent = 'Enregistrer ✓';
    setRecurring(exp.recurring ?? false);
    $('eFrequency').value = exp.frequency || 'mensuel';
    $('eNotes').value     = exp.notes     || '';
    buildCatGrid();
    $('eName').value   = exp.name;
    $('eAmount').value = exp.amount;
    updateAmountLabel();
    $('modalOverlay').classList.add('open');
    setTimeout(() => $('eName').focus(), 120);
}
