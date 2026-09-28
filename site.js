(() => {
  const header = document.querySelector('.page-nav, .home-nav');
  if (header) {
    header.classList.add('site-header');

    const nav = header.querySelector('nav');
    if (nav && !header.querySelector('.nav-toggle')) {
      nav.id = nav.id || 'site-navigation';
      const toggle = document.createElement('button');
      toggle.className = 'nav-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', nav.id);
      toggle.setAttribute('aria-label', 'Open navigation');
      toggle.innerHTML = '<span></span><span></span>';
      header.appendChild(toggle);

      const close = () => {
        header.classList.remove('nav-open');
        document.body.classList.remove('nav-lock');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation');
      };

      toggle.addEventListener('click', () => {
        const open = !header.classList.contains('nav-open');
        header.classList.toggle('nav-open', open);
        document.body.classList.toggle('nav-lock', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      });

      nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') close();
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth > 900) close();
      });
    }

    const setScrolled = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 18);
    };
    setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });
  }

  const shareButtons = document.querySelectorAll('[data-share-profile]');
  shareButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const shareData = {
        title: 'Samantha Hengel | Class of 2028',
        text: 'Samantha Hengel — Class of 2028 defender, #2, West Florida Flames.',
        url: window.location.origin + window.location.pathname.replace(/[^/]*$/, '')
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareData.url);
          const original = button.textContent;
          button.textContent = 'Link copied';
          setTimeout(() => button.textContent = original, 1800);
        }
      } catch (_) {}
    });
  });

  const nextEvent = document.getElementById('home-next-event');
  if (nextEvent) {
    fetch('data/schedule.json', { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error('Schedule unavailable');
        return r.json();
      })
      .then(data => {
        const now = new Date();
        const events = (data.events || [])
          .map(event => ({ ...event, date: new Date(event.start) }))
          .filter(event => event.date >= now && !/cancelled/i.test(event.title))
          .sort((a, b) => a.date - b.date);

        const coachRelevant = events.filter(event =>
          /\bvs\b|\s@\s|tournament|showcase|game/i.test(event.title)
        );
        const event = coachRelevant[0] || events[0];
        if (!event) throw new Error('No upcoming events');

        const cleanTitle = event.title
          .replace(/^U17G_09\/10G GA Aspire\s*[-@]?\s*/i, '')
          .replace(/^GA Aspire\s*[-@]?\s*/i, '')
          .trim();

        const date = event.date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        const time = event.date.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit'
        });

        nextEvent.innerHTML = `
          <span class="home-event-kicker">Next scheduled event</span>
          <strong>${cleanTitle}</strong>
          <span>${date} · ${time}</span>
          ${event.location ? `<small>${event.location}</small>` : ''}
        `;
      })
      .catch(() => {
        nextEvent.innerHTML = '<span class="home-event-kicker">Schedule</span><strong>View upcoming events</strong><span>Live team calendar</span>';
      });
  }

  const revealTargets = document.querySelectorAll(
    '.home-feature, .home-story-copy, .home-event-card, .editorial-split, .profile-editorial, .editorial-film, .editorial-next, .profile-home-next'
  );
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTargets.forEach(el => el.classList.add('reveal'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(el => observer.observe(el));
  }
})();