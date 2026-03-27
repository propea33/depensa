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
    'club illico':     'clubillico.com',
    'illico':          'clubillico.com',
    'paramount+':      'paramountplus.com',
    'paramount plus':  'paramountplus.com',
    'hulu':            'hulu.com',
    'max':             'max.com',
    'hbo':             'max.com',
    'youtube premium': 'youtube.com',
    'crunchyroll':     'crunchyroll.com',
    'peacock':         'peacocktv.com',
    'discovery+':      'discoveryplus.com',
    'tubi':            'tubitv.com',
    'britbox':         'britbox.com',
    'kanopy':          'kanopy.com',
    'illico+':         'clubillico.com',
    'amazon prime video': 'primevideo.com',
    'apple tv+':       'tv.apple.com',

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

    // ─ Auto ─
    'toyota':          'toyota.com',
    'honda':           'honda.com',
    'ford':            'ford.com',
    'hyundai':         'hyundai.com',
    'kia':             'kia.com',
    'mazda':           'mazda.com',
    'nissan':          'nissan.com',
    'chevrolet':       'chevrolet.com',
    'chevy':           'chevrolet.com',
    'volkswagen':      'volkswagen.com',
    'vw':              'volkswagen.com',
    'subaru':          'subaru.com',
    'tesla':           'tesla.com',
    'bmw':             'bmw.com',
    'mercedes':        'mercedes-benz.com',
    'mercedes-benz':   'mercedes-benz.com',
    'audi':            'audi.com',
    'lexus':           'lexus.com',
    'jeep':            'jeep.com',
    'dodge':           'dodge.com',
    'ram':             'ramtrucks.com',
    'gmc':             'gmc.com',
    'buick':           'buick.com',
    'cadillac':        'cadillac.com',
    'volvo':           'volvocars.com',
    'mitsubishi':      'mitsubishi.com',
    'acura':           'acura.com',
    'infiniti':        'infinitiusa.com',
    'porsche':         'porsche.com',
    'lincoln':         'lincoln.com',

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

    // ─ Gaz / Stations d'essence ─
    'petro-canada':    'petro-canada.ca',
    'petrocanada':     'petro-canada.ca',
    'shell':           'shell.ca',
    'esso':            'esso.ca',
    'ultramar':        'ultramar.ca',
    'irving':          'irvingoil.com',
    'couche-tard':     'couche-tard.com',
    'pioneer':         'pioneerenergie.com',
    'costco':          'costco.ca',
    'canadian tire':   'canadiantire.ca',
    'race trac':       'racetrac.com',

    // ─ Transport ─
    'uber':            'uber.com',
    'lyft':            'lyft.com',
    'uber eats':       'ubereats.com',
    'taxi coop':       'taxicoop.qc.ca',
    'taxi diamond':    'taxidiamond.com',
    'alto':            'alto.com',
    'teo taxi':        'teotaxi.ca',
    'stm':             'stm.info',
    'rtc':             'rtcquebec.ca',
    'exo':             'exo.quebec',
    'opus':            'stm.info',
    'bixi':            'bixi.com',
    'communauto':      'communauto.com',
    'via rail':        'viarail.ca',
    'via':             'viarail.ca',

    // ─ Assurance ─
    'intact':          'intact.ca',
    'desjardins':      'desjardins.com',
    'belairdirect':    'belairdirect.com',
    'belair':          'belairdirect.com',
    'td assurance':    'tdassurance.com',
    'la capitale':     'lacapitale.com',
    'industrielle alliance': 'ia.ca',
    'ia assurance':    'ia.ca',
    'ia financière':   'ia.ca',
    'sonnet':          'sonnet.ca',
    'promutuel':       'promutuel.ca',
    'blue cross':      'bluecross.ca',
    'croix bleue':     'bluecross.ca',
    'sun life':        'sunlife.ca',
    'manuvie':         'manulife.ca',
    'great-west':      'greatwestlife.com',
    'ssq':             'ssq.ca',
    'empire life':     'empire.ca',

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

    // ─ Café ─
    'starbucks':       'starbucks.com',
    'tim hortons':     'timhortons.com',
    'tim':             'timhortons.com',
    'second cup':      'secondcup.com',
    'van houtte':      'vanhoutte.com',
    'café dépôt':      'cafedepot.ca',
    'cafe depot':      'cafedepot.ca',
    'mcdonalds':       'mcdonalds.com',
    "mcdonald's":      'mcdonalds.com',

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
    gaz: [
        { name: 'Petro-Canada',  domain: 'petro-canada.ca'   },
        { name: 'Shell',         domain: 'shell.ca'           },
        { name: 'Esso',          domain: 'esso.ca'            },
        { name: 'Ultramar',      domain: 'ultramar.ca'        },
        { name: 'Irving',        domain: 'irvingoil.com'      },
        { name: 'Couche-Tard',   domain: 'couche-tard.com'    },
        { name: 'Pioneer',       domain: 'pioneerenergie.com'  },
        { name: 'Costco',        domain: 'costco.ca'          },
        { name: 'Canadian Tire', domain: 'canadiantire.ca'    },
        { name: 'Autre',         domain: null                 },
    ],
    transport: [
        { name: 'Uber',          domain: 'uber.com'         },
        { name: 'Taxi Coop',     domain: 'taxicoop.qc.ca'   },
        { name: 'Taxi Diamond',  domain: 'taxidiamond.com'  },
        { name: 'Lyft',          domain: 'lyft.com'         },
        { name: 'STM',           domain: 'stm.info'         },
        { name: 'exo',           domain: 'exo.quebec'       },
        { name: 'BIXI',          domain: 'bixi.com'         },
        { name: 'Communauto',    domain: 'communauto.com'   },
        { name: 'Autre',         domain: null               },
    ],
    assurance: [
        { name: 'Intact',        domain: 'intact.ca'           },
        { name: 'Desjardins',    domain: 'desjardins.com'      },
        { name: 'Belairdirect',  domain: 'belairdirect.com'    },
        { name: 'La Capitale',   domain: 'ia.ca'               },
        { name: 'Sonnet',        domain: 'sonnet.ca'           },
        { name: 'Promutuel',     domain: 'promutuel.ca'        },
        { name: 'SSQ',           domain: 'ssq.ca'              },
        { name: 'Sun Life',      domain: 'sunlife.ca'          },
        { name: 'iA Financière', domain: 'ia.ca'               },
        { name: 'Blue Cross',    domain: 'bluecross.ca'     },
        { name: 'Autre',         domain: null                  },
    ],
    cafe: [
        { name: 'Starbucks',    domain: 'starbucks.com'   },
        { name: 'Tim Hortons',  domain: 'timhortons.com'  },
        { name: 'Second Cup',   domain: 'secondcup.com'   },
        { name: 'Van Houtte',   domain: 'vanhoutte.com'   },
        { name: 'Café Dépôt',   domain: 'cafedepot.ca'    },
        { name: 'Autre',        domain: null              },
    ],
    streaming: [
        { name: 'Netflix',              domain: 'netflix.com'        },
        { name: 'Amazon Prime Video',   domain: 'primevideo.com'     },
        { name: 'Crave',                domain: 'crave.ca'           },
        { name: 'Disney+',              domain: 'disneyplus.com'     },
        { name: 'Illico+',              domain: 'clubillico.com'          },
        { name: 'Tou.tv',               domain: 'tou.tv'             },
        { name: 'Apple TV+',            domain: 'tv.apple.com'       },
        { name: 'Paramount+',           domain: 'paramountplus.com'  },
        { name: 'Tubi',                 domain: 'tubitv.com'         },
        { name: 'BritBox',              domain: 'britbox.com'        },
        { name: 'Kanopy',               domain: 'kanopy.com'         },
        { name: 'Autre',                domain: null                 },
    ],
    auto: [
        { name: 'Toyota',       domain: 'toyota.com'        },
        { name: 'Honda',        domain: 'honda.com'         },
        { name: 'Ford',         domain: 'ford.com'          },
        { name: 'Hyundai',      domain: 'hyundai.com'       },
        { name: 'Kia',          domain: 'kia.com'           },
        { name: 'Mazda',        domain: 'mazda.com'         },
        { name: 'Nissan',       domain: 'nissan.com'        },
        { name: 'Chevrolet',    domain: 'chevrolet.com'     },
        { name: 'Volkswagen',   domain: 'volkswagen.com'    },
        { name: 'Subaru',       domain: 'subaru.com'        },
        { name: 'Tesla',        domain: 'tesla.com'         },
        { name: 'BMW',          domain: 'bmw.com'           },
        { name: 'Mercedes',     domain: 'mercedes-benz.com' },
        { name: 'Audi',         domain: 'audi.com'          },
        { name: 'Jeep',         domain: 'jeep.com'          },
        { name: 'Dodge',        domain: 'dodge.com'         },
        { name: 'RAM',          domain: 'ramtrucks.com'     },
        { name: 'GMC',          domain: 'gmc.com'           },
        { name: 'Volvo',        domain: 'volvocars.com'     },
        { name: 'Autre',        domain: null                },
    ],
};

// ── Catégories pour lesquelles on peut tenter un domaine deviné ─────────────
const _FAVICON_CATS = new Set(['streaming', 'cell', 'internet', 'gym', 'loisir', 'electricite', 'auto']);

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
