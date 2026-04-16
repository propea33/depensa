(function () {
  'use strict';

  var CONSENT_KEY = 'depensa_consent';
  var GA_ID = 'G-ME0CFCRDRJ';
  var POLICY_URL = '/politique-confidentialite.html';

  /* ── Consent storage ─────────────────────────────── */

  function getConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveConsent(analyticsAllowed) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        essential: true,
        analytics: analyticsAllowed,
        date: new Date().toISOString()
      }));
    } catch (e) {}
    hideBanner();
    if (analyticsAllowed) loadGA();
  }

  /* ── GA loader ───────────────────────────────────── */

  function loadGA() {
    if (window._dpGaLoaded) return;
    window._dpGaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  /* ── Banner hide ─────────────────────────────────── */

  function hideBanner() {
    var b = document.getElementById('dp-consent-banner');
    if (!b) return;
    b.style.transform = b.offsetWidth <= 480
      ? 'translateY(120%)'
      : 'translateX(-50%) translateY(120%)';
    b.style.opacity = '0';
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 350);
  }

  /* ── Public: open manager from footer ───────────── */

  function openConsentManager() {
    showBanner(getConsent() || {essential: true, analytics: false});
  }
  window.openConsentManager = openConsentManager;

  /* ── Injected CSS ────────────────────────────────── */

  function injectStyles() {
    if (document.getElementById('dp-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'dp-consent-styles';
    style.textContent = [
      '#dp-consent-banner{',
        'position:fixed;bottom:20px;left:50%;',
        'transform:translateX(-50%) translateY(120%);',
        'width:min(680px,calc(100vw - 32px));',
        'background:#ffffff;border:2px solid #0a0a0a;border-radius:14px;',
        'padding:20px 22px;box-shadow:4px 4px 0 #0a0a0a;',
        'z-index:9999;font-family:"DM Sans",sans-serif;',
        'opacity:0;transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .35s ease;',
      '}',
      'html[data-theme="dark"] #dp-consent-banner{',
        'background:#1a1f26;border-color:#4a5568;',
        'box-shadow:4px 4px 0 #0f1115;color:#f5f7fb;',
      '}',
      '#dp-consent-banner .dp-title{',
        'font-family:"Plus Jakarta Sans","DM Sans",sans-serif;',
        'font-size:15px;font-weight:800;color:#0a0a0a;',
        'margin-bottom:5px;letter-spacing:-.2px;',
      '}',
      'html[data-theme="dark"] #dp-consent-banner .dp-title{color:#f5f7fb;}',
      '#dp-consent-banner .dp-desc{font-size:13px;color:#5c5848;line-height:1.55;margin:0;}',
      'html[data-theme="dark"] #dp-consent-banner .dp-desc{color:#bcc7d8;}',
      '#dp-consent-banner .dp-desc a{color:#7c3aed;text-decoration:underline;font-weight:600;}',
      'html[data-theme="dark"] #dp-consent-banner .dp-desc a{color:#a78bfa;}',
      '#dp-consent-banner .dp-actions{',
        'display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap;',
      '}',
      '#dp-consent-banner .dp-btn{',
        'padding:9px 20px;border-radius:8px;font-family:"DM Sans",sans-serif;',
        'font-size:13px;font-weight:700;cursor:pointer;border:2px solid #0a0a0a;',
        'transition:transform .12s,box-shadow .12s;white-space:nowrap;',
        'text-decoration:none;display:inline-flex;align-items:center;',
      '}',
      'html[data-theme="dark"] #dp-consent-banner .dp-btn{border-color:#4a5568;}',
      '#dp-consent-banner .dp-btn-accept{',
        'background:#7c3aed;color:#fff;box-shadow:3px 3px 0 #0a0a0a;',
      '}',
      'html[data-theme="dark"] #dp-consent-banner .dp-btn-accept{',
        'background:#a78bfa;color:#0a0a0a;box-shadow:3px 3px 0 #0f1115;',
      '}',
      '#dp-consent-banner .dp-btn-accept:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 #0a0a0a;}',
      '#dp-consent-banner .dp-btn-refuse{',
        'background:#fff;color:#0a0a0a;box-shadow:3px 3px 0 #0a0a0a;',
      '}',
      'html[data-theme="dark"] #dp-consent-banner .dp-btn-refuse{',
        'background:#1a1f26;color:#f5f7fb;box-shadow:3px 3px 0 #0f1115;',
      '}',
      '#dp-consent-banner .dp-btn-refuse:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 #0a0a0a;}',
      '#dp-customize-link{',
        'font-size:12px;color:#5c5848;text-decoration:underline;cursor:pointer;',
        'background:none;border:none;padding:0;font-family:"DM Sans",sans-serif;',
        'margin-left:auto;',
      '}',
      'html[data-theme="dark"] #dp-customize-link{color:#bcc7d8;}',
      '#dp-details-panel{',
        'margin-top:14px;padding-top:14px;',
        'border-top:1px solid #d4cfc4;',
      '}',
      'html[data-theme="dark"] #dp-details-panel{border-top-color:#3a4453;}',
      '.dp-cat-row{',
        'display:flex;align-items:flex-start;justify-content:space-between;',
        'gap:12px;padding:10px 0;border-bottom:1px solid #f0ede6;',
      '}',
      '.dp-cat-row:last-child{border-bottom:none;}',
      'html[data-theme="dark"] .dp-cat-row{border-bottom-color:#2a3340;}',
      '.dp-cat-label{font-size:13px;font-weight:700;color:#0a0a0a;margin-bottom:3px;}',
      'html[data-theme="dark"] .dp-cat-label{color:#f5f7fb;}',
      '.dp-cat-desc{font-size:11.5px;color:#5c5848;line-height:1.5;max-width:460px;}',
      'html[data-theme="dark"] .dp-cat-desc{color:#bcc7d8;}',
      '.dp-always-on{',
        'font-size:11px;font-weight:700;color:#059669;',
        'background:rgba(5,150,105,.08);border:1px solid rgba(5,150,105,.22);',
        'border-radius:6px;padding:3px 10px;white-space:nowrap;flex-shrink:0;',
      '}',
      '.dp-toggle-label{',
        'position:relative;display:inline-block;',
        'width:40px;height:22px;cursor:pointer;flex-shrink:0;',
      '}',
      '.dp-toggle-label input{opacity:0;width:0;height:0;position:absolute;}',
      '.dp-toggle-track{',
        'position:absolute;inset:0;background:#d4cfc4;border-radius:11px;',
        'border:1.5px solid #0a0a0a;transition:background .2s;',
      '}',
      'html[data-theme="dark"] .dp-toggle-track{border-color:#4a5568;background:#3a4453;}',
      '.dp-toggle-label input:checked + .dp-toggle-track{background:#7c3aed;}',
      'html[data-theme="dark"] .dp-toggle-label input:checked + .dp-toggle-track{background:#a78bfa;}',
      '.dp-toggle-track::after{',
        'content:"";position:absolute;top:2px;left:2px;',
        'width:14px;height:14px;background:#fff;border-radius:50%;',
        'transition:transform .2s;border:1px solid rgba(0,0,0,.1);',
      '}',
      '.dp-toggle-label input:checked + .dp-toggle-track::after{transform:translateX(18px);}',
      '#dp-consent-banner .dp-policy-link{',
        'display:block;font-size:11px;color:#a8a39a;margin-top:10px;text-align:center;',
      '}',
      '#dp-consent-banner .dp-policy-link a{color:inherit;text-decoration:underline;}',
      '@media(max-width:480px){',
        '#dp-consent-banner{',
          'bottom:0;left:0;right:0;width:100%;border-radius:14px 14px 0 0;',
          'border-left:none;border-right:none;border-bottom:none;',
          'box-shadow:0 -3px 0 #0a0a0a;transform:translateY(120%);',
          'padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));',
        '}',
        'html[data-theme="dark"] #dp-consent-banner{box-shadow:0 -3px 0 #0f1115;}',
        '#dp-consent-banner .dp-actions{flex-direction:column;gap:8px;}',
        '#dp-consent-banner .dp-btn{width:100%;justify-content:center;}',
        '#dp-customize-link{margin-left:0;width:100%;text-align:center;}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ── Banner HTML builders ────────────────────────── */

  function buildFirstVisitHTML() {
    return '<div id="dp-consent-banner" role="dialog" aria-label="Gestion des témoins" aria-live="polite">' +
      '<div class="dp-title">🍪 Ce site utilise des témoins</div>' +
      '<p class="dp-desc">Nous utilisons des témoins essentiels au fonctionnement du service et, avec votre accord, des témoins analytiques (Google Analytics) pour améliorer Depensa. ' +
      '<a href="' + POLICY_URL + '">Politique de confidentialité</a></p>' +
      '<div class="dp-actions">' +
        '<button id="dp-refuse-btn" class="dp-btn dp-btn-refuse">Refuser tout</button>' +
        '<button id="dp-accept-btn" class="dp-btn dp-btn-accept">Accepter tout</button>' +
        '<button id="dp-customize-link">Personnaliser</button>' +
      '</div>' +
    '</div>';
  }

  function buildManagerHTML(analyticsOn) {
    return '<div id="dp-consent-banner" role="dialog" aria-label="Préférences de témoins" aria-live="polite">' +
      '<div class="dp-title">⚙️ Gérer mes préférences</div>' +
      '<p class="dp-desc">Choisissez les catégories de témoins que vous autorisez sur Depensa.</p>' +
      '<div id="dp-details-panel">' +
        '<div class="dp-cat-row">' +
          '<div>' +
            '<div class="dp-cat-label">Essentiels</div>' +
            '<div class="dp-cat-desc">Session Supabase, préférences d\'interface (thème, affichage). Requis pour le fonctionnement du service.</div>' +
          '</div>' +
          '<span class="dp-always-on">Toujours actifs</span>' +
        '</div>' +
        '<div class="dp-cat-row">' +
          '<div>' +
            '<div class="dp-cat-label">Analytiques</div>' +
            '<div class="dp-cat-desc">Google Analytics 4 — pages vues et comportement de navigation. Aucune donnée personnelle identifiable.</div>' +
          '</div>' +
          '<label class="dp-toggle-label" aria-label="Activer les témoins analytiques">' +
            '<input type="checkbox" id="dp-analytics-toggle"' + (analyticsOn ? ' checked' : '') + '>' +
            '<span class="dp-toggle-track"></span>' +
          '</label>' +
        '</div>' +
      '</div>' +
      '<div class="dp-actions">' +
        '<button id="dp-refuse-btn" class="dp-btn dp-btn-refuse">Refuser tout</button>' +
        '<button id="dp-accept-btn" class="dp-btn dp-btn-accept">Enregistrer</button>' +
      '</div>' +
      '<p class="dp-policy-link"><a href="' + POLICY_URL + '">Politique de confidentialité complète</a></p>' +
    '</div>';
  }

  /* ── Show banner ─────────────────────────────────── */

  function showBanner(currentConsent) {
    injectStyles();
    var existing = document.getElementById('dp-consent-banner');
    if (existing) existing.parentNode.removeChild(existing);

    var isManager = (currentConsent !== null);
    var analyticsOn = currentConsent ? currentConsent.analytics : false;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = isManager ? buildManagerHTML(analyticsOn) : buildFirstVisitHTML();
    document.body.appendChild(wrapper.firstElementChild);

    var banner = document.getElementById('dp-consent-banner');
    var isMobile = window.innerWidth <= 480;
    /* animate in */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.style.transform = isMobile ? 'translateY(0)' : 'translateX(-50%) translateY(0)';
        banner.style.opacity = '1';
      });
    });

    /* refuse */
    document.getElementById('dp-refuse-btn').addEventListener('click', function () {
      var wasGranted = currentConsent && currentConsent.analytics;
      saveConsent(false);
      if (wasGranted) setTimeout(function () { window.location.reload(); }, 200);
    });

    /* accept / save */
    document.getElementById('dp-accept-btn').addEventListener('click', function () {
      if (isManager) {
        var toggle = document.getElementById('dp-analytics-toggle');
        var newVal = toggle ? toggle.checked : false;
        var wasGranted = currentConsent && currentConsent.analytics;
        saveConsent(newVal);
        if (wasGranted && !newVal) setTimeout(function () { window.location.reload(); }, 200);
      } else {
        saveConsent(true);
      }
    });

    /* customize link */
    var customBtn = document.getElementById('dp-customize-link');
    if (customBtn) {
      customBtn.addEventListener('click', function () {
        openConsentManager();
      });
    }
  }

  /* ── Init ────────────────────────────────────────── */

  function init() {
    var consent = getConsent();
    if (consent === null) {
      setTimeout(function () { showBanner(null); }, 500);
    } else if (consent.analytics) {
      loadGA();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
