// ═══════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════

// Built-in categories (custom ones are added dynamically to customCats)
const CATS = [
    { id:'habitation',  name:'Habitation',  icon:'🏠', color:'#6366f1' },
    { id:'electricite', name:'Électricité', icon:'⚡', color:'#f59e0b' },
    { id:'internet',    name:'Internet',    icon:'🌐', color:'#06b6d4' },
    { id:'cell',        name:'Téléphone',   icon:'📱', color:'#ec4899' },
    { id:'auto',        name:'Auto',        icon:'🚗', color:'#8b5cf6' },
    { id:'gaz',         name:'Gaz',         icon:'⛽', color:'#ef4444' },
    { id:'epicerie',    name:'Épicerie',    icon:'🛒', color:'#10b981' },
    { id:'streaming',   name:'Streaming',   icon:'📺', color:'#ef4444' },
    { id:'assurance',   name:'Assurance',   icon:'🛡️', color:'#14b8a6' },
    { id:'gym',         name:'Gym',         icon:'💪', color:'#f97316' },
    { id:'loisir',      name:'Loisir',      icon:'🎮', color:'#818cf8' },
    { id:'transport',   name:'Transport',   icon:'🚕', color:'#f59e0b' },
    { id:'cafe',        name:'Café',        icon:'☕', color:'#92400e' },
    { id:'restaurant',  name:'Restaurant',  icon:'🍽️', color:'#fb7185' },
    { id:'pharmacie',   name:'Pharmacie',   icon:'💊', color:'#10b981' },
    { id:'spectacles',  name:'Spectacles',  icon:'🎭', color:'#8b5cf6' },
    { id:'ecole',       name:'École',       icon:'🎓', color:'#3b82f6' },
    { id:'garderie',    name:'Garderie',    icon:'🧒', color:'#f472b6' },
    { id:'linge',       name:'Linge',       icon:'👕', color:'#a78bfa' },
    { id:'voyage',      name:'Voyage',      icon:'✈️', color:'#38bdf8' },
    { id:'autre',       name:'Autre…',      icon:'✏️', color:'#64748b', custom:true },
];

// Dynamically added user categories
let customCats = [];

let expenses = [
    { id:1,  name:'Loyer',               cat:'habitation',  amount:1450, recurring:true,  type:'fixe',     frequency:'mensuel', notes:'' },
    { id:2,  name:'Électricité',         cat:'electricite', amount:95,   recurring:true,  type:'variable', frequency:'mensuel', notes:'' },
    { id:3,  name:'Internet (Vidéotron)',cat:'internet',    amount:85,   recurring:true,  type:'fixe',     frequency:'mensuel', notes:'' },
    { id:4,  name:'Telus',               cat:'cell',        amount:95,   recurring:true,  type:'fixe',     frequency:'mensuel', notes:'' },
    { id:5,  name:'Honda',               cat:'auto',        amount:380,  recurring:true,  type:'variable', frequency:'mensuel', notes:'Assurance + essence' },
    { id:6,  name:'Épicerie',            cat:'epicerie',    amount:600,  recurring:false, type:'variable', frequency:'mensuel', notes:'' },
    { id:7,  name:'Netflix',             cat:'streaming',   amount:23,   recurring:true,  type:'fixe',     frequency:'mensuel', notes:'' },
    { id:8,  name:'Disney+',             cat:'streaming',   amount:14,   recurring:true,  type:'fixe',     frequency:'mensuel', notes:'' },
    { id:9,  name:'Crave',               cat:'streaming',   amount:20,   recurring:true,  type:'fixe',     frequency:'mensuel', notes:'' },
    { id:10, name:'Gym (Éconofitness)',  cat:'gym',         amount:25,   recurring:true,  type:'fixe',     frequency:'mensuel', notes:'' },
];

let nextId = 11;
let selCat  = 'habitation';

