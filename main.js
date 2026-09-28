// main.js — combined site scripts.
// This file merges what used to be two separate files:
//   1) Theme toggle  (formerly theme.js)  — dark/light mode switch
//   2) Nav dropdown  (formerly dropdown.js) — "List of Outputs" menu
// Kept as two IIFEs so each piece stays self-contained and easy
// to find/edit independently.

// ------------------------------------------------------------
// 1) THEME TOGGLE — handles the dark/light mode switch button.
// ------------------------------------------------------------
(function () {
  var root = document.body;
  var toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  function getSavedTheme() {
    try { return localStorage.getItem('site-theme'); } catch (e) { return null; }
  }

  function saveTheme(value) {
    try { localStorage.setItem('site-theme', value); } catch (e) {}
  }

  function applyInitialTheme() {
    var saved = getSavedTheme();
    var prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    var initial = saved || (prefersDark ? 'dark' : 'light');
    root.setAttribute('data-theme', initial);
  }

  function toggleTheme() {
    var current = root.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    saveTheme(next);
  }

  applyInitialTheme();
  toggle.addEventListener('click', toggleTheme);
})();

// ------------------------------------------------------------
// 2) NAV DROPDOWN — handles the "List of Outputs" hover/tap menu.
// Desktop hover is pure CSS (see style.css). This script only
// adds tap support for touch devices and closes the menu on
// outside click or Escape.
// ------------------------------------------------------------
(function () {
  var navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(function (item) {
    var trigger = item.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', function (event) {
      // Only intercept on touch/coarse-pointer devices; on desktop
      // hover already opens the menu, and the link should still work.
      var isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;
      if (!isTouch) return;

      var isOpen = item.classList.contains('open');
      if (!isOpen) {
        event.preventDefault();
        closeAll();
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  function closeAll() {
    navItems.forEach(function (item) {
      item.classList.remove('open');
      var trigger = item.querySelector('.nav-dropdown-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', function (event) {
    var withinNav = event.target.closest && event.target.closest('.nav-item');
    if (!withinNav) closeAll();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeAll();
  });
})();

// ------------------------------------------------------------
// 3) LIGHTBOX — click any real content image (certificates,
// screenshots, gallery/about photos) to view it full-size.
// Empty placeholder <img> tags (no src) are skipped automatically.
// Close via the × button, clicking the backdrop, or Escape.
// ------------------------------------------------------------
(function () {
  function initLightbox() {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML =
      '<button class="lightbox-close" aria-label="Close image">&times;</button>' +
      '<img class="lightbox-img" src="" alt="">';
    document.body.appendChild(overlay);

    var lbImg = overlay.querySelector('.lightbox-img');
    var closeBtn = overlay.querySelector('.lightbox-close');

    function openLightbox(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.src = '';
    }

    document.querySelectorAll('img').forEach(function (img) {
      if (!img.getAttribute('src')) return; // skip empty placeholders
      img.classList.add('lightbox-trigger');
      img.addEventListener('click', function () {
        openLightbox(img.currentSrc || img.src, img.alt);
      });
    });

    overlay.addEventListener('click', function (event) {
      if (event.target === overlay || event.target === closeBtn) closeLightbox();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeLightbox();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    initLightbox();
  }
})();

// ------------------------------------------------------------
// 4) MOBILE MENU — hamburger button that opens/closes the nav
// panel on small screens. On desktop the button is hidden by
// CSS and this code has no visible effect. The "List of Outputs"
// submenu inside the open panel still uses the tap logic from
// section 2 above.
// ------------------------------------------------------------
(function () {
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  function closeMenu() {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', function () {
    if (nav.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close the panel once a plain link (not the dropdown trigger) is tapped.
  nav.addEventListener('click', function (event) {
    var link = event.target.closest('a.nav-item');
    if (link) closeMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu();
  });

  // If the window is resized back up past the mobile breakpoint,
  // make sure the panel isn't left stuck open.
  window.addEventListener('resize', function () {
    if (window.innerWidth > 780) closeMenu();
  });
})();

// ------------------------------------------------------------
// 5) SCROLL REVEAL — fades/slides each <section> into view as
// the user scrolls down. Sections already in the viewport on
// load are revealed immediately (no flash of hidden content).
// Respects prefers-reduced-motion via the CSS transition rule.
// ------------------------------------------------------------
(function () {
  var sections = document.querySelectorAll('section');
  if (!sections.length) return;

  if (!('IntersectionObserver' in window)) {
    // No IntersectionObserver support — just show everything.
    sections.forEach(function (s) { s.classList.add('reveal-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  sections.forEach(function (section) {
    section.classList.add('reveal');
    observer.observe(section);
  });
})();
