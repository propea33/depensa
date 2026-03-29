// ═══════════════════════════════════════════════════════
//  LANDING — Hamburger, scroll reveal, history chart
// ═══════════════════════════════════════════════════════

// ─── Hamburger menu ───────────────────────────────────

const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
document.addEventListener('click', e => {
  if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
    mobileMenu.classList.remove('open');
  }
});

// ─── Scroll reveal ────────────────────────────────────

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ─── Navbar scroll effect ─────────────────────────────

window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.background =
    window.scrollY > 20 ? 'rgba(8,11,18,.92)' : 'rgba(8,11,18,.7)';
});

// ─── History chart data ───────────────────────────────

const HIST_DATA = [
  { month: 'Oct', total: 2620, expenses: [
    { name: 'Loyer',          icon: '🏠', color: '#7c5af6', amount: 1450 },
    { name: 'Électricité',    icon: '⚡', color: '#f59e0b', amount: 80   },
    { name: 'Bell Internet',  domain: 'bell.ca',           color: '#4fa3f7', amount: 85   },
    { name: 'Cellulaire',     domain: 'telus.com',         color: '#34d399', amount: 95   },
    { name: 'Netflix',        domain: 'netflix.com',       color: '#ef4444', amount: 22   },
    { name: 'Éconofitness',   domain: 'econofitness.ca',   color: '#f59e0b', amount: 25   },
    { name: 'Auto',           icon: '🚗', color: '#a78bfa', amount: 420  },
    { name: 'Épicerie',       icon: '🛒', color: '#34d399', amount: 443  },
  ]},
  { month: 'Nov', total: 2755, expenses: [
    { name: 'Loyer',          icon: '🏠', color: '#7c5af6', amount: 1450 },
    { name: 'Électricité',    icon: '⚡', color: '#f59e0b', amount: 105  },
    { name: 'Bell Internet',  domain: 'bell.ca',           color: '#4fa3f7', amount: 85   },
    { name: 'Cellulaire',     domain: 'telus.com',         color: '#34d399', amount: 95   },
    { name: 'Netflix',        domain: 'netflix.com',       color: '#ef4444', amount: 22   },
    { name: 'Éconofitness',   domain: 'econofitness.ca',   color: '#f59e0b', amount: 25   },
    { name: 'Auto',           icon: '🚗', color: '#a78bfa', amount: 420  },
    { name: 'Épicerie',       icon: '🛒', color: '#34d399', amount: 553  },
  ]},
  { month: 'Déc', total: 3180, expenses: [
    { name: 'Loyer',          icon: '🏠', color: '#7c5af6', amount: 1450 },
    { name: 'Électricité',    icon: '⚡', color: '#f59e0b', amount: 145  },
    { name: 'Bell Internet',  domain: 'bell.ca',           color: '#4fa3f7', amount: 85   },
    { name: 'Cellulaire',     domain: 'telus.com',         color: '#34d399', amount: 95   },
    { name: 'Netflix',        domain: 'netflix.com',       color: '#ef4444', amount: 22   },
    { name: 'Éconofitness',   domain: 'econofitness.ca',   color: '#f59e0b', amount: 25   },
    { name: 'Auto',           icon: '🚗', color: '#a78bfa', amount: 420  },
    { name: 'Épicerie',       icon: '🛒', color: '#34d399', amount: 815  },
    { name: 'Cadeaux des fêtes', icon: '🎁', color: '#a855f7', amount: 123 },
  ]},
  { month: 'Jan', total: 2540, expenses: [
    { name: 'Loyer',          icon: '🏠', color: '#7c5af6', amount: 1600 },
    { name: 'Bell Internet',  domain: 'bell.ca',           color: '#4fa3f7', amount: 85   },
    { name: 'Netflix',        domain: 'netflix.com',       color: '#ef4444', amount: 22   },
    { name: 'Éconofitness',   domain: 'econofitness.ca',   color: '#f59e0b', amount: 20   },
    { name: 'Fizz',           domain: 'fizz.ca',           color: '#34d399', amount: 20   },
    { name: 'Épicerie',       icon: '🛒', color: '#34d399', amount: 793  },
  ]},
  { month: 'Fév', total: 2808, expenses: [
    { name: 'Loyer',          icon: '🏠', color: '#7c5af6', amount: 1600 },
    { name: 'Bell Internet',  domain: 'bell.ca',           color: '#4fa3f7', amount: 85   },
    { name: 'Netflix',        domain: 'netflix.com',       color: '#ef4444', amount: 22   },
    { name: 'Éconofitness',   domain: 'econofitness.ca',   color: '#f59e0b', amount: 20   },
    { name: 'Fizz',           domain: 'fizz.ca',           color: '#34d399', amount: 20   },
    { name: 'Épicerie',       icon: '🛒', color: '#34d399', amount: 1061 },
  ]},
  { month: 'Mars ●', total: 1747, expenses: [
    { name: 'Loyer',          icon: '🏠', color: '#7c5af6', amount: 1600 },
    { name: 'Bell Internet',  domain: 'bell.ca',           color: '#4fa3f7', amount: 85   },
    { name: 'Netflix',        domain: 'netflix.com',       color: '#ef4444', amount: 22   },
    { name: 'Éconofitness',   domain: 'econofitness.ca',   color: '#f59e0b', amount: 20   },
    { name: 'Fizz',           domain: 'fizz.ca',           color: '#34d399', amount: 20   },
  ]},
];

