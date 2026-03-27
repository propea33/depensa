// ═══════════════════════════════════════════════════════
//  ICONS — Icônes dynamiques par nom de dépense
//  Priorité 1 : mapping local (services québécois / courants)
//  Priorité 2 : API Google Favicons (domaine deviné pour services)
//  Priorité 3 : icône emoji de la catégorie
// ═══════════════════════════════════════════════════════

// ── Mapping local : nom normalisé → domaine favicon ─────────────────────────
const ICON_MAP = {
    // ─ Internet / FAI ─
    'vidéotron':       'videotron.com',
    'videotron':       'videotron.com',
    'bell':            'bell.ca',
    'cogeco':          'cogeco.ca',
    'fizz':            'fizz.ca',
    'ebox':            'ebox.ca',
    'vmedia':          'vmedia.ca',
    'start.ca':        'start.ca',
    'teksavvy':        'teksavvy.com',
    'oxio':            'oxio.ca',
    'distributel':     'distributel.net',

    // ─ Cellulaire ─
    'telus':           'telus.com',
    'fido':            'fido.ca',
    'koodo':           'koodomobile.com',
    'public mobile':   'publicmobile.ca',
    'lucky mobile':    'luckymobile.ca',
    'chatr':           'chatrwireless.com',
    'freedom mobile':  'freedommobile.ca',
    'rogers':          'rogers.com',
    'virgin plus':     'virginplus.ca',
    'virgin':          'virginplus.ca',

    // ─ Streaming vidéo ─
    'netflix':         'netflix.com',
    'disney+':         'disneyplus.com',
    'disney plus':     'disneyplus.com',
    'crave':           'crave.ca',
    'prime video':     'primevideo.com',
    'amazon prime':    'primevideo.com',
    'prime':           'primevideo.com',
    'apple tv':        'tv.apple.com',
    'apple tv+':       'tv.apple.com',
    'tou.tv':          'tou.tv',
    'club illico':     'illico.tv',
    'illico':          'illico.tv',
    'paramount+':      'paramountplus.com',
    'paramount plus':  'paramountplus.com',
    'hulu':            'hulu.com',
    'max':             'max.com',
    'hbo':             'max.com',
    'youtube premium': 'youtube.com',
    'crunchyroll':     'crunchyroll.com',
    'peacock':         'peacocktv.com',
    'discovery+':      'discoveryplus.com',

    // ─ Streaming musique ─
    'spotify':         'spotify.com',
    'apple music':     'music.apple.com',
    'tidal':           'tidal.com',
    'deezer':          'deezer.com',
    'youtube music':   'music.youtube.com',
    'soundcloud':      'soundcloud.com',

    // ─ Électricité / Énergie ─
    'électricité':     'hydroquebec.com',
    'electricite':     'hydroquebec.com',
    'hydro-québec':    'hydroquebec.com',
    'hydro québec':    'hydroquebec.com',
    'hydro':           'hydroquebec.com',
    'enbridge':        'enbridgegas.com',
    'énergir':         'energir.com',
    'energir':         'energir.com',

    // ─ Gym / Fitness ─
    'éconofitness':    'econofitness.ca',
    'econofitness':    'econofitness.ca',
    'nautilus plus':   'nautilusplus.com',
    'nautilus':        'nautilusplus.com',
    'ymca':            'ymca.ca',
    'energie cardio':  'energiecardio.com',
    'énergie cardio':  'energiecardio.com',
    'fit4less':        'fit4less.ca',
    'goodlife':        'goodlifefitness.com',
    'anytime fitness': 'anytimefitness.com',
    'orange theory':   'orangetheory.com',
    'f45':             'f45training.com',

    // ─ Transport ─
    'stm':             'stm.info',
    'rtc':             'rtcquebec.ca',
    'opus':            'stm.info',
    'bixi':            'bixi.com',
    'via rail':        'viarail.ca',
    'via':             'viarail.ca',
    'uber':            'uber.com',
    'lyft':            'lyft.com',
    'communauto':      'communauto.com',
    'evo':             'evo.ca',

    // ─ Assurance ─
    'intact':          'intact.ca',
    'td assurance':    'tdassurance.com',
    'desjardins':      'desjardins.com',
    'la capitale':     'lacapitale.com',
    'industrielle alliance': 'ia.ca',
    'ia assurance':    'ia.ca',
    'belair':          'belairdirect.com',
    'belairdirect':    'belairdirect.com',
    'sonnet':          'sonnet.ca',
    'promutuel':       'promutuel.ca',

    // ─ Banque / Finance ─
    'rbc':             'rbc.com',
    'td':              'td.com',
    'bmo':             'bmo.com',
    'scotiabank':      'scotiabank.com',
    'banque nationale':'bnc.ca',
    'bnc':             'bnc.ca',
    'tangerine':       'tangerine.ca',
    'simplii':         'simplii.com',
    'eq bank':         'eqbank.ca',
    'wealthsimple':    'wealthsimple.com',
    'questrade':       'questrade.com',
    'paypal':          'paypal.com',
    'interac':         'interac.ca',

    // ─ Cloud / Tech ─
    'icloud':          'icloud.com',
    'apple':           'apple.com',
    'google one':      'one.google.com',
    'dropbox':         'dropbox.com',
    'microsoft 365':   'microsoft.com',
    'office 365':      'microsoft.com',
    'm365':            'microsoft.com',
    'adobe':           'adobe.com',
    'notion':          'notion.so',
    'slack':           'slack.com',
    'github':          'github.com',
    'chatgpt':         'openai.com',
    'openai':          'openai.com',
    'claude':          'anthropic.com',
    'duolingo':        'duolingo.com',
    'headspace':       'headspace.com',
    'calm':            'calm.com',
    '1password':       '1password.com',
    'lastpass':        'lastpass.com',
    'nordvpn':         'nordvpn.com',
    'expressvpn':      'expressvpn.com',
    'google workspace':'workspace.google.com',
    'zoom':            'zoom.us',
    'linear':          'linear.app',
    'figma':           'figma.com',

    // ─ Livraison ─
    'doordash':        'doordash.com',
    'uber eats':       'ubereats.com',
    'ubereats':        'ubereats.com',
    'skip':            'skipthedishes.com',
    'goodfood':        'makegoodfood.ca',
    'amazon':          'amazon.ca',

    // ─ Santé ─
    'clicsanté':       'clic-sante.ca',
    'dialogue':        'dialogue.co',
};

