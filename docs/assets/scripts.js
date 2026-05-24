// Loader

(function initLoader() {
  const loader  = document.getElementById('loader');
  const letters = document.querySelector('.loader-letters');
  const main    = document.getElementById('main');
  // Detect navigation type and referrer to avoid showing the loader
  // on internal link navigations (clicking between site pages).
  const navEntry = performance.getEntriesByType("navigation")[0];
  const navType = navEntry && navEntry.type;
  const isBackForward = navType === "back_forward";
  const isReload = navType === "reload";
  const isNavigate = navType === "navigate";
  const isInternalReferrer = document.referrer && document.referrer.startsWith(location.origin);

  if (isBackForward) {
    // Back/forward restore: skip loader to avoid a flash.
    loader.remove();
    main.style.opacity = '1';
    main.style.pointerEvents = 'auto';
    document.body.classList.add('loaded');
    return;
  }

  // If this navigation was caused by clicking an internal link (same-origin referrer),
  // don't show the loader — that prevents the loader appearing when switching pages.
  if (isNavigate && isInternalReferrer) {
    loader.remove();
    main.style.opacity = '1';
    main.style.pointerEvents = 'auto';
    document.body.classList.add('loaded');
    return;
  }

  // Show loader on initial visits and on reloads.
  const HOLD = 150 + 550 + 150;

  setTimeout(() => {
    // Trigger zoom-out exit on the letters
    letters.classList.add('exiting');

    setTimeout(() => {
      // Fade the loader overlay and reveal main content
      loader.classList.add('dissolve');
      main.style.opacity = '1';
      main.style.pointerEvents = 'auto';
      document.body.classList.add('loaded');

      // Remove loader from DOM after fade completes
      setTimeout(() => loader.remove(), 500);
    }, 560); // matches exitS/exitG duration
  }, HOLD);
})();

// Set Active Nav Link
(function setActiveNav() {
  const currentPage = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-list a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPage.includes(href.replace('./', ''))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();

// Dock Toggle Functionality
(function initDockToggle() {
  const dockToggle = document.getElementById('dockToggle');
  const dockShelf = document.getElementById('dockShelf');
  let isDockVisible = false;

  if (!dockToggle || !dockShelf) return;

  function syncDockState() {
    const openText = 'Click to close the dock';
    const closedText = 'Click to open the dock';
    dockToggle.setAttribute('aria-expanded', String(isDockVisible));
    dockToggle.setAttribute('title', isDockVisible ? openText : closedText);
    // Visible button text is updated below for mobile users
    // Update the visible button text so mobile users see the action
    try {
      dockToggle.textContent = isDockVisible ? openText : closedText;
    } catch (e) {
      // ignore if setting text fails on some platforms
    }
  }

  // Set initial border-radius to fully rounded
  dockToggle.style.borderRadius = '22px';
  syncDockState();

  dockToggle.addEventListener('click', () => {
    isDockVisible = !isDockVisible;
    if (isDockVisible) {
      dockShelf.classList.remove('hidden');
      dockToggle.style.borderRadius = '22px 22px 0 0';
    } else {
      dockShelf.classList.add('hidden');
      dockToggle.style.borderRadius = '22px';
    }
    syncDockState();
  });
})();

// DOCK
(function initDock() {
  const dockEl   = document.getElementById('dock');
  const items    = [...document.querySelectorAll('.dock-item')];
})();


// Interactive 0s and 1s Canvas (improved touch detection)
(function initInteractiveCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const SPACING = 30;
  const FONT_SIZE = 12;

  let particles = [];

function isTouchDeviceComprehensive() {
  const hasCoarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const hasTouchEvents = 'ontouchstart' in window;
  const hasMaxTouchPoints = navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  return hasCoarsePointer || hasTouchEvents || hasMaxTouchPoints;
}

  const storedInteractive = localStorage.getItem('interactiveEnabled');
  const isTouchDevice = isTouchDeviceComprehensive();

  // If touch device, force interactive OFF and persist so desktop prefs don't leak
  let isEnabled;
  if (isTouchDevice) {
    isEnabled = false;
    try { localStorage.setItem('interactiveEnabled', 'false'); } catch (e) {}
  } else {
    isEnabled = storedInteractive !== null ? storedInteractive === 'true' : window.innerWidth > 768;
  }

  let mouse = { x: -9999, y: -9999 };

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    buildGrid();
  }

  function buildGrid() {
    particles = [];
    const cols = Math.ceil(canvas.width / SPACING);
    const rows = Math.ceil(canvas.height / SPACING);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        particles.push({ x: c * SPACING, y: r * SPACING, active: false, value: '0', timer: 0 });
      }
    }
  }

  function isMouseOverInteractive(x, y) {
    const el = document.elementFromPoint(x, y);
    return (
      el?.closest('.navbar') ||
      el?.closest('.dock') ||
      el?.closest('.info-card') ||
      el?.closest('.profile-card') ||
      el?.closest('.project-card') ||
      el?.closest('.theme-container') ||
      el?.closest('.theme-toggle') ||
      el?.closest('.theme-info')
    );
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${FONT_SIZE}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of particles) {
      if (p.active) p.timer -= 16;
      if (p.timer <= 0) p.active = false;
      if (p.active) {
        const canvasColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-text-color').trim();
        ctx.fillStyle = canvasColor;
        ctx.fillText(p.value, p.x, p.y);
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resizeCanvas);

  document.addEventListener('mousemove', (e) => {
    if (!isEnabled) return;
    if (isMouseOverInteractive(e.clientX, e.clientY)) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      return;
    }
    let closest = null;
    let minDist = Infinity;
    for (const p of particles) {
      const dist = Math.hypot(e.clientX - p.x, e.clientY - p.y);
      if (dist < minDist) { minDist = dist; closest = p; }
    }
    if (closest && minDist < 100) {
      closest.active = true;
      closest.value = Math.random() < 0.5 ? '0' : '1';
      closest.timer = 500;
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  const toggleBtn = document.getElementById('interactiveToggle');
  if (toggleBtn) {
    const label = toggleBtn.querySelector('.toggle-text');
    if (label) label.textContent = isEnabled ? 'Interactive: ON' : 'Interactive: OFF';
    toggleBtn.addEventListener('click', () => {
      isEnabled = !isEnabled;
      try { localStorage.setItem('interactiveEnabled', String(isEnabled)); } catch (e) {}
      if (label) label.textContent = isEnabled ? 'Interactive: ON' : 'Interactive: OFF';
    });
  }

  resizeCanvas();
  draw();
})();


// Theme Toggle
(function initTheme() {
  const btn = document.getElementById('themeToggle');
  const html = document.documentElement;

  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(isDark) {
    if (isDark) {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
  }

  // Initial system theme
  applyTheme(media.matches);

  // Live system updates
  media.addEventListener('change', (e) => {
    applyTheme(e.matches);
  });

  // Manual toggle
  btn.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
  });
})();

// Theme Info Button
(function initThemeInfo() {
  const infoBtn = document.getElementById('themeInfo');
  
  infoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    infoBtn.classList.toggle('active');
  });
  
  // Close tooltip when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-info')) {
      infoBtn.classList.remove('active');
    }
  });
})();