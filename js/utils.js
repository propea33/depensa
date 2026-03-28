// ═══════════════════════════════════════════════════════
//  HELPERS / UTILS
// ═══════════════════════════════════════════════════════

const $ = id => document.getElementById(id);
const fmt = n => '$' + Math.round(n).toLocaleString('fr-CA');

function allCats() { return [...CATS, ...customCats]; }

function getCAT(id) {
    return allCats().find(c => c.id === id) || { id, name:id, icon:'📦', color:'#64748b' };
}

function showToast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// Convert an expense to its monthly equivalent
function monthlyAmount(exp) {
    return exp.frequency === 'annuel' ? exp.amount / 12 : exp.amount;
}

// Return effective monthly amount for an expense (respects simulation overrides)
function effectiveMonthly(exp) {
    if (simulationMode && simOverrides.hasOwnProperty(exp.id)) {
        const ov = simOverrides[exp.id];
        if (ov === null) return 0;
        return ov.frequency === 'annuel' ? ov.amount / 12 : ov.amount;
    }
    return monthlyAmount(exp);
}

function totalMonthly(expList) {
    const list = expList || expenses;
    return list.reduce((s, e) => s + effectiveMonthly(e), 0);
}

function potentialSavingsMonthly() {
    return RECS.filter(r => !appliedRecs.has(r.id)).reduce((s, r) => s + r.saveMonthly, 0);
}

function appliedSavingsMonthly() {
    return RECS.filter(r => appliedRecs.has(r.id)).reduce((s, r) => s + r.saveMonthly, 0);
}

function projectedYearly() {
    const allTotals = [...HISTORY.map(h => h.total), totalMonthly()];
    const avg = allTotals.reduce((s, t) => s + t, 0) / allTotals.length;
    return Math.round(avg * 12);
}

// Blend a hex color 65% towards amber (#f59e0b) to create simulation palette
function amberize(hex) {
    const a = { r:245, g:158, b:11 };
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    const br = Math.round(r*0.35 + a.r*0.65);
    const bg = Math.round(g*0.35 + a.g*0.65);
    const bb = Math.round(b*0.35 + a.b*0.65);
    return `#${br.toString(16).padStart(2,'0')}${bg.toString(16).padStart(2,'0')}${bb.toString(16).padStart(2,'0')}`;
}

// Returns list of {curr, prev, pct} for fixed expenses that increased >10% vs previous month
function detectPriceHikes() {
    const prevMonth = HISTORY[HISTORY.length - 1]; // Fév
    if (!prevMonth) return [];
    const hikes = [];
    expenses.forEach(curr => {
        if (!curr.recurring) return;
        const prev = prevMonth.expenses.find(p => p.name === curr.name);
        if (!prev) return;
        const currAmt = monthlyAmount(curr);
        const prevAmt = prev.frequency === 'annuel' ? prev.amount / 12 : prev.amount;
        const pct = (currAmt - prevAmt) / prevAmt;
        if (pct > 0.10) hikes.push({ id: curr.id, name: curr.name, currAmt, prevAmt, pct });
    });
    return hikes;
}

function detectSavings() {
    const prevMonth = HISTORY[HISTORY.length - 1]; // mois précédent
    if (!prevMonth) return [];
    const savings = [];
    expenses.forEach(curr => {
        if (!curr.recurring) return;
        const prev = prevMonth.expenses.find(p => p.name === curr.name);
        if (!prev) return;
        const currAmt = monthlyAmount(curr);
        const prevAmt = prev.frequency === 'annuel' ? prev.amount / 12 : prev.amount;
        const saved = prevAmt - currAmt;
        if (saved >= 2) savings.push({ id: curr.id, name: curr.name, cat: curr.cat, currAmt, prevAmt, saved });
    });
    return savings;
}

function savingsMessage(s) {
    const saved  = fmt(s.saved);
    const yearly = fmt(s.saved * 12);
    let intro = '';
    switch (s.cat) {
        case 'restaurant': intro = `Vous êtes allés moins souvent au resto ce mois-ci 🍽️`; break;
        case 'streaming':  intro = `Vous avez réduit vos abonnements streaming 📺`; break;
        case 'cell':       intro = `Votre forfait cellulaire vous coûte moins cher 📱`; break;
        case 'internet':   intro = `Votre forfait Internet est moins cher ce mois-ci 📶`; break;
        case 'gym':        intro = `Votre abonnement gym vous coûte moins cher 🏋️`; break;
        case 'auto':       intro = `Vos dépenses auto ont diminué ce mois-ci 🚗`; break;
        case 'electricite':intro = `Votre facture d'électricité est moins élevée ⚡`; break;
        default:           intro = `<strong>${s.name}</strong> vous coûte moins cher ce mois-ci 💚`;
    }
    return `${intro} — <strong>Vous avez économisé ${saved}/mois</strong> vs le mois passé. En maintenant ce rythme : <strong>+${yearly} épargnés sur 1 an</strong> 🎉`;
}

