# Depensa — Finances Intelligentes

A personal finance tracker and optimizer built as a single-page app with vanilla HTML, CSS, and JavaScript.

## Project Structure

```
expense_tracker/
├── index.html          ← Shell HTML, DOM structure, CDN links, deferred script tags
├── css/
│   └── style.css       ← All CSS (variables, components, responsive, animations)
├── js/
│   ├── data.js         ← Global constants and state (CATS, expenses, RECS, HISTORY, INTERNET_PLANS, etc.)
│   ├── utils.js        ← Helper functions (fmt, $, getCAT, allCats, monthlyAmount, effectiveMonthly, totalMonthly, projectedYearly, amberize, showToast, detectPriceHikes, buildDonutDataFrom, potentialSavingsMonthly, appliedSavingsMonthly, generateRoastLines, generateVerdict)
│   ├── charts.js       ← Chart.js logic (initDonut, updateDonut, externalDonutTooltip, initSavings, updateHistoryChart, initSimDonut, updateSimDonut, renderSimLegendAndDiff, destroySimDonut, buildSimDonutData, initSimSectionDonut, updateSimSectionDonut, renderSimDonutLegend, externalSimSectionTooltip)
│   ├── modal.js        ← Modal logic (buildCatGrid, updateFormForCat, setRecurring, updateAmountLabel, openAddModal, openEditModal, closeModal, openHistoryModal, openSimModal, openSimAddModal, openSimEditModal)
│   ├── ui.js           ← UI rendering (getSelectedExpenses, renderExpenses, renderLegend, renderRecs, loadDynamicRec, applyRec, renderScoreBlock, renderTicker, renderSimGrid, renderSimTotals, simRender, openSimSection, closeSimSection, resetSimSection, runRoast, refresh, exportCSV, exportPDF, activateSimulation, deactivateSimulation, openRecSimulation)
│   └── main.js         ← Bootstrap: all event listeners, init calls
└── README.md
```

## Script Load Order

Scripts are loaded with `defer` in this exact order:

1. `data.js` — global state and constants
2. `utils.js` — helper functions (depends on data)
3. `charts.js` — Chart.js chart builders (depends on data + utils)
4. `modal.js` — modal open/close logic (depends on data + utils)
5. `ui.js` — DOM rendering functions (depends on all above)
6. `main.js` — event listeners + init calls (depends on all above)

## Features

- Monthly expense tracking with category breakdown (donut chart)
- Historical data (Oct 2025 – Mars 2026) with trend line chart
- Smart recommendations: telecom, streaming, internet ISP comparison
- Optimization score with savings goal
- Simulation zone: safely test budget scenarios without affecting real data
- AI-style "Roast Financier" budget analysis
- Price hike detection for fixed expenses
- Export to CSV or PDF
- Light/dark theme toggle
- Responsive mobile layout

## Tech Stack

- Vanilla HTML/CSS/JavaScript (no framework, no bundler)
- Chart.js 4.4.0 (via CDN)
- Google Fonts: Outfit + Figtree
