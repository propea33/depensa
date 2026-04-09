// ═══════════════════════════════════════════════════════
//  ONBOARDING — Assistant de configuration (8 étapes)
// ═══════════════════════════════════════════════════════

// ── État de l'onboarding ──────────────────────────────────────────────────────

const ONB_TOTAL_STEPS = 8;

let _onbStep = 1;
let _onbData = {
    firstName: '',
    lastName:  '',
    housing:   { type: null,  amount: null  }, // 'loyer' | 'hypotheque'
    transport: { mode: null,  brand: null, amount: null }, // 'auto' | 'transit' | 'actif'
    studies:   { has: null,   amount: null  }, // true | false
    internet:  { provider: null, amount: null },
    cell:      { provider: null, amount: null },
    streaming: [], // [{ name, amount, domain }]
};

// Marques auto avec leurs domaines favicon
const AUTO_BRANDS = [
    { name:'Toyota',     domain:'toyota.com'      },
    { name:'Honda',      domain:'honda.com'        },
    { name:'Ford',       domain:'ford.com'         },
    { name:'Hyundai',    domain:'hyundai.com'      },
    { name:'Kia',        domain:'kia.com'          },
    { name:'Mazda',      domain:'mazda.com'        },
    { name:'Nissan',     domain:'nissan.com'       },
    { name:'Chevrolet',  domain:'chevrolet.com'    },
    { name:'Volkswagen', domain:'volkswagen.com'   },
    { name:'Subaru',     domain:'subaru.com'       },
    { name:'Tesla',      domain:'tesla.com'        },
    { name:'BMW',        domain:'bmw.com'          },
    { name:'Mercedes',   domain:'mercedes-benz.com'},
    { name:'Audi',       domain:'audi.com'         },
    { name:'Jeep',       domain:'jeep.com'         },
    { name:'Autre',      domain: null              },
];

// Services streaming pour l'onboarding
const ONB_STREAMING = [
    { name:'Netflix',             domain:'netflix.com',        suggested: 23 },
    { name:'Crave',               domain:'crave.ca',           suggested: 20 },
    { name:'Disney+',             domain:'disneyplus.com',     suggested: 14 },
    { name:'Amazon Prime Video',  domain:'primevideo.com',     suggested: 10 },
    { name:'Apple TV+',           domain:'tv.apple.com',       suggested: 10 },
    { name:'Illico+',             domain:'clubillico.com',     suggested: 12 },
    { name:'Tou.tv',              domain:'tou.tv',             suggested: 8  },
    { name:'Paramount+',          domain:'paramountplus.com',  suggested: 9  },
    { name:'Spotify',             domain:'spotify.com',        suggested: 11 },
    { name:'Apple Music',         domain:'music.apple.com',    suggested: 11 },
    { name:'BritBox',             domain:'britbox.com',        suggested: 9  },
    { name:'Kanopy',              domain:'kanopy.com',         suggested: 0  },
];

// ── Fonctions d'entrée ────────────────────────────────────────────────────────

function openOnboarding() {
    _onbStep = 1;
    _onbData = {
        firstName: '',
        lastName:  '',
        housing:   { type: null,  amount: null },
        transport: { mode: null,  brand: null, amount: null },
        studies:   { has: null,   amount: null },
        internet:  { provider: null, amount: null },
        cell:      { provider: null, amount: null },
        streaming: [],
    };
    const overlay = document.getElementById('onboardingOverlay');
    overlay.classList.add('open');
    _onbRender();
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
}

function closeOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    overlay.classList.remove('visible');
    setTimeout(() => overlay.classList.remove('open'), 300);
}

// ── Rendu principal ───────────────────────────────────────────────────────────

function _onbRender() {
    // Progress bar
    const pct = ((_onbStep - 1) / ONB_TOTAL_STEPS) * 100;
    document.getElementById('onbProgressBar').style.width = pct + '%';

    // Corps
    const body = document.getElementById('onbBody');
    body.innerHTML = _onbStepHTML(_onbStep);
    body.classList.remove('onb-fade');
    void body.offsetWidth; // force reflow
    body.classList.add('onb-fade');

    // Footer: bouton retour
    const backBtn = document.getElementById('onbBackBtn');
    backBtn.style.display = _onbStep > 1 ? '' : 'none';

    // Label bouton suivant
    const nextBtn = document.getElementById('onbNextBtn');
    nextBtn.textContent = _onbStep === ONB_TOTAL_STEPS ? 'Créer mon profil ✓' : 'Continuer →';

    // Attacher les listeners après injection
    _onbBindStep(_onbStep);
}

// ── HTML par étape ────────────────────────────────────────────────────────────