function buildDonutDataFrom(expList) {
    const grouped = {};
    expList.forEach(e => { grouped[e.cat] = (grouped[e.cat] || 0) + effectiveMonthly(e); });
    const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    return {
        labels:  entries.map(([id]) => getCAT(id).name),
        data:    entries.map(([, v]) => v),
        colors:  entries.map(([id]) => getCAT(id).color + 'cc'),
        borders: entries.map(([id]) => getCAT(id).color),
        catIds:  entries.map(([id]) => id),
    };
}

function generateRoastLines() {
    const total  = totalMonthly();
    const yearly = total * 12;
    const lines  = [];

    const get = cat => expenses.find(e => e.cat === cat);
    const sum = cat => expenses.filter(e => e.cat === cat).reduce((s,e) => s + monthlyAmount(e), 0);

    // Cell
    const cell = get('cell');
    if (cell && monthlyAmount(cell) >= 80) {
        const waste = monthlyAmount(cell) - 50;
        lines.push({ icon:'📱', text:`<strong>${fmt(monthlyAmount(cell))}/mois</strong> pour ton cell — Fizz offre la même couverture Vidéotron à <strong>$50</strong>. T'as donné <strong>${fmt(waste * 12)}/an</strong> à Telus pour rien.` });
    }

    // Streaming stack
    const streams = expenses.filter(e => e.cat === 'streaming');
    const streamTotal = streams.reduce((s,e) => s + monthlyAmount(e), 0);
    if (streams.length >= 3) {
        lines.push({ icon:'📺', text:`<strong>${streams.length} services de streaming</strong> à <strong>${fmt(streamTotal)}/mois</strong>. T'as Netflix, Disney+ <em>et</em> Crave. Statistiquement, t'en regardes un seul. Les deux autres rient de toi.` });
    } else if (streams.length === 2 && streamTotal > 30) {
        lines.push({ icon:'📺', text:`${streams.map(e=>e.name).join(' + ')} à <strong>${fmt(streamTotal)}/mois</strong>. Le contenu se chevauche. Tu paies double pour regarder le même genre de films nuls.` });
    }

    // Internet
    const net = get('internet');
    if (net && monthlyAmount(net) > 65) {
        const cheapest = INTERNET_PLANS.reduce((a,b) => a.price < b.price ? a : b);
        const waste = monthlyAmount(net) - cheapest.price;
        lines.push({ icon:'🌐', text:`Internet à <strong>${fmt(monthlyAmount(net))}/mois</strong> alors que <strong>${cheapest.provider}</strong> offre du ${cheapest.speed} à <strong>$${cheapest.price}</strong>. T'as décidé de donner <strong>${fmt(waste * 12)}/an</strong> de plus par loyauté... ou par flemmardise.` });
    }

    // Grocery
    const groc = sum('epicerie');
    if (groc > 550) {
        lines.push({ icon:'🛒', text:`<strong>${fmt(groc)}/mois</strong> en épicerie. La moyenne québécoise solo c'est ~$350. T'achètes pour une famille ou t'as un problème avec le fromage artisanal?` });
    }

    // Rent comment
    const loyer = get('habitation');
    if (loyer && monthlyAmount(loyer) > 1400) {
        lines.push({ icon:'🏠', text:`Loyer à <strong>${fmt(monthlyAmount(loyer))}/mois</strong>. C'est ${Math.round(monthlyAmount(loyer)/total*100)}% de tes revenus dépensés qui partent direct au proprio. Espérons qu'il inclut le chauffage.` });
    }

    // Auto
    const auto = get('auto');
    if (auto && monthlyAmount(auto) > 350) {
        lines.push({ icon:'🚗', text:`<strong>${fmt(monthlyAmount(auto))}/mois</strong> pour l'auto. À Montréal avec le STM à $100/mois, t'aurais ${fmt((monthlyAmount(auto)-100)*12)}/an de plus. Juste une info.` });
    }

    // Total waste
    const saveable = RECS.filter(r => !appliedRecs.has(r.id)).reduce((s,r) => s + r.saveMonthly, 0);
    if (saveable >= 50) {
        lines.push({ icon:'🔥', text:`L'IA a repéré <strong>${fmt(saveable)}/mois de gaspillage optimisable</strong>. C'est <strong>${fmt(saveable*12)}/an</strong> que tu donnes à des corporations en souriant.` });
    }

    return lines;
}

function generateVerdict() {
    const total = totalMonthly();
    const saveable = RECS.filter(r => !appliedRecs.has(r.id)).reduce((s,r) => s + r.saveMonthly, 0);
    const pct = Math.round(saveable / total * 100);
    const verdicts = [
        `☠️ Verdict : tu gaspilles ${pct}% de tes dépenses mensuelles. Mais au moins, t'as un beau cell Telus.`,
        `☠️ Verdict : ${fmt(saveable*12)}/an de gaspillage. C'est un billet Miami retour, business class. Mais vas-y, garde Crave.`,
        `☠️ Verdict : ton budget ressemble à une table de poutine — beaucoup de fromage en trop. ${fmt(saveable)}/mois récupérables.`,
        `☠️ Verdict : si t'appliquais ces optimisations, t'aurais ${fmt(saveable)}/mois de plus. Mais c'est trop demander de changer de forfait cellulaire.`,
    ];
    return verdicts[Math.floor(Math.random() * verdicts.length)];
}
