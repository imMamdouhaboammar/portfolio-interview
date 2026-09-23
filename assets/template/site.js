/* =========================================================================
   Portfolio template interaction layer (portfolio-interview skill).
   Everything here is progressive enhancement. With JavaScript disabled the
   page still renders every section, every link and every answer.
   ========================================================================= */

(function () {
  'use strict';

  var root = document.documentElement;

  /* --- theme ------------------------------------------------------------ */

  var themeToggle = document.getElementById('theme-toggle');

  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem('pf-theme', next);
      } catch {
        /* Private mode or blocked storage: the choice just lasts this visit. */
      }
    });
  }

  /* --- mobile navigation ------------------------------------------------ */

  var menuToggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('nav');

  function setMenu(open) {
    if (!menuToggle || !nav) return;
    nav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', menuToggle.dataset[open ? 'close' : 'open'] || '');
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
      /* Closing hides whatever inside the drawer had focus, so hand it back. */
      setMenu(false);
      menuToggle.focus();
    });

    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false);
    });
  }

  /* --- section highlighting in the navigation --------------------------- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var sections = navLinks
    .map(function (link) { return document.getElementById(link.dataset.nav); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.setAttribute('aria-current', String(link.dataset.nav === entry.target.id));
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* --- copy the email address ------------------------------------------- */

  var ACCENTS = [getComputedStyle(root).getPropertyValue('--brand').trim() || '#df9367', '#c6e86c', '#8fbef5', '#c9a8f2', '#7fd6b4', '#f6cf63'];

  function burst(origin) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('animate' in Element.prototype)) return;

    var box = origin.getBoundingClientRect();
    var startX = box.left + box.width / 2;
    var startY = box.top + box.height / 2;

    for (var i = 0; i < 18; i++) {
      var bit = document.createElement('span');
      bit.className = 'confetti';
      bit.style.background = ACCENTS[i % ACCENTS.length];
      bit.style.left = startX + 'px';
      bit.style.top = startY + 'px';
      document.body.appendChild(bit);

      var angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
      var distance = 70 + Math.random() * 90;

      var flight = bit.animate([
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        {
          transform: 'translate(calc(-50% + ' + Math.cos(angle) * distance + 'px), ' +
            'calc(-50% + ' + (Math.sin(angle) * distance + 120) + 'px)) rotate(' +
            (Math.random() * 540 - 270) + 'deg)',
          opacity: 0,
        },
      ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });

      flight.onfinish = (function (node) {
        return function () { node.remove(); };
      })(bit);
    }
  }

  var copyBtn = document.getElementById('copy-email');

  if (copyBtn) {
    var copyLabel = copyBtn.querySelector('span');
    var original = copyLabel ? copyLabel.textContent : '';

    /* No clipboard API (older browser, or a page served over plain HTTP): the
       button could never work, so it goes away and the address stays readable
       in the contact card above it. */
    if (!navigator.clipboard) {
      copyBtn.hidden = true;
    } else {
      var restore = function () {
        if (copyLabel) copyLabel.textContent = original;
      };

      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(copyBtn.dataset.email || '').then(function () {
          if (copyLabel) copyLabel.textContent = copyBtn.dataset.copied || original;
          burst(copyBtn);
          window.setTimeout(restore, 2000);
        }, function () {
          /* Permission denied or a blocked write: say so instead of looking idle. */
          if (copyLabel) copyLabel.textContent = copyBtn.dataset.failed || original;
          window.setTimeout(restore, 2600);
        });
      });
    }
  }
})();