function _onbStepHTML(step) {
    switch (step) {

    // ─── Étape 1 : Prénom + Nom ──────────────────────────────────────────────
    case 1: return `
        <div class="onb-step-label">Étape 1 / ${ONB_TOTAL_STEPS}</div>
        <div class="onb-title">Bienvenue dans Depensa! 👋</div>
        <div class="onb-subtitle">Commençons par nous présenter. Comment vous appelez-vous?</div>
        <div style="display:flex;gap:12px;margin-bottom:4px;">
            <div style="flex:1;">
                <div style="font-size:12px;color:var(--text-2);font-weight:500;margin-bottom:7px;">Prénom</div>
                <input
                    id="onbFirstName"
                    class="onb-input"
                    type="text"
                    placeholder="Prénom"
                    maxlength="40"
                    autocomplete="given-name"
                    value="${_esc(_onbData.firstName)}"
                >
            </div>
            <div style="flex:1;">
                <div style="font-size:12px;color:var(--text-2);font-weight:500;margin-bottom:7px;">Nom de famille</div>
                <input
                    id="onbLastName"
                    class="onb-input"
                    type="text"
                    placeholder="Nom de famille"
                    maxlength="60"
                    autocomplete="family-name"
                    value="${_esc(_onbData.lastName)}"
                >
            </div>
        </div>
    `;

    // ─── Étape 2 : Logement ──────────────────────────────────────────────────
    case 2: return `
        <div class="onb-step-label">Étape 2 / ${ONB_TOTAL_STEPS}</div>
        <div class="onb-title">Votre logement 🏠</div>
        <div class="onb-subtitle">Quel type de logement avez-vous et quel est votre coût mensuel?</div>
        <div class="onb-choice-grid">
            <button type="button" class="onb-choice-btn${_onbData.housing.type==='loyer'?' sel':''}" data-choice="loyer">
                <span class="onb-choice-icon">${catIconSVG('habitation', 30)}</span>
                <span class="onb-choice-label">Loyer</span>
                <span class="onb-choice-sub">Appartement ou maison en location</span>
            </button>
            <button type="button" class="onb-choice-btn${_onbData.housing.type==='hypotheque'?' sel':''}" data-choice="hypotheque">
                <span class="onb-choice-icon"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/><path d="M12 7v2"/></svg></span>
                <span class="onb-choice-label">Hypothèque</span>
                <span class="onb-choice-sub">Propriétaire avec paiements mensuels</span>
            </button>
        </div>
        ${_onbData.housing.type ? `
        <div class="onb-subsection">
            <div class="onb-subsection-label">Montant mensuel ($)</div>
            <div class="onb-amount-row">
                <span class="onb-amount-prefix">$</span>
                <input
                    id="onbHousingAmt"
                    class="onb-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value="${_onbData.housing.amount || ''}"
                >
            </div>
        </div>
        ` : ''}
    `;

    // ─── Étape 3 : Transport ─────────────────────────────────────────────────
    case 3: return `
        <div class="onb-step-label">Étape 3 / ${ONB_TOTAL_STEPS}</div>
        <div class="onb-title">Votre transport 🚗</div>
        <div class="onb-subtitle">Quel est votre mode de déplacement principal?</div>
        <div class="onb-choice-grid cols-3">
            <button type="button" class="onb-choice-btn${_onbData.transport.mode==='auto'?' sel':''}" data-choice="auto">
                <span class="onb-choice-icon">${catIconSVG('auto', 30)}</span>
                <span class="onb-choice-label">Auto</span>
                <span class="onb-choice-sub">Voiture personnelle</span>
            </button>
            <button type="button" class="onb-choice-btn${_onbData.transport.mode==='transit'?' sel':''}" data-choice="transit">
                <span class="onb-choice-icon">${catIconSVG('transport', 30)}</span>
                <span class="onb-choice-label">Transport en commun</span>
                <span class="onb-choice-sub">STM, exo, RTC…</span>
            </button>
            <button type="button" class="onb-choice-btn${_onbData.transport.mode==='actif'?' sel':''}" data-choice="actif">
                <span class="onb-choice-icon"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 14l3-3 2 3h4"/><path d="m12 14-2-4.5 4.5-1"/></svg></span>
                <span class="onb-choice-label">Vélo / Marche</span>
                <span class="onb-choice-sub">Transport actif, aucun coût</span>
            </button>
        </div>
        ${_onbData.transport.mode === 'auto' ? `
        <div class="onb-subsection">
            <div class="onb-subsection-label">Quelle marque de véhicule?</div>
            <div class="onb-brand-grid" id="onbBrandGrid">
                ${AUTO_BRANDS.map(b => `
                    <button type="button"
                        class="onb-brand-btn${_onbData.transport.brand===b.name?' sel':''}"
                        data-brand="${b.name}">
                        ${b.domain
                            ? `<img src="https://www.google.com/s2/favicons?domain=${b.domain}&sz=64" alt="${b.name}" onerror="this.style.display='none'">`
                            : `<span style="font-size:18px">✏️</span>`}
                        <span>${b.name}</span>
                    </button>
                `).join('')}
            </div>
            <div class="onb-subsection-label">Coût mensuel d'assurance auto ($)</div>
            <div class="onb-amount-row">
                <span class="onb-amount-prefix">$</span>
                <input
                    id="onbAutoAmt"
                    class="onb-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value="${_onbData.transport.amount || ''}"
                >
            </div>
        </div>
        ` : _onbData.transport.mode === 'transit' ? `
        <div class="onb-subsection">
            <div class="onb-subsection-label">Coût mensuel de l'abonnement ($)</div>
            <div class="onb-amount-row">
                <span class="onb-amount-prefix">$</span>
                <input
                    id="onbTransitAmt"
                    class="onb-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value="${_onbData.transport.amount || ''}"
                >
            </div>
            <div class="onb-amount-label">STM = ~$100/mois · exo mensuel · RTC = ~$90/mois</div>
        </div>
        ` : ''}
    `;

    // ─── Étape 4 : Études ────────────────────────────────────────────────────
    case 4: return `
        <div class="onb-step-label">Étape 4 / ${ONB_TOTAL_STEPS}</div>
        <div class="onb-title">Êtes-vous aux études? 🎓</div>
        <div class="onb-subtitle">Frais de scolarité, matériel, livres scolaires…</div>
        <div class="onb-yesno">
            <button type="button" class="onb-yn-btn${_onbData.studies.has===true?' sel':''}" data-yn="true">
                ✅
                <span class="onb-yn-sub">Oui, j'ai des frais</span>
            </button>
            <button type="button" class="onb-yn-btn${_onbData.studies.has===false?' sel':''}" data-yn="false">
                ❌
                <span class="onb-yn-sub">Non, pas aux études</span>
            </button>
        </div>
        ${_onbData.studies.has === true ? `
        <div class="onb-subsection">
            <div class="onb-subsection-label">Coût mensuel estimé ($)</div>
            <div class="onb-amount-row">
                <span class="onb-amount-prefix">$</span>
                <input
                    id="onbStudiesAmt"
                    class="onb-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value="${_onbData.studies.amount || ''}"
                >
            </div>
        </div>
        ` : ''}
    `;

    // ─── Étape 5 : Internet ──────────────────────────────────────────────────
    case 5: return `
        <div class="onb-step-label">Étape 5 / ${ONB_TOTAL_STEPS}</div>
        <div class="onb-title">Votre forfait Internet 🌐</div>
        <div class="onb-subtitle">Quel est votre fournisseur Internet à la maison?</div>
        <div class="onb-provider-grid" id="onbInternetGrid">
            ${PROVIDER_PRESETS.internet.map(p => `
                <button type="button"
                    class="onb-provider-btn${_onbData.internet.provider===p.name?' sel':''}"
                    data-name="${p.name}">
                    ${p.domain
                        ? `<img src="https://www.google.com/s2/favicons?domain=${p.domain}&sz=64" alt="${p.name}" onerror="this.outerHTML='<span style=font-size:22px>🌐</span>'">`
                        : `<span style="font-size:20px">✏️</span>`}
                    <span>${p.name}</span>
                </button>
            `).join('')}
            <button type="button"
                class="onb-provider-btn${_onbData.internet.provider==='aucun'?' sel':''}"
                data-name="aucun">
                <span style="font-size:20px">🚫</span>
                <span>Pas d'Internet</span>
            </button>
        </div>
        ${_onbData.internet.provider && _onbData.internet.provider !== 'Autre' ? `
        <div class="onb-subsection">
            <div class="onb-subsection-label">Montant mensuel ($)</div>
            <div class="onb-amount-row">
                <span class="onb-amount-prefix">$</span>
                <input
                    id="onbInternetAmt"
                    class="onb-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value="${_onbData.internet.amount || ''}"
                >
            </div>
        </div>
        ` : _onbData.internet.provider === 'Autre' ? `
        <div class="onb-subsection">
            <div class="onb-subsection-label">Nom de votre fournisseur</div>
            <input id="onbInternetOther" class="onb-input" type="text" placeholder="Nom du fournisseur…"
                value="${_esc(_onbData.internet._custom||'')}">
            <div class="onb-subsection-label" style="margin-top:14px;">Montant mensuel ($)</div>
            <div class="onb-amount-row">
                <span class="onb-amount-prefix">$</span>
                <input
                    id="onbInternetAmt"
                    class="onb-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value="${_onbData.internet.amount || ''}"
                >
            </div>
        </div>
        ` : ''}
    `;

    // ─── Étape 6 : Cellulaire ────────────────────────────────────────────────
    case 6: return `
        <div class="onb-step-label">Étape 6 / ${ONB_TOTAL_STEPS}</div>
        <div class="onb-title">Votre cellulaire 📱</div>
        <div class="onb-subtitle">Quel est votre opérateur mobile?</div>
        <div class="onb-provider-grid" id="onbCellGrid">
            ${PROVIDER_PRESETS.cell.map(p => `
                <button type="button"
                    class="onb-provider-btn${_onbData.cell.provider===p.name?' sel':''}"
                    data-name="${p.name}">
                    ${p.domain
                        ? `<img src="https://www.google.com/s2/favicons?domain=${p.domain}&sz=64" alt="${p.name}" onerror="this.outerHTML='<span style=font-size:22px>📱</span>'">`
                        : `<span style="font-size:20px">✏️</span>`}
                    <span>${p.name}</span>
                </button>
            `).join('')}
            <button type="button"
                class="onb-provider-btn${_onbData.cell.provider==='aucun'?' sel':''}"
                data-name="aucun">
                <span style="font-size:20px">🚫</span>
                <span>Pas de cellulaire</span>
            </button>
        </div>
        ${_onbData.cell.provider && _onbData.cell.provider !== 'Autre' ? `
        <div class="onb-subsection">
            <div class="onb-subsection-label">Montant mensuel ($)</div>
            <div class="onb-amount-row">
                <span class="onb-amount-prefix">$</span>
                <input
                    id="onbCellAmt"
                    class="onb-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value="${_onbData.cell.amount || ''}"
                >
            </div>
        </div>
        ` : _onbData.cell.provider === 'Autre' ? `
        <div class="onb-subsection">
            <div class="onb-subsection-label">Nom de votre opérateur</div>
            <input id="onbCellOther" class="onb-input" type="text" placeholder="Nom de l'opérateur…"
                value="${_esc(_onbData.cell._custom||'')}">
            <div class="onb-subsection-label" style="margin-top:14px;">Montant mensuel ($)</div>
            <div class="onb-amount-row">
                <span class="onb-amount-prefix">$</span>
                <input
                    id="onbCellAmt"
                    class="onb-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value="${_onbData.cell.amount || ''}"
                >
            </div>
        </div>
        ` : ''}
    `;

    // ─── Étape 7 : Streaming ─────────────────────────────────────────────────
    case 7: return `
        <div class="onb-step-label">Étape 7 / ${ONB_TOTAL_STEPS}</div>
        <div class="onb-title">Vos abonnements streaming 📺</div>
        <div class="onb-subtitle">Sélectionnez les services actifs et entrez le montant mensuel.</div>
        <div class="onb-stream-list" id="onbStreamList">
            ${ONB_STREAMING.map(s => {
                const sel = _onbData.streaming.find(x => x.name === s.name);
                const amt = sel ? sel.amount : s.suggested;
                return `
                <div class="onb-stream-item${sel?' sel':''}" data-name="${s.name}" data-domain="${s.domain||''}" data-default="${s.suggested}">
                    <div class="onb-stream-check"></div>
                    <img class="onb-stream-logo"
                        src="https://www.google.com/s2/favicons?domain=${s.domain}&sz=64"
                        alt="${s.name}"
                        onerror="this.style.display='none'">
                    <span class="onb-stream-name">${s.name}</span>
                    <div class="onb-stream-amount-wrap">
                        <span class="onb-stream-dollar">$</span>
                        <input type="number" class="onb-stream-amount" step="0.01" min="0"
                            placeholder="0"
                            value="${sel ? sel.amount : (s.suggested || '')}"
                            onclick="event.stopPropagation()">
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;

    // ─── Étape 8 : Récapitulatif ─────────────────────────────────────────────
    case 8:
        const items = _onbBuildExpenses();
        const total = items.reduce((s, e) =>
            s + (e.frequency === 'annuel' ? e.amount / 12 : e.amount), 0);
        return `
        <div class="onb-step-label">Étape 8 / ${ONB_TOTAL_STEPS}</div>
        <div class="onb-title">Votre profil de dépenses ✓</div>
        <div class="onb-subtitle">Voici ce que nous allons créer dans votre tableau de bord.</div>
        <div class="onb-summary-list">
            ${items.map(e => {
                const cat = CATS.find(c => c.id === e.cat) || { color:'#64748b', icon:'📦' };
                return `
                <div class="onb-summary-item">
                    <div class="onb-summary-icon" style="background:${cat.color}22;">${catIconSVG(cat.id, 22, cat.color)}</div>
                    <div>
                        <div class="onb-summary-name">${_esc(e.name)}</div>
                        <div class="onb-summary-cat">${cat.name}${e.frequency==='annuel'?' · annuel':''}</div>
                    </div>
                    <div class="onb-summary-amt">${fmt(e.frequency==='annuel' ? e.amount/12 : e.amount)}/mois</div>
                </div>
                `;
            }).join('')}
        </div>
        <div class="onb-summary-total">
            <span>Total mensuel estimé</span>
            <span>${fmt(total)}/mois</span>
        </div>
        `;

    default: return '';
    }
}