const RECS = [
    {
        id: 'cell', icon: '📱', color: '#ec4899',
        name: 'Forfait Téléphone',
        desc: 'Comparez les forfaits cellulaires au Québec',
        saveMonthly: 45, saveYearly: 540,
        dynamic: true,
    },
    {
        id: 'streaming', icon: '📺', color: '#ef4444',
        name: 'Abonnements Streaming',
        desc: 'Comparez vos abonnements aux prix du marché',
        saveMonthly: 34, saveYearly: 408,
        dynamic: true,
    },
    {
        id: 'internet', icon: '🌐', color: '#06b6d4',
        name: 'Internet',
        desc: 'Comparez les fournisseurs disponibles',
        saveMonthly: 25, saveYearly: 300,
        dynamic: true,
    },
];

// ── ISP + Cell Plans — chargés dynamiquement depuis le scraper GitHub ───────
const ISP_PRICES_URL  = 'https://raw.githubusercontent.com/propea33/isp-scraper/main/data/isp-prices.json';
const CELL_PRICES_URL = 'https://raw.githubusercontent.com/propea33/isp-scraper/main/data/cell-prices.json';
const STREAMING_PRICES_URL = 'https://raw.githubusercontent.com/propea33/streaming-scraper/main/data/streaming-prices.json';

// Valeurs par défaut (utilisées si le fetch échoue ou avant chargement)
let INTERNET_PLANS = [
    { provider:'Vidéotron', speed:'400 Mbps', price:85, type:'Câble', note:'',                url:'https://www.videotron.com/en/internet',                         scraped_ok:false },
    { provider:'Bell',      speed:'500 Mbps', price:80, type:'Fibre', note:'',                url:'https://www.bell.ca/Bell_Internet/Internet_access',             scraped_ok:false },
    { provider:'Cogeco',    speed:'400 Mbps', price:75, type:'Câble', note:'',                url:'https://www.cogeco.ca/en/internet/packages',                    scraped_ok:false },
    { provider:'Fizz',      speed:'400 Mbps', price:60, type:'Câble', note:'Réseau Vidéotron', url:'https://fizz.ca/en/internet',                                 scraped_ok:false },
    { provider:'EBOX',      speed:'120 Mbps', price:55, type:'Câble', note:'Réseau Vidéotron', url:'https://www.ebox.ca/en/quebec/residential/internet-packages/', scraped_ok:false },
    { provider:'Start.ca',  speed:'200 Mbps', price:50, type:'Câble', note:'Réseau Vidéotron', url:'https://www.start.ca/services/high-speed-internet',            scraped_ok:false },
    { provider:'VMedia',    speed:'120 Mbps', price:45, type:'Câble', note:'Réseau Bell',      url:'https://www.vmedia.ca/en/homeinternet',                        scraped_ok:false },
];

let ispPricesUpdatedAt  = null;   // timestamp de la dernière mise à jour ISP
let cellPricesUpdatedAt = null;   // timestamp de la dernière mise à jour Cell
let streamingPricesUpdatedAt = null; // timestamp de la dernière mise à jour Streaming

async function loadISPPrices() {
    // Ne pas fetcher si l'URL est encore le placeholder
    if (ISP_PRICES_URL.includes('TON_USER')) return;
    try {
        const res  = await fetch(ISP_PRICES_URL + '?t=' + Date.now()); // cache-bust
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        // Les URLs viennent toujours des valeurs hardcodées dans data.js, jamais du JSON scrapé
        const fallbackUrls = Object.fromEntries(INTERNET_PLANS.map(p => [p.provider, p.url]));
        INTERNET_PLANS = data.plans.map(p => ({
            provider:   p.provider,
            speed:      p.speed_down + ' Mbps',
            price:      p.price,
            type:       p.type,
            note:       p.promo ? '🔥 Promo' : (p.note || ''),
            url:        fallbackUrls[p.provider] || p.url,
            scraped_ok: p.scraped_ok,
            promo:      p.promo,
            promo_note: p.promo_note || '',
        }));

        ispPricesUpdatedAt = data.updated_at;
        console.log('[Depensa] Prix ISP chargés (' + data.updated_at + ') — ' +
            data.scraped_count + ' scrapés, ' + data.fallback_count + ' fallback');
    } catch (e) {
        console.warn('[Depensa] Impossible de charger les prix ISP — données par défaut utilisées.', e);
    }
}

