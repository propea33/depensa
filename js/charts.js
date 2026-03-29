// ═══════════════════════════════════════════════════════
//  CHARTS
// ═══════════════════════════════════════════════════════

// External HTML tooltip handler — renders below the donut, never overlaps center
function externalDonutTooltip(context) {
    const el = $('donut-tooltip');
    const { tooltip } = context;

    if (tooltip.opacity === 0) {
        el.style.opacity = '0';
        return;
    }

    const i     = tooltip.dataPoints[0].dataIndex;
    const chart = context.chart;
    const val   = chart.data.datasets[0].data[i];
    const total = chart.data.datasets[0].data.reduce((a,b) => a+b, 0);
    const pct   = Math.round(val / total * 100);
    const name  = chart.data.labels[i];
    const color = chart.data.datasets[0].borderColor[i];

    el.innerHTML = `
        <div class="tt-dot" style="background:${color}"></div>
        <span class="tt-name">${name}</span>
        <span>${fmt(val)}/mois</span>
        <span>·</span>
        <span>${pct}%</span>
    `;
    el.style.opacity = '1';
}

function buildDonutData() {
    return buildDonutDataFrom(getSelectedExpenses());
}

function tooltipDefaults(bodyColor) {
    bodyColor = bodyColor || '#a855f7';
    return {
        backgroundColor: 'rgba(10,13,28,0.96)',
        titleColor: '#e8eaf6',
        bodyColor: bodyColor,
        borderColor: 'rgba(124,58,237,0.3)',
        borderWidth: 1,
        padding: 13,
        cornerRadius: 12,
        displayColors: false,
    };
}

function initDonut() {
    const ctx = $('donutChart').getContext('2d');
    const d = buildDonutData();

    // Plugin: draw label + value in the center of the donut on canvas
    // Uses afterDatasetsDraw so it runs BEFORE tooltips are painted
    const centerTextPlugin = {
        id: 'centerText',
        afterDatasetsDraw(chart) {
            const { ctx: c, chartArea } = chart;
            const cx = (chartArea.left + chartArea.right) / 2;
            const cy = (chartArea.top  + chartArea.bottom) / 2;
            const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
            const textColor  = isDark ? '#e8eaf6' : '#1a1f36';
            const labelColor = isDark ? '#8090aa' : '#5a6478';

            c.save();
            c.textAlign    = 'center';
            c.textBaseline = 'middle';

            // Always show total in center (reflects selected month)
            const centreTotal = getSelectedExpenses().reduce((s,e) => s + e.amount, 0);
            c.font      = '500 12px Figtree, sans-serif';
            c.fillStyle = labelColor;
            c.fillText('Total / mois', cx, cy - 14);

            c.font      = '800 22px Outfit, sans-serif';
            c.fillStyle = textColor;
            c.fillText(fmt(centreTotal), cx, cy + 10);

            c.restore();
        }
    };

    donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: d.labels,
            datasets: [{
                data: d.data,
                backgroundColor: d.colors,
                borderColor: d.borders,
                borderWidth: 2,
                hoverOffset: 0,          // no popping — keeps perfect circle
                borderRadius: 3,         // subtle rounded arc ends
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            cutout: '70%',
            animation: { duration: 900, easing: 'easeInOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: externalDonutTooltip,
                },
            },
        },
        plugins: [centerTextPlugin],
    });
}

function updateDonut() {
    if (!donutChart) return;
    const d = buildDonutData();
    donutChart.data.labels = d.labels;
    donutChart.data.datasets[0].data    = d.data;
    donutChart.data.datasets[0].backgroundColor = d.colors;
    donutChart.data.datasets[0].borderColor      = d.borders;
    donutChart.update('active');
}

function historyData() {
    return [...HISTORY, { month:'Mars ●', total: totalMonthly() }];
}

function updateHistoryTrend() {
    const data = historyData();
    const prev = data[data.length - 2].total;
    const curr = data[data.length - 1].total;
    const diff = curr - prev;
    const pct  = Math.round(Math.abs(diff) / prev * 100);
    const el   = $('historyTrend');
    el.textContent = diff > 0 ? `▲ +${pct}% vs fév.` : `▼ -${pct}% vs fév.`;
    el.className   = 'history-trend ' + (diff > 0 ? 'up' : 'down');
}