// ── Liaison des events par étape ──────────────────────────────────────────────

function _onbBindStep(step) {
    switch (step) {

    case 1:
        document.getElementById('onbFirstName')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); document.getElementById('onbLastName')?.focus(); }
        });
        document.getElementById('onbLastName')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') _onbNext();
        });
        break;

    case 2:
        document.querySelectorAll('#onbBody [data-choice]').forEach(btn => {
            btn.addEventListener('click', () => {
                _onbData.housing.type = btn.dataset.choice;
                _onbRender();
                setTimeout(() => {
                    const el = document.getElementById('onbHousingAmt');
                    if (el) el.focus();
                }, 80);
            });
        });
        break;

    case 3:
        document.querySelectorAll('#onbBody [data-choice]').forEach(btn => {
            btn.addEventListener('click', () => {
                _onbData.transport.mode = btn.dataset.choice;
                if (btn.dataset.choice !== 'auto') _onbData.transport.brand = null;
                _onbRender();
                setTimeout(() => {
                    const el = document.getElementById('onbAutoAmt') ||
                               document.getElementById('onbTransitAmt');
                    if (el) el.focus();
                }, 80);
            });
        });
        document.querySelectorAll('#onbBody [data-brand]').forEach(btn => {
            btn.addEventListener('click', () => {
                _onbData.transport.brand = btn.dataset.brand;
                document.querySelectorAll('[data-brand]').forEach(b =>
                    b.classList.toggle('sel', b.dataset.brand === btn.dataset.brand));
            });
        });
        break;

    case 4:
        document.querySelectorAll('#onbBody [data-yn]').forEach(btn => {
            btn.addEventListener('click', () => {
                _onbData.studies.has = btn.dataset.yn === 'true';
                if (!_onbData.studies.has) {
                    // Non → passer directement à l'étape suivante
                    _onbStep++;
                    _onbRender();
                } else {
                    _onbRender();
                    setTimeout(() => {
                        const el = document.getElementById('onbStudiesAmt');
                        if (el) el.focus();
                    }, 80);
                }
            });
        });
        break;

    case 5:
        document.querySelectorAll('#onbInternetGrid .onb-provider-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                _onbData.internet.provider = btn.dataset.name;
                if (btn.dataset.name === 'aucun') {
                    _onbData.internet.amount = 0;
                    _onbStep++;
                    _onbRender();
                } else {
                    _onbRender();
                    setTimeout(() => {
                        const el = document.getElementById('onbInternetAmt');
                        if (el) el.focus();
                    }, 80);
                }
            });
        });
        break;

    case 6:
        document.querySelectorAll('#onbCellGrid .onb-provider-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                _onbData.cell.provider = btn.dataset.name;
                if (btn.dataset.name === 'aucun') {
                    _onbData.cell.amount = 0;
                    _onbStep++;
                    _onbRender();
                } else {
                    _onbRender();
                    setTimeout(() => {
                        const el = document.getElementById('onbCellAmt');
                        if (el) el.focus();
                    }, 80);
                }
            });
        });
        break;

    case 7:
        document.querySelectorAll('.onb-stream-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.classList.contains('onb-stream-amount')) return;
                const name    = item.dataset.name;
                const already = _onbData.streaming.findIndex(x => x.name === name);
                if (already >= 0) {
                    _onbData.streaming.splice(already, 1);
                    item.classList.remove('sel');
                } else {
                    const amtInput = item.querySelector('.onb-stream-amount');
                    const amt = amtInput ? (parseFloat(amtInput.value) || parseFloat(item.dataset.default) || 0) : 0;
                    _onbData.streaming.push({ name, amount: amt, domain: item.dataset.domain });
                    item.classList.add('sel');
                    setTimeout(() => amtInput && amtInput.focus(), 30);
                }
            });
            const amtInput = item.querySelector('.onb-stream-amount');
            if (amtInput) {
                amtInput.addEventListener('input', () => {
                    const name = item.dataset.name;
                    const entry = _onbData.streaming.find(x => x.name === name);
                    if (entry) entry.amount = parseFloat(amtInput.value) || 0;
                });
            }
        });
        break;
    }
}