// ── Presets fournisseurs par catégorie ───────────────────────────────────────
// Affiché comme grille de sélection dans le modal pour certaines catégories.
// domain: null → option "Autre" (affiche ✏️, vide le champ nom)
const PROVIDER_PRESETS = {
    electricite: [
        { name: 'Hydro-Québec', domain: 'hydroquebec.com' },
        { name: 'Énergir (gaz)',domain: 'energir.com'     },
        { name: 'Autre',        domain: null               },
    ],
    gym: [
        { name: 'Éconofitness', domain: 'econofitness.ca'   },
        { name: 'Pro Gym',      domain: 'progym.ca'          },
        { name: 'YMCA',         domain: 'ymca.ca'            },
        { name: 'World Gym',    domain: 'worldgym.com'       },
        { name: 'Energie Cardio',domain:'energiecardio.com'  },
        { name: 'Autre',        domain: null                 },
    ],
    internet: [
        { name: 'Vidéotron',    domain: 'videotron.com'  },
        { name: 'Bell',         domain: 'bell.ca'         },
        { name: 'VMedia',       domain: 'vmedia.ca'       },
        { name: 'Cogeco',       domain: 'cogeco.ca'       },
        { name: 'EBOX',         domain: 'ebox.ca'         },
        { name: 'Fizz',         domain: 'fizz.ca'         },
        { name: 'Start.ca',     domain: 'start.ca'        },
        { name: 'Autre',        domain: null              },
    ],
    cell: [
        { name: 'Telus',         domain: 'telus.com'           },
        { name: 'Public Mobile', domain: 'publicmobile.ca'      },
        { name: 'Fizz',          domain: 'fizz.ca'              },
        { name: 'Rogers',        domain: 'rogers.com'           },
        { name: 'Koodo',         domain: 'koodomobile.com'      },
        { name: 'Vidéotron',     domain: 'videotron.com'        },
        { name: 'Lucky Mobile',  domain: 'luckymobile.ca'       },
        { name: 'Fido',          domain: 'fido.ca'              },
        { name: 'Chatr',         domain: 'chatrwireless.com'    },
        { name: 'Autre',         domain: null                   },
    ],
};