function initSavings() {
    const canvas = $('savingsChart');
    const ctx    = canvas.getContext('2d');
    const data   = historyData();
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    const grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, 'rgba(124,58,237,0.28)');
    grad.addColorStop(1, 'rgba(124,58,237,0)');

    const tickColor = isDark ? '#3d4a60' : '#b0b9cc';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

    const pointRadius  = data.map((_, i) => i === data.length - 1 ? 5 : 3);
    const pointBg      = data.map((_, i) => i === data.length - 1 ? '#a855f7' : '#7c3aed');
    const pointBorder  = data.map((_, i) => i === data.length - 1 ? '#fff' : 'transparent');
    const pointBorderW = data.map((_, i) => i === data.length - 1 ? 2 : 0);

    const FULL_LABELS = {
        'Oct': 'Octobre 2025', 'Nov': 'Novembre 2025', 'Déc': 'Décembre 2025',
        'Jan': 'Janvier 2026', 'Fév': 'Février 2026', 'Mars ●': 'Mars 2026',
    };

    let _hoverIdx = -1;

    // ── Hairline plugin ──────────────────────────────────
    const hairlinePlugin = {
        id: 'hairline',
        afterDraw(chart) {
            if (_hoverIdx < 0) return;
            const meta = chart.getDatasetMeta(0);
            if (!meta.data[_hoverIdx]) return;
            const x = meta.data[_hoverIdx].x;
            const { top, bottom } = chart.chartArea;
            const c = chart.ctx;
            c.save();
            const g = c.createLinearGradient(0, top, 0, bottom);
            g.addColorStop(0, 'rgba(168,85,247,0.85)');
            g.addColorStop(1, 'rgba(168,85,247,0)');
            c.beginPath();
            c.moveTo(x, top);
            c.lineTo(x, bottom);
            c.strokeStyle = g;
            c.lineWidth = 1.5;
            c.stroke();
            // Dot on the data point
            const ptY = meta.data[_hoverIdx].y;
            c.beginPath();
            c.arc(x, ptY, 5, 0, Math.PI * 2);
            c.fillStyle = '#a855f7';
            c.fill();
            c.strokeStyle = '#fff';
            c.lineWidth = 2;
            c.stroke();
            c.restore();
        }
    };

    savingsChart = new Chart(ctx, {
        type: 'line',
        plugins: [hairlinePlugin],
        data: {
            labels: data.map(d => d.month),
            datasets: [{
                data: data.map(d => d.total),
                borderColor: '#7c3aed',
                backgroundColor: grad,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius,
                pointBackgroundColor: pointBg,
                pointBorderColor: pointBorder,
                pointBorderWidth: pointBorderW,
                pointHoverRadius: 0, // hairline plugin handles hover dot
                pointHoverBackgroundColor: 'transparent',
                pointHoverBorderColor: 'transparent',
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 1000, easing: 'easeInOutQuart' },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: tickColor, font: { size: 11, family: 'Figtree' } },
                },
                y: {
                    grid: { color: gridColor, drawTicks: false },
                    border: { display: false },
                    ticks: {
                        color: tickColor,
                        font: { size: 10, family: 'Figtree' },
                        callback: v => '$' + v.toLocaleString('fr-CA'),
                        maxTicksLimit: 4,
                    },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
            },
        },
    });

    // ── Custom HTML tooltip ──────────────────────────────
    const wrap = canvas.parentElement;
    const tip  = $('chartTooltipCard');

    function getNearestIdx(mouseX) {
        const meta = savingsChart.getDatasetMeta(0);
        let minDist = Infinity, nearest = -1;
        meta.data.forEach((pt, i) => {
            const d = Math.abs(pt.x - mouseX);
            if (d < minDist) { minDist = d; nearest = i; }
        });
        return nearest;
    }

    function getExpList(idx) {
        return idx === data.length - 1 ? expenses : (HISTORY[idx]?.expenses || []);
    }

    function showTip(idx) {
        if (idx === _hoverIdx) return;
        _hoverIdx = idx;
        savingsChart.update('none');

        const month  = data[idx];
        const label  = FULL_LABELS[month.month] || month.month.replace(' ●', '');
        const expList = getExpList(idx);
        const top3   = [...expList].sort((a, b) => b.amount - a.amount).slice(0, 3);

        const pills = top3.map(e => {
            const cat = getCAT(e.cat);
            return `<div class="ctip-pill">
                <span class="ctip-pill-icon">${cat.icon}</span>
                <span class="ctip-pill-name">${e.name}</span>
                <span class="ctip-pill-amount">${fmt(e.amount)}</span>
            </div>`;
        }).join('');

        tip.innerHTML = `
            <div class="ctip-month">${label}</div>
            <div class="ctip-total">${fmt(month.total)}</div>
            <div class="ctip-pills">${pills}</div>
            <div class="ctip-hint">Cliquez pour voir le détail →</div>
        `;

        tip.style.display = 'block';
        const meta  = savingsChart.getDatasetMeta(0);
        const ptX   = meta.data[idx].x;
        const canvasRect = canvas.getBoundingClientRect();
        const wrapRect   = wrap.getBoundingClientRect();
        const relX  = ptX + (canvasRect.left - wrapRect.left);
        const tipW  = tip.offsetWidth || 200;
        const wrapW = wrap.offsetWidth;
        let left    = relX - tipW / 2;
        left = Math.max(6, Math.min(left, wrapW - tipW - 6));
        tip.style.left = left + 'px';
        requestAnimationFrame(() => tip.classList.add('visible'));
    }

    function hideTip() {
        _hoverIdx = -1;
        tip.classList.remove('visible');
        savingsChart.update('none');
        setTimeout(() => { if (_hoverIdx < 0) tip.style.display = 'none'; }, 180);
    }

    canvas.addEventListener('mousemove', e => {
        const rect   = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const { left: aLeft, right: aRight } = savingsChart.chartArea;
        if (mouseX < aLeft || mouseX > aRight) { hideTip(); canvas.style.cursor = 'default'; return; }
        canvas.style.cursor = 'pointer';
        showTip(getNearestIdx(mouseX));
    });

    canvas.addEventListener('mouseleave', hideTip);

    canvas.addEventListener('click', e => {
        const rect   = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const { left: aLeft, right: aRight } = savingsChart.chartArea;
        if (mouseX < aLeft || mouseX > aRight) return;
        const idx  = getNearestIdx(mouseX);
        if (idx < 0) return;
        const month   = data[idx];
        const expList = getExpList(idx);
        openHistoryModal(month.month.replace(' ●', ''), expList);
    });

    updateHistoryTrend();
}