// ── Cell Plans — chargé dynamiquement depuis le scraper GitHub ──────────────
// Valeurs par défaut (forfaits ~15 Go comparables, Québec)
let CELL_PLANS = [
    { provider:'Telus',         data_gb:15, price:95, network:'Telus',     plan_name:'15 Go', url:'https://www.telus.com/en/mobility/plans',                                    scraped_ok:false },
    { provider:'Fido',          data_gb:15, price:65, network:'Rogers',    plan_name:'15 Go', url:'https://www.fido.ca/fr/forfaits',                                             scraped_ok:false },
    { provider:'Koodo',         data_gb:15, price:60, network:'Telus',     plan_name:'15 Go', url:'https://www.koodomobile.com/en/shop/mobility/bring-your-own-phone',           scraped_ok:false },
    { provider:'Vidéotron',     data_gb:15, price:58, network:'Vidéotron', plan_name:'15 Go', url:'https://www.videotron.com/en/mobile/cell-phone-plans',                        scraped_ok:false },
    { provider:'Public Mobile', data_gb:15, price:55, network:'Telus',     plan_name:'15 Go', url:'https://www.publicmobile.ca/en/plans',                                        scraped_ok:false },
    { provider:'Fizz',          data_gb:15, price:50, network:'Vidéotron', plan_name:'15 Go', url:'https://fizz.ca/en/mobile',                                                   scraped_ok:false },
    { provider:'Lucky Mobile',  data_gb:15, price:45, network:'Bell',      plan_name:'15 Go', url:'https://www.luckymobile.ca/shop/plans',                                       scraped_ok:false },
    { provider:'Chatr',         data_gb:10, price:40, network:'Rogers',    plan_name:'10 Go', url:'https://www.chatrwireless.com/plans',                                         scraped_ok:false },
];

async function loadCellPrices() {
    try {
        const res  = await fetch(CELL_PRICES_URL + '?t=' + Date.now());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        const cellFallbackUrls = Object.fromEntries(CELL_PLANS.map(p => [p.provider, p.url]));
        CELL_PLANS = data.plans.map(p => ({
            provider:   p.provider,
            data_gb:    p.data_gb,
            price:      p.price,
            network:    p.network || '',
            plan_name:  p.plan_name || (p.data_gb + ' Go'),
            url:        cellFallbackUrls[p.provider] || p.url,
            scraped_ok: p.scraped_ok,
        }));

        cellPricesUpdatedAt = data.updated_at;
        console.log('[Depensa] Prix cell chargés (' + data.updated_at + ') — ' +
            data.scraped_count + ' scrapés, ' + data.fallback_count + ' fallback');
    } catch (e) {
        console.warn('[Depensa] Impossible de charger les prix cell — données par défaut utilisées.', e);
    }
}

// ── Streaming Plans — chargé dynamiquement depuis le scraper GitHub ────────
let STREAMING_PLANS = [
    { provider:'Netflix',      plan_name:'Standard avec pub', price:8,  url:'https://www.netflix.com/ca/',                   scraped_ok:false, previous_price:null, delta:0, price_drop:false },
    { provider:'Amazon Prime', plan_name:'Prime Video',       price:10, url:'https://www.primevideo.com/',                   scraped_ok:false, previous_price:null, delta:0, price_drop:false },
    { provider:'Crave',        plan_name:'De base avec pubs', price:12, url:'https://www.crave.ca/en/subscribe',             scraped_ok:false, previous_price:null, delta:0, price_drop:false },
    { provider:'Disney+',      plan_name:'Standard avec pub', price:8,  url:'https://www.disneyplus.com/en-ca',              scraped_ok:false, previous_price:null, delta:0, price_drop:false },
    { provider:'Illico+',      plan_name:'Mensuel',           price:7,  url:'https://www.videotron.com/television/illico-plus', scraped_ok:false, previous_price:null, delta:0, price_drop:false },
    { provider:'Tou.tv',       plan_name:'Extra',             price:7,  url:'https://ici.tou.tv/abonnement',                 scraped_ok:false, previous_price:null, delta:0, price_drop:false },
    { provider:'Apple TV+',    plan_name:'Mensuel',           price:13, url:'https://tv.apple.com/ca',                       scraped_ok:false, previous_price:null, delta:0, price_drop:false },
    { provider:'Paramount+',   plan_name:'Mensuel',           price:10, url:'https://www.paramountplus.com/ca/',             scraped_ok:false, previous_price:null, delta:0, price_drop:false },
    { provider:'Tubi',         plan_name:'Gratuit (pub)',     price:0,  url:'https://tubitv.com/',                           scraped_ok:false, previous_price:null, delta:0, price_drop:false },
];