// ── Collecte des valeurs de champs ────────────────────────────────────────────

function _onbCollectStep(step) {
    switch (step) {
    case 1:
        _onbData.firstName = (document.getElementById('onbFirstName')?.value || '').trim();
        _onbData.lastName  = (document.getElementById('onbLastName')?.value  || '').trim();
        break;
    case 2:
        const housingAmt = document.getElementById('onbHousingAmt');
        if (housingAmt) _onbData.housing.amount = parseFloat(housingAmt.value) || null;
        break;
    case 3:
        const autoAmt = document.getElementById('onbAutoAmt');
        if (autoAmt) _onbData.transport.amount = parseFloat(autoAmt.value) || null;
        const transitAmt = document.getElementById('onbTransitAmt');
        if (transitAmt) _onbData.transport.amount = parseFloat(transitAmt.value) || null;
        break;
    case 4:
        const studiesAmt = document.getElementById('onbStudiesAmt');
        if (studiesAmt) _onbData.studies.amount = parseFloat(studiesAmt.value) || null;
        break;
    case 5:
        const internetOther = document.getElementById('onbInternetOther');
        if (internetOther) _onbData.internet._custom = internetOther.value.trim();
        const internetAmt = document.getElementById('onbInternetAmt');
        if (internetAmt) _onbData.internet.amount = parseFloat(internetAmt.value) || null;
        break;
    case 6:
        const cellOther = document.getElementById('onbCellOther');
        if (cellOther) _onbData.cell._custom = cellOther.value.trim();
        const cellAmt = document.getElementById('onbCellAmt');
        if (cellAmt) _onbData.cell.amount = parseFloat(cellAmt.value) || null;
        break;
    case 7:
        // Sync amounts in case user typed without clicking
        document.querySelectorAll('.onb-stream-item.sel').forEach(item => {
            const name = item.dataset.name;
            const amtInput = item.querySelector('.onb-stream-amount');
            const entry = _onbData.streaming.find(x => x.name === name);
            if (entry && amtInput) entry.amount = parseFloat(amtInput.value) || 0;
        });
        break;
    }
}