function updateSavingsChartColors() {
    if (!savingsChart) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tickColor = isDark ? '#3d4a60' : '#b0b9cc';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    savingsChart.options.scales.x.ticks.color = tickColor;
    savingsChart.options.scales.y.ticks.color = tickColor;
    savingsChart.options.scales.y.grid.color  = gridColor;
    savingsChart.update();
}

function updateHistoryChart() {
    if (!savingsChart) return;
    const data = historyData();
    savingsChart.data.datasets[0].data = data.map(d => d.total);
    savingsChart.update('active');
    updateHistoryTrend();
}

// ═══════════════════════════════════════════════════════
//  SIMULATION DONUT CHART (inline overlay mode)
// ═══════════════════════════════════════════════════════

function buildSimDonutData() {
    // Build grouped data using effectiveMonthly (simulation overrides active)
    const grouped = {};
    expenses.forEach(e => {
        const m = effectiveMonthly(e);
        if (m > 0) grouped[e.cat] = (grouped[e.cat] || 0) + m;
    });
    const entries = Object.entries(grouped).sort((a,b) => b[1]-a[1]);
    const borders = entries.map(([id]) => amberize(getCAT(id).color));
    return {
        labels:  entries.map(([id]) => getCAT(id).name),
        data:    entries.map(([,v]) => v),
        colors:  borders.map(c => c + 'bb'),
        borders,
    };
}

