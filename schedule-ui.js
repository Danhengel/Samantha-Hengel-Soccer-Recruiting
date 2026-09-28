(() => {
  const root = document.getElementById('fixtures');
  if (!root) return;

  const state = { mode: 'matches', events: [] };

  const esc = value => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const cleanTitle = title => String(title || '')
    .replace(/^CANCELLED\s*-\s*/i, '')
    .replace(/^U17G_09\/10G GA Aspire\s*/i, '')
    .replace(/^[-–—]\s*/, '')
    .trim();

  const isMatch = event =>
    /\bvs\b|\s@\s|tournament|showcase|championship|game/i.test(event.title || '');

  const labelFor = event => {
    const title = event.title || '';
    if (/showcase/i.test(title)) return 'Showcase';
    if (/tournament|championship/i.test(title)) return 'Tournament';
    if (/\bvs\b|\s@\s|game/i.test(title)) return 'Match';
    if (/practice|fitness/i.test(title)) return 'Training';
    return 'Team event';
  };

  const render = () => {
    const now = new Date();
    const visible = state.events
      .filter(event => event.date >= now)
      .filter(event => !/cancelled/i.test(event.title || ''))
      .filter(event => state.mode === 'all' || isMatch(event))
      .slice(0, 18);

    if (!visible.length) {
      root.innerHTML = '<p class="schedule-loading">No upcoming events are currently listed.</p>';
      return;
    }

    root.innerHTML = visible.map((event, index) => {
      const month = event.date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
      const day = event.date.toLocaleDateString(undefined, { day: '2-digit' });
      const weekday = event.date.toLocaleDateString(undefined, { weekday: 'short' });
      const time = event.date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      const mapUrl = event.location
        ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(event.location)
        : '';

      return `
        <article class="fixture ${index === 0 ? 'next' : ''}">
          <div class="fixture-date">
            <span>${esc(month)}</span>
            <strong>${esc(day)}</strong>
            <small>${esc(weekday)}</small>
          </div>
          <div class="fixture-info">
            <span class="fixture-type">${esc(labelFor(event))}</span>
            <h3>${esc(cleanTitle(event.title))}</h3>
            <p>${esc(time)}${event.location ? ' · ' + esc(event.location) : ''}</p>
            ${event.description ? `<small class="fixture-note">${esc(event.description.replace(/\s+/g, ' ').trim())}</small>` : ''}
            ${mapUrl ? `<a class="fixture-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer">Open map ↗</a>` : ''}
          </div>
        </article>
      `;
    }).join('');
  };

  const controls = document.querySelector('[data-schedule-controls]');
  if (controls) {
    controls.addEventListener('click', event => {
      const button = event.target.closest('button[data-mode]');
      if (!button) return;
      state.mode = button.dataset.mode;
      controls.querySelectorAll('button[data-mode]').forEach(b => {
        const active = b === button;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      render();
    });
  }

  fetch('data/schedule.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Schedule unavailable');
      return response.json();
    })
    .then(data => {
      state.events = (data.events || [])
        .map(event => ({ ...event, date: new Date(event.start) }))
        .filter(event => !Number.isNaN(event.date.getTime()))
        .sort((a, b) => a.date - b.date);

      const stamp = document.querySelector('[data-schedule-updated]');
      if (stamp && data.updated) {
        const updated = new Date(data.updated);
        if (!Number.isNaN(updated.getTime())) {
          stamp.textContent = 'Calendar synced ' + updated.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
          });
        }
      }

      render();
    })
    .catch(() => {
      root.innerHTML = '<p class="schedule-loading">Schedule temporarily unavailable. Please use the team calendar link below.</p>';
    });
})();