// ── Validation ────────────────────────────────────────────────────────────────

function _onbValidate(step) {
    switch (step) {
    case 1:
        return (_onbData.firstName || (document.getElementById('onbFirstName')?.value || '').trim()).length > 0;
    case 2:
        return !!_onbData.housing.type;
        // Amount not required (can be 0)
    case 3:
        return !!_onbData.transport.mode;
    case 4:
        return _onbData.studies.has !== null;
    default:
        return true; // Internet, Cell, Streaming, Summary all optional
    }
}

// ── Navigation ────────────────────────────────────────────────────────────────

function _onbNext() {
    _onbCollectStep(_onbStep);

    if (!_onbValidate(_onbStep)) {
        _onbShakeNext();
        return;
    }

    if (_onbStep < ONB_TOTAL_STEPS) {
        _onbStep++;
        _onbRender();
    } else {
        _onbFinish();
    }
}

function _onbBack() {
    _onbCollectStep(_onbStep);
    if (_onbStep > 1) {
        _onbStep--;
        _onbRender();
    }
}

function _onbShakeNext() {
    const btn = document.getElementById('onbNextBtn');
    btn.style.transform = 'translateX(-4px)';
    setTimeout(() => btn.style.transform = 'translateX(4px)', 80);
    setTimeout(() => btn.style.transform = 'translateX(-3px)', 160);
    setTimeout(() => btn.style.transform = '', 240);
}

