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
    const ctx  = $('savingsChart').getContext('2d');
    const data = historyData();
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    const grad = ctx.createLinearGradient(0, 0, 0, 148);
    grad.addColorStop(0, 'rgba(124,58,237,0.28)');
    grad.addColorStop(1, 'rgba(124,58,237,0)');

    const tickColor = isDark ? '#3d4a60' : '#b0b9cc';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

    // Point styles: last point is "live" (bigger, glowing)
    const pointRadius  = data.map((_, i) => i === data.length - 1 ? 5 : 3);
    const pointBg      = data.map((_, i) => i === data.length - 1 ? '#a855f7' : '#7c3aed');
    const pointBorder  = data.map((_, i) => i === data.length - 1 ? '#fff' : 'transparent');
    const pointBorderW = data.map((_, i) => i === data.length - 1 ? 2 : 0);

    savingsChart = new Chart(ctx, {
        type: 'line',
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
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#a855f7',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
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
                tooltip: {
                    ...tooltipDefaults('#a855f7'),
                    callbacks: {
                        title: items => items[0].label.replace(' ●', ' (en cours)'),
                        label: ctx => ` Total : ${fmt(ctx.parsed.y)}/mois`,
                    },
                },
            },
            onClick: (e, elements) => {
                if (!elements.length) return;
                const idx = elements[0].index;
                const data = historyData();
                const month = data[idx];
                const expList = idx === data.length - 1
                    ? expenses
                    : HISTORY[idx].expenses;
                openHistoryModal(month.month.replace(' ●', ''), expList);
            },
            onHover: (e, elements) => {
                e.native.target.style.cursor = elements.length ? 'pointer' : 'default';
            },
        },
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