function externalSimTooltip(context) {
    const el = $('simDonutTooltip');
    const { tooltip } = context;
    if (tooltip.opacity === 0) { el.style.opacity='0'; return; }
    const i     = tooltip.dataPoints[0].dataIndex;
    const chart = context.chart;
    const val   = chart.data.datasets[0].data[i];
    const total = chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
    const pct   = Math.round(val/total*100);
    const name  = chart.data.labels[i];
    const color = chart.data.datasets[0].borderColor[i];
    el.innerHTML = `<div class="tt-dot" style="background:${color}"></div><span class="tt-name">${name}</span><span>${fmt(val)}/mois</span><span>·</span><span>${pct}%</span>`;
    el.style.opacity='1';
}

function initSimDonut() {
    if (simDonutChartInst) { simDonutChartInst.destroy(); simDonutChartInst = null; }
    const ctx = $('simDonutChart').getContext('2d');
    const d   = buildSimDonutData();

    const simCenterPlugin = {
        id: 'simCenterText',
        afterDatasetsDraw(chart) {
            const { ctx:c, chartArea } = chart;
            const cx = (chartArea.left+chartArea.right)/2;
            const cy = (chartArea.top+chartArea.bottom)/2;
            c.save();
            c.textAlign='center'; c.textBaseline='middle';
            c.font='500 11px Figtree,sans-serif';
            c.fillStyle='#d97706';
            c.fillText('🔬 Simulation', cx, cy-14);
            const simTotal = expenses.reduce((s,e)=>s+effectiveMonthly(e),0);
            c.font='800 22px Outfit,sans-serif';
            c.fillStyle='#f59e0b';
            c.fillText(fmt(simTotal), cx, cy+10);
            c.restore();
        }
    };

    simDonutChartInst = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: d.labels,
            datasets: [{
                data: d.data,
                backgroundColor: d.colors,
                borderColor: d.borders,
                borderWidth: 2,
                hoverOffset: 0,
                borderRadius: 3,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: true, aspectRatio: 1,
            cutout: '70%',
            animation: { duration: 700, easing:'easeInOutQuart' },
            plugins: {
                legend: { display:false },
                tooltip: { enabled:false, external:externalSimTooltip },
            },
        },
        plugins: [simCenterPlugin],
    });

    renderSimLegendAndDiff();
}

function updateSimDonut() {
    if (!simDonutChartInst) { initSimDonut(); return; }
    const d = buildSimDonutData();
    simDonutChartInst.data.labels = d.labels;
    simDonutChartInst.data.datasets[0].data            = d.data;
    simDonutChartInst.data.datasets[0].backgroundColor = d.colors;
    simDonutChartInst.data.datasets[0].borderColor     = d.borders;
    simDonutChartInst.update('active');
    renderSimLegendAndDiff();
}

function renderSimLegendAndDiff() {
    // Legend
    const d = buildSimDonutData();
    const total = d.data.reduce((a,b)=>a+b,0);
    const legend = $('simLegend');
    legend.innerHTML = '';
    d.labels.forEach((label,i) => {
        const pct = total ? Math.round(d.data[i]/total*100) : 0;
        const div = document.createElement('div');
        div.className = 'legend-item';
        div.innerHTML = `<div class="legend-dot" style="background:${d.borders[i]}"></div><span>${label}</span><span class="legend-pct">${pct}%</span>`;
        legend.appendChild(div);
    });

    // Diff vs real
    const realTotal = expenses.reduce((s,e)=>s+monthlyAmount(e),0);
    const simTotal  = expenses.reduce((s,e)=>s+effectiveMonthly(e),0);
    const diff = realTotal - simTotal;
    const diffEl = $('simDiffRow');
    diffEl.innerHTML = `
        <div style="text-align:center">
            <div class="sim-diff-val">${fmt(realTotal)}</div>
            <div style="font-size:10px;color:var(--text-2);margin-top:2px">Réel/mois</div>
        </div>
        <div style="text-align:center;font-size:20px;color:var(--text-3)">→</div>
        <div style="text-align:center">
            <div class="sim-diff-val">${fmt(simTotal)}</div>
            <div style="font-size:10px;color:var(--text-2);margin-top:2px">Simulé/mois</div>
        </div>
        <div style="text-align:center">
            <div class="sim-diff-val ${diff>0?'saving':diff<0?'increase':''}">${diff>0?'-'+fmt(diff):diff<0?'+'+fmt(-diff):'='}  </div>
            <div style="font-size:10px;color:var(--text-2);margin-top:2px">${diff>0?'économie':diff<0?'augmentation':'aucun écart'}</div>
        </div>
    `;
}

