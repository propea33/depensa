// ── Accordion : sections ─────────────────────────────

document.querySelectorAll('.help-block-header').forEach(header => {
  header.addEventListener('click', () => {
    const block = header.closest('.help-block');
    const isOpen = block.classList.contains('open');
    // Close all others
    document.querySelectorAll('.help-block.open').forEach(b => b.classList.remove('open'));
    if (!isOpen) block.classList.add('open');
  });
});

// ── Accordion : FAQ ───────────────────────────────────

document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    item.classList.toggle('open');
  });
});

// ── Quick nav chips → scroll + auto-open ─────────────

document.querySelectorAll('.quick-chip[data-target]').forEach(chip => {
  chip.addEventListener('click', () => {
    const target = document.getElementById(chip.dataset.target);
    if (!target) return;
    target.classList.add('open');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