// ─── Helpers ──────────────────────────────────────────

function fmtAmt(n) {
  return '$\u00a0' + n.toLocaleString('fr-CA');
}

function expIconHTML(e) {
  if (e.domain) {
    const url = 'https://www.google.com/s2/favicons?domain=' + e.domain + '&sz=64';
    return `<img src="${url}" width="22" height="22" style="width:22px;height:22px;max-width:22px;max-height:22px;object-fit:contain;display:block;border-radius:5px;" alt="${e.name}">`;
  }
  return e.icon || '💰';
}

// ─── History modal ────────────────────────────────────

function openHistModal(idx) {
  const entry = HIST_DATA[idx];
  const label = entry.month.replace(' ●', '');
  document.getElementById('histModalTitle').textContent = 'Dépenses — ' + label;
  const total = entry.expenses.reduce((s, e) => s + e.amount, 0);
  const rows = entry.expenses.map(e => `
    <tr>
      <td><div class="hist-exp-cell">
        <div class="hist-exp-icon" style="background:${e.color}22;overflow:hidden;">${expIconHTML(e)}</div>
        ${e.name}
      </div></td>
      <td>${fmtAmt(e.amount)}</td>
    </tr>`).join('');
  document.getElementById('histModalBody').innerHTML = `
    <table class="hist-table">
      <thead><tr><th>Dépense</th><th style="text-align:right;">Montant</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td>Total mensuel</td><td>${fmtAmt(total)}</td></tr></tfoot>
    </table>`;
  document.getElementById('histOverlay').classList.add('open');
}

document.getElementById('histModalClose').addEventListener('click', () =>
  document.getElementById('histOverlay').classList.remove('open'));
document.getElementById('histOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('histOverlay'))
    document.getElementById('histOverlay').classList.remove('open');
});

// ─── History chart ────────────────────────────────────

window.addEventListener('load', () => {
  const ctx = document.getElementById('landingHistoryChart').getContext('2d');
  const labels = HIST_DATA.map(d => d.month);
  const values = HIST_DATA.map(d => d.total);

  const grad = ctx.createLinearGradient(0, 0, 0, 140);
  grad.addColorStop(0, 'rgba(124,90,246,0.3)');
  grad.addColorStop(1, 'rgba(124,90,246,0)');

  const pointR       = values.map((_, i) => i === values.length - 1 ? 5 : 3);
  const pointBg      = values.map((_, i) => i === values.length - 1 ? '#a855f7' : '#7c5af6');
  const pointBorder  = values.map((_, i) => i === values.length - 1 ? '#fff' : 'transparent');
  const pointBorderW = values.map((_, i) => i === values.length - 1 ? 2 : 0);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: '#7c5af6',
        backgroundColor: grad,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: pointR,
        pointBackgroundColor: pointBg,
        pointBorderColor: pointBorder,
        pointBorderWidth: pointBorderW,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#a855f7',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeInOutQuart' },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#4d5a72', font: { size: 11, family: 'Figtree' } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
          border: { display: false },
          ticks: {
            color: '#4d5a72',
            font: { size: 10, family: 'Figtree' },
            callback: v => '$' + v.toLocaleString('fr-CA'),
            maxTicksLimit: 4,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1120',
          borderColor: 'rgba(255,255,255,.12)',
          borderWidth: 1,
          titleColor: '#8892aa',
          bodyColor: '#f0f2f8',
          titleFont: { family: 'Figtree', size: 11 },
          bodyFont: { family: 'Figtree', size: 13, weight: '600' },
          padding: 10,
          cornerRadius: 10,
          callbacks: {
            title: items => items[0].label.replace(' ●', ' (en cours)'),
            label: c => ' Total : ' + fmtAmt(c.parsed.y) + '/mois',
          },
        },
      },
      onClick: (e, elements) => {
        if (!elements.length) return;
        openHistModal(elements[0].index);
      },
      onHover: (e, elements) => {
        e.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      },
    },
  });
});