// ── Passer (skip) → données démo ─────────────────────────────────────────────

function _onbSkip() {
    if (!confirm('Passer la configuration et utiliser des données de démonstration?')) return;
    closeOnboarding();
    _loadDemoMode();
}

async function _loadDemoMode() {
    // expenses est déjà le tableau démo de data.js, le garder tel quel
    // Si l'utilisateur est authentifié, insérer les données démo en DB
    if (!DB_OFFLINE && authUserId()) {
        const inserted = await dbInsertBulk(expenses);
        if (inserted) {
            expenses = inserted;
            nextId = Math.max(...expenses.map(e => e.id)) + 1;
        }
        await authMarkOnboardingDone('');
    }
    showDemoBanner();
    _onbBootstrapDashboard();
}

// ── Finalisation ──────────────────────────────────────────────────────────────

async function _onbFinish() {
    const btn = document.getElementById('onbNextBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="onb-spinner"></span> Création…';

    const newExpenses = _onbBuildExpenses();
    const firstName   = _onbData.firstName || 'vous';

    try {
        if (!DB_OFFLINE && authUserId()) {
            // Supprimer les anciennes données et insérer les nouvelles
            await dbDeleteAllForUser();
            const inserted = await dbInsertBulk(newExpenses);
            if (inserted && inserted.length > 0) {
                expenses = inserted;
            } else {
                expenses = newExpenses;
            }
            await authMarkOnboardingDone(firstName, _onbData.lastName);
        } else {
            expenses = newExpenses;
        }

        nextId = expenses.length > 0
            ? Math.max(...expenses.map(e => e.id)) + 1
            : 1;

        closeOnboarding();
        _onbBootstrapDashboard();
        showToast(`✓ Bienvenue ${firstName}! Vos dépenses ont été créées.`);
    } catch (err) {
        console.error('[Onboarding] Erreur lors de la création:', err);
        btn.disabled = false;
        btn.textContent = 'Créer mon profil ✓';
        alert('Une erreur est survenue. Veuillez réessayer.');
    }
}

// ── Mise à jour du dashboard après onboarding ─────────────────────────────────

function _onbBootstrapDashboard() {
    updateHeaderName();
    renderExpenses();
    renderRecs();
    renderTicker();
    requestAnimationFrame(() => {
        if (typeof initDonut   === 'function') initDonut();
        if (typeof initSavings === 'function') initSavings();
    });
}

// ── Construction du tableau d'expenses à partir des données collectées ────────

function _onbBuildExpenses() {
    const list = [];
    let id = 1;

    // Logement
    if (_onbData.housing.type && _onbData.housing.amount > 0) {
        const name = _onbData.housing.type === 'loyer' ? 'Loyer' : 'Hypothèque';
        list.push({ id: id++, name, cat:'habitation', amount:_onbData.housing.amount,
            recurring:true, type:'fixe', frequency:'mensuel', notes:'' });
    }

    // Auto
    if (_onbData.transport.mode === 'auto' && _onbData.transport.amount > 0) {
        const brand = _onbData.transport.brand && _onbData.transport.brand !== 'Autre'
            ? _onbData.transport.brand : 'Auto';
        list.push({ id: id++, name: brand, cat:'auto', amount:_onbData.transport.amount,
            recurring:true, type:'fixe', frequency:'mensuel', notes:'Assurance auto' });
    }

    // Transport en commun
    if (_onbData.transport.mode === 'transit' && _onbData.transport.amount > 0) {
        list.push({ id: id++, name:'Transport en commun', cat:'transport',
            amount:_onbData.transport.amount,
            recurring:true, type:'fixe', frequency:'mensuel', notes:'' });
    }

    // Études
    if (_onbData.studies.has && _onbData.studies.amount > 0) {
        list.push({ id: id++, name:'Frais de scolarité', cat:'ecole',
            amount:_onbData.studies.amount,
            recurring:true, type:'fixe', frequency:'mensuel', notes:'' });
    }

    // Internet
    const iName = _onbData.internet.provider === 'Autre'
        ? (_onbData.internet._custom || 'Internet')
        : (_onbData.internet.provider || null);
    if (iName && iName !== 'aucun' && _onbData.internet.amount > 0) {
        list.push({ id: id++, name:'Internet (' + iName + ')', cat:'internet',
            amount:_onbData.internet.amount,
            recurring:true, type:'fixe', frequency:'mensuel', notes:'' });
    }

    // Cellulaire
    const cName = _onbData.cell.provider === 'Autre'
        ? (_onbData.cell._custom || 'Cellulaire')
        : (_onbData.cell.provider || null);
    if (cName && cName !== 'aucun' && _onbData.cell.amount > 0) {
        list.push({ id: id++, name: cName, cat:'cell',
            amount:_onbData.cell.amount,
            recurring:true, type:'fixe', frequency:'mensuel', notes:'' });
    }

    // Streaming
    _onbData.streaming.forEach(s => {
        if (s.amount >= 0) {
            list.push({ id: id++, name: s.name, cat:'streaming',
                amount: s.amount,
                recurring:true, type:'fixe', frequency:'mensuel', notes:'' });
        }
    });

    return list;
}

// ── Utilitaires ───────────────────────────────────────────────────────────────

function _esc(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════
//  AUTH SCREEN
// ═══════════════════════════════════════════════════════

let _authMode = 'login'; // 'login' | 'signup'

function _removeVeil() {
    const veil = document.getElementById('appVeil');
    if (!veil) return;
    veil.classList.add('veil-hidden');
    setTimeout(() => veil.remove(), 380);
}

function openAuthScreen() {
    _authMode = 'login';
    const overlay = document.getElementById('authOverlay');
    overlay.classList.add('open');
    _authRender();
    // Retire le veil puis anime l'overlay/carte en entrée
    _removeVeil();
    requestAnimationFrame(() => requestAnimationFrame(() => {
        overlay.classList.add('visible');
    }));
}

function closeAuthScreen() {
    const overlay = document.getElementById('authOverlay');
    overlay.classList.remove('visible');
    setTimeout(() => overlay.classList.remove('open'), 300);
}

function _authRender() {
    document.getElementById('tabLogin') .classList.toggle('active', _authMode === 'login');
    document.getElementById('tabSignup').classList.toggle('active', _authMode === 'signup');
    const confirmField = document.getElementById('authConfirmField');
    if (confirmField) confirmField.style.display = _authMode === 'signup' ? '' : 'none';
    const submitBtn = document.getElementById('authSubmitBtn');
    if (submitBtn) submitBtn.textContent = _authMode === 'login' ? 'Se connecter' : 'Créer mon compte';
    _authClearMsg();
}

function _authClearMsg() {
    const msg = document.getElementById('authMsg');
    if (msg) { msg.textContent = ''; msg.className = 'auth-msg'; }
}

function _authShowMsg(text, type) {
    const msg = document.getElementById('authMsg');
    if (msg) { msg.textContent = text; msg.className = 'auth-msg ' + type; }
}

function _authSetLoading(loading) {
    const btn = document.getElementById('authSubmitBtn');
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<span class="onb-spinner"></span> Chargement…'
        : (_authMode === 'login' ? 'Se connecter' : 'Créer mon compte');
}

async function _authSubmit() {
    const email    = (document.getElementById('authEmail')?.value    || '').trim();
    const password =  document.getElementById('authPassword')?.value || '';
    const confirm  =  document.getElementById('authConfirm')?.value  || '';

    if (!email || !password) {
        _authShowMsg('Veuillez remplir tous les champs.', 'error');
        return;
    }

    if (_authMode === 'signup') {
        if (password.length < 6) {
            _authShowMsg('Le mot de passe doit contenir au moins 6 caractères.', 'error');
            return;
        }
        if (password !== confirm) {
            _authShowMsg('Les mots de passe ne correspondent pas.', 'error');
            return;
        }
    }

    _authSetLoading(true);
    _authClearMsg();

    try {
        if (_authMode === 'signup') {
            const data = await authSignUp(email, password);
            // Toujours afficher le message de vérification après inscription
            _authSetLoading(false);
            _authShowMsg('✉️ Un email de confirmation vous a été envoyé. Vérifiez votre boîte et cliquez le lien, puis revenez vous connecter.', 'success');
            _authMode = 'login';
            _authRender();
            return;
        } else {
            await authSignIn(email, password);
            closeAuthScreen();
            // Check if onboarding already done
            if (authHasCompletedOnboarding()) {
                await _bootDashboard();
            } else {
                openOnboarding();
            }
        }
    } catch (err) {
        _authSetLoading(false);
        const msg = _authTranslateError(err.message);
        _authShowMsg(msg, 'error');
    }
}

function _authTranslateError(msg) {
    if (!msg) return 'Une erreur est survenue.';
    const m = msg.toLowerCase();
    if (m.includes('invalid login') || m.includes('invalid credentials'))
        return 'Email ou mot de passe incorrect.';
    if (m.includes('email already') || m.includes('already registered'))
        return 'Cet email est déjà utilisé. Connectez-vous à la place.';
    if (m.includes('password') && m.includes('character'))
        return 'Le mot de passe doit contenir au moins 6 caractères.';
    if (m.includes('rate limit'))
        return 'Trop de tentatives. Attendez quelques minutes.';
    if (m.includes('network') || m.includes('fetch'))
        return 'Impossible de se connecter. Vérifiez votre connexion.';
    return msg;
}

// ── Bootstrap complet du dashboard après auth ─────────────────────────────────

async function _bootDashboard() {
    // Clear demo data + historique fictif — les utilisateurs authentifiés partent de zéro
    expenses = [];
    nextId   = 1;
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
    updateHeaderName();
    renderExpenses();
    renderRecs();
    renderTicker();
    requestAnimationFrame(() => {
        if (typeof initDonut   === 'function') initDonut();
        if (typeof initSavings === 'function') initSavings();
    });
}

// ── Reset + relancer l'onboarding ─────────────────────────────────────────────

async function resetAndReOpenOnboarding() {
    if (!_db || !authUserId()) return;
    // Remettre onboarding_done à false dans Supabase
    try {
        const { data, error } = await _db.auth.updateUser({ data: { onboarding_done: false } });
        if (!error && data?.user) {
            // Mettre à jour l'utilisateur local
            const { data: { user } } = await _db.auth.getUser();
            if (user) { /* _authUser updated via authGetSession below */ }
            await authGetSession();
        }
    } catch (_) {}
    openOnboarding();
}

// ═══════════════════════════════════════════════════════
//  DEMO BANNER
// ═══════════════════════════════════════════════════════

function showDemoBanner() {
    const banner = document.getElementById('demoBanner');
    if (banner) banner.classList.add('visible');
}

function hideDemoBanner() {
    const banner = document.getElementById('demoBanner');
    if (banner) banner.classList.remove('visible');
}

async function eraseAllData() {
    if (!confirm('Effacer toutes les dépenses? Cette action est irréversible.')) return;
    expenses = [];
    nextId   = 1;

    // Vider l'historique démo + localStorage
    HISTORY.splice(0);
    localStorage.removeItem('depensa_history_extra');
    Object.keys(MONTH_MAP).forEach(k => delete MONTH_MAP[k]);
    initMonthSystem();
    buildMonthTabs();

    if (!DB_OFFLINE && authUserId()) {
        await dbDeleteAllForUser();
    }
    hideDemoBanner();
    renderExpenses();
    renderRecs();
    if (typeof updateDonut   === 'function') updateDonut();
    if (typeof initSavings   === 'function') initSavings();
    showToast('✓ Toutes les dépenses ont été effacées.');
}

// ═══════════════════════════════════════════════════════
//  UPDATE HEADER NAME
// ═══════════════════════════════════════════════════════

function updateHeaderName() {
    const firstName = authUserFirstName();
    const email     = authUserEmail() || '';

    const greeting = document.querySelector('.header-greeting');
    if (greeting && firstName) {
        greeting.textContent = `Bonjour, ${firstName} 👋`;
        greeting.style.visibility = 'visible';
    }

    // L'avatar est toujours visible quand l'utilisateur est connecté
    const avatar = document.getElementById('userAvatar');
    if (avatar && authUserId()) {
        avatar.textContent = authUserInitials();
        avatar.style.visibility = 'visible';
    }

    const identity = document.getElementById('avatarIdentity');
    const divider  = document.getElementById('avatarDivider');
    if (identity) {
        const displayName = authUserFullName() || firstName || email || 'Compte';
        identity.innerHTML = `<strong>${_esc(displayName)}</strong>${email && email !== displayName ? _esc(email) : ''}`;
        identity.style.display = 'block';
        if (divider) divider.style.display = 'block';
    }
}