// ── Catégories pour lesquelles on peut tenter un domaine deviné ─────────────
const _FAVICON_CATS = new Set(['streaming', 'cell', 'internet', 'gym', 'loisir', 'electricite']);

// ── Cache d'état : url → 'ok' | 'error' ─────────────────────────────────────
const _iconLoadCache = new Map();

// ── Helpers internes ─────────────────────────────────────────────────────────

function _faviconUrl(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function _normalizeName(name) {
    return (name || '')
        .toLowerCase()
        .replace(/\s*\(.*?\)/g, '')        // "(Vidéotron)" → ""
        .replace(/\s*[-–]\s*.*$/, '')      // "Internet - 500 Mbps" → "internet"
        .replace(/[^\w\s\u00C0-\u024F.+&]/g, '')
        .trim();
}

function _lookupDomain(name) {
    const norm = _normalizeName(name);
    if (!norm) return null;

    // Correspondance exacte
    if (ICON_MAP[norm]) return ICON_MAP[norm];

    // Cherche d'abord dans le contenu des parenthèses
    // ex: "Internet (Vidéotron)" → essaie "vidéotron" → videotron.com
    const parenMatch = (name || '').match(/\(([^)]+)\)/);
    if (parenMatch) {
        const parenNorm = parenMatch[1].toLowerCase().trim();
        if (ICON_MAP[parenNorm]) return ICON_MAP[parenNorm];
        for (const [key, domain] of Object.entries(ICON_MAP)) {
            if (parenNorm.includes(key) || (key.length > 3 && key.includes(parenNorm))) {
                return domain;
            }
        }
    }

    // Correspondance partielle : la clé est dans le nom ou vice-versa
    for (const [key, domain] of Object.entries(ICON_MAP)) {
        if (norm.includes(key) || (key.length > 3 && key.includes(norm))) {
            return domain;
        }
    }
    return null;
}

function _guessDomain(name, catId) {
    if (!_FAVICON_CATS.has(catId)) return null;
    const norm = _normalizeName(name);
    if (!norm || norm.length < 3) return null;
    if (/\.\w{2,4}$/.test(norm)) return norm;  // déjà un domaine
    const slug = norm.replace(/\s+/g, '');
    if (/^[a-z0-9\u00C0-\u024F+]{3,20}$/.test(slug)) return slug + '.com';
    return null;
}

// ── API publique ─────────────────────────────────────────────────────────────

/**
 * Retourne l'URL favicon pour ce nom+catégorie, ou null si aucune trouvée.
 */
function getExpenseIcon(name, catId) {
    const domain = _lookupDomain(name) || _guessDomain(name, catId);
    return domain ? _faviconUrl(domain) : null;
}

/**
 * Retourne le HTML à injecter dans .expense-icon (cartes de dépenses).
 */
function getExpenseIconHTML(name, catId) {
    const cat = getCAT(catId);
    const url = getExpenseIcon(name, catId);

    if (!url || _iconLoadCache.get(url) === 'error') return cat.icon;

    const fb = cat.icon.replace(/`/g, '\\`');

    if (_iconLoadCache.get(url) === 'ok') {
        return `<img src="${url}" class="expense-img-icon" alt="">`;
    }

    return `<img src="${url}" class="expense-img-icon" alt=""
        onload="_iconLoadCache.set('${url}','ok')"
        onerror="_iconLoadCache.set('${url}','error');this.replaceWith(document.createTextNode(\`${fb}\`))">`;
}

/**
 * Met à jour le conteneur #iconPreview dans le modal.
 */
function refreshIconPreview() {
    const preview = document.getElementById('iconPreview');
    if (!preview) return;
    const name = document.getElementById('eName')?.value || '';
    const cat  = getCAT(selCat);
    const url  = getExpenseIcon(name, selCat);

    if (!name.trim() || !url || _iconLoadCache.get(url) === 'error') {
        preview.innerHTML = `<span class="icon-preview-emoji">${cat.icon}</span>`;
        return;
    }

    const fb = cat.icon.replace(/`/g, '\\`');
    preview.innerHTML = `<img src="${url}" class="icon-preview-img" alt=""
        onload="_iconLoadCache.set('${url}','ok')"
        onerror="_iconLoadCache.set('${url}','error');this.replaceWith(document.createTextNode(\`${fb}\`))">`;
}