function destroySimDonut() {
    if (simDonutChartInst) { simDonutChartInst.destroy(); simDonutChartInst = null; }
    $('simDonutCard').classList.remove('active');
    const legend = $('simLegend');
    if (legend) legend.innerHTML = '';
    const diff = $('simDiffRow');
    if (diff) diff.innerHTML = '';
}

// ═══════════════════════════════════════════════════════
//  SIMULATION SECTION DONUT CHART
// ═══════════════════════════════════════════════════════

function buildSimSectionDonutData() {
    const grouped = {};
    simExpenses.forEach(e => { grouped[e.cat] = (grouped[e.cat] || 0) + monthlyAmount(e); });
    const entries = Object.entries(grouped).sort((a,b) => b[1]-a[1]);
    const borders = entries.map(([id]) => amberize(getCAT(id).color));
    return { labels: entries.map(([id]) => getCAT(id).name), data: entries.map(([,v]) => v), colors: borders.map(c=>c+'bb'), borders };
}

function externalSimSectionTooltip(context) {
    const el = $('simDonutTip');
    const { tooltip } = context;
    if (tooltip.opacity === 0) { el.style.opacity='0'; return; }
    const i=tooltip.dataPoints[0].dataIndex, chart=context.chart;
    const val=chart.data.datasets[0].data[i], total=chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
    const pct=Math.round(val/total*100), name=chart.data.labels[i], color=chart.data.datasets[0].borderColor[i];
    el.innerHTML=`<div class="tt-dot" style="background:${color}"></div><span class="tt-name">${name}</span><span>${fmt(val)}/mois</span><span>·</span><span>${pct}%</span>`;
    el.style.opacity='1';
}

function initSimSectionDonut() {
    const canvas = $('simDonutCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const d   = buildSimSectionDonutData();

    const plugin = {
        id:'simSectionCenter',
        afterDatasetsDraw(chart) {
            const {ctx:c,chartArea}=chart;
            const cx=(chartArea.left+chartArea.right)/2, cy=(chartArea.top+chartArea.bottom)/2;
            c.save(); c.textAlign='center'; c.textBaseline='middle';
            c.font='500 11px Figtree,sans-serif'; c.fillStyle='#d97706';
            c.fillText('Total simulé', cx, cy-14);
            c.font='800 22px Outfit,sans-serif'; c.fillStyle='#f59e0b';
            c.fillText(fmt(simTotalMonthly()), cx, cy+10);
            c.restore();
        }
    };

    simDonutInst = new Chart(ctx, {
        type:'doughnut',
        data:{ labels:d.labels, datasets:[{ data:d.data, backgroundColor:d.colors, borderColor:d.borders, borderWidth:2, hoverOffset:0, borderRadius:3 }] },
        options:{ responsive:true, maintainAspectRatio:true, aspectRatio:1, cutout:'70%',
            animation:{duration:700,easing:'easeInOutQuart'},
            plugins:{ legend:{display:false}, tooltip:{enabled:false,external:externalSimSectionTooltip} } },
        plugins:[plugin],
    });

    renderSimDonutLegend(d);
}

function updateSimSectionDonut() {
    if (!simDonutInst) { initSimSectionDonut(); return; }
    const d = buildSimSectionDonutData();
    simDonutInst.data.labels = d.labels;
    simDonutInst.data.datasets[0].data = d.data;
    simDonutInst.data.datasets[0].backgroundColor = d.colors;
    simDonutInst.data.datasets[0].borderColor = d.borders;
    simDonutInst.update('active');
    renderSimDonutLegend(d);
}

function renderSimDonutLegend(d) {
    const total = d.data.reduce((a,b)=>a+b,0);
    const el = $('simDonutLegend');
    if (!el) return;
    el.innerHTML = '';
    d.labels.forEach((label,i) => {
        const pct = total ? Math.round(d.data[i]/total*100) : 0;
        const div = document.createElement('div');
        div.className = 'legend-item';
        div.innerHTML = `<div class="legend-dot" style="background:${d.borders[i]}"></div><span>${label}</span><span class="legend-pct">${pct}%</span>`;
        el.appendChild(div);
    });
}