async function loadStreamingPrices() {
    try {
        const res  = await fetch(STREAMING_PRICES_URL + '?t=' + Date.now());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        const fallbackUrls = Object.fromEntries(STREAMING_PLANS.map(p => [p.provider.toLowerCase(), p.url]));
        STREAMING_PLANS = (data.plans || []).map(p => ({
            provider:       p.provider,
            plan_name:      p.plan_name || 'Mensuel',
            price:          p.price,
            url:            fallbackUrls[(p.provider || '').toLowerCase()] || p.url,
            scraped_ok:     p.scraped_ok,
            previous_price: (typeof p.previous_price === 'number') ? p.previous_price : null,
            delta:          (typeof p.delta === 'number') ? p.delta : 0,
            price_drop:     !!p.price_drop,
        }));

        streamingPricesUpdatedAt = data.updated_at;
        console.log('[Depensa] Prix streaming chargés (' + data.updated_at + ') — ' +
            data.scraped_count + ' scrapés, ' + data.fallback_count + ' fallback');
    } catch (e) {
        console.warn('[Depensa] Impossible de charger les prix streaming — données par défaut utilisées.', e);
    }
}

// ── Monthly history (Oct→Fév) + Mars live ──────────────
const HISTORY = [
    { month:'Oct', total:2620, expenses:[
        { name:'Loyer',               cat:'habitation',  amount:1450, recurring:true  },
        { name:'Électricité',         cat:'electricite', amount:80,   recurring:true  },
        { name:'Internet (Vidéotron)',cat:'internet',    amount:85,   recurring:true  },
        { name:'Telus',               cat:'cell',        amount:95,   recurring:true  },
        { name:'Auto',                cat:'auto',        amount:350,  recurring:true  },
        { name:'Épicerie',            cat:'epicerie',    amount:530,  recurring:false },
        { name:'Netflix',             cat:'streaming',   amount:23,   recurring:true  },
        { name:'Disney+',             cat:'streaming',   amount:14,   recurring:true  },
        { name:'Gym (Éconofitness)',  cat:'gym',         amount:25,   recurring:true  },
    ]},
    { month:'Nov', total:2755, expenses:[
        { name:'Loyer',               cat:'habitation',  amount:1450, recurring:true  },
        { name:'Électricité',         cat:'electricite', amount:105,  recurring:true  },
        { name:'Internet (Vidéotron)',cat:'internet',    amount:85,   recurring:true  },
        { name:'Telus',               cat:'cell',        amount:95,   recurring:true  },
        { name:'Auto',                cat:'auto',        amount:370,  recurring:true  },
        { name:'Épicerie',            cat:'epicerie',    amount:560,  recurring:false },
        { name:'Netflix',             cat:'streaming',   amount:23,   recurring:true  },
        { name:'Disney+',             cat:'streaming',   amount:14,   recurring:true  },
        { name:'Crave',               cat:'streaming',   amount:20,   recurring:true  },
        { name:'Gym (Éconofitness)',  cat:'gym',         amount:25,   recurring:true  },
        { name:'Black Friday',        cat:'linge',       amount:108,  recurring:false },
    ]},
    { month:'Déc', total:3180, expenses:[
        { name:'Loyer',               cat:'habitation',  amount:1450, recurring:true  },
        { name:'Électricité',         cat:'electricite', amount:145,  recurring:true  },
        { name:'Internet (Vidéotron)',cat:'internet',    amount:85,   recurring:true  },
        { name:'Telus',               cat:'cell',        amount:95,   recurring:true  },
        { name:'Auto',                cat:'auto',        amount:420,  recurring:true  },
        { name:'Épicerie',            cat:'epicerie',    amount:780,  recurring:false },
        { name:'Netflix',             cat:'streaming',   amount:23,   recurring:true  },
        { name:'Disney+',             cat:'streaming',   amount:14,   recurring:true  },
        { name:'Crave',               cat:'streaming',   amount:20,   recurring:true  },
        { name:'Gym (Éconofitness)',  cat:'gym',         amount:25,   recurring:true  },
        { name:'Cadeaux des fêtes',   cat:'loisir',      amount:123,  recurring:false },
    ]},
    { month:'Jan', total:2540, expenses:[
        { name:'Loyer',               cat:'habitation',  amount:1450, recurring:true  },
        { name:'Électricité',         cat:'electricite', amount:120,  recurring:true  },
        { name:'Internet (Vidéotron)',cat:'internet',    amount:85,   recurring:true  },
        { name:'Telus',               cat:'cell',        amount:95,   recurring:true  },
        { name:'Auto',                cat:'auto',        amount:320,  recurring:true  },
        { name:'Épicerie',            cat:'epicerie',    amount:520,  recurring:false },
        { name:'Netflix',             cat:'streaming',   amount:23,   recurring:true  },
        { name:'Disney+',             cat:'streaming',   amount:14,   recurring:true  },
        { name:'Crave',               cat:'streaming',   amount:13,   recurring:true  },
        { name:'Gym (Éconofitness)',  cat:'gym',         amount:25,   recurring:true  },
    ]},
    { month:'Fév', total:2808, expenses:[
        { name:'Loyer',               cat:'habitation',  amount:1450, recurring:true  },
        { name:'Électricité',         cat:'electricite', amount:110,  recurring:true  },
        { name:'Internet (Vidéotron)',cat:'internet',    amount:85,   recurring:true  },
        { name:'Telus',               cat:'cell',        amount:95,   recurring:true  },
        { name:'Auto',                cat:'auto',        amount:380,  recurring:true  },
        { name:'Épicerie',            cat:'epicerie',    amount:580,  recurring:false },
        { name:'Netflix',             cat:'streaming',   amount:23,   recurring:true  },
        { name:'Disney+',             cat:'streaming',   amount:14,   recurring:true  },
        { name:'Crave',               cat:'streaming',   amount:18,   recurring:true  },
        { name:'Gym (Éconofitness)',  cat:'gym',         amount:25,   recurring:true  },
        { name:'Saint-Valentin',      cat:'restaurant',  amount:28,   recurring:false },
    ]},
];

// Returns "YYYY-MM" for today's month (e.g. "2026-03")
function liveMonthKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// Currently selected month for expense view (YYYY-MM key, live = current month)
let selectedMonth = liveMonthKey();

// Populated dynamically by initMonthSystem() in months.js
const MONTH_MAP    = {};
const MONTH_LABELS = {};

// Optimization score state
let savingsGoal = 150;
let appliedRecs  = new Set();
let dismissedHikeIds    = new Set(); // hike alert IDs dismissed by user
let dismissedSavingsIds = new Set(); // savings alert IDs dismissed by user

// Simulation state
let simulationMode = false;
let simOverrides = {};  // { expId: { amount, frequency } | null (= hidden) }

// Simulation section state
let simExpenses = [];
let simNextId   = 1000;
let editingTarget = 'real'; // 'real' | 'sim'
let simDonutInst  = null;
let simEditingId  = null;

// Modal state
let editingId  = null; // null = add mode, number = edit mode
let isRecurring = true; // default ON
let showRecurringOnly = false;

// Pending sim state
let pendingSimId   = null;
let pendingSimAmt  = null;

// Chart instances
let donutChart = null, savingsChart = null;
let simDonutChartInst = null;
