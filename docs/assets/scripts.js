// Loader

(function initLoader() {
  const loader  = document.getElementById('loader');
  const letters = document.querySelector('.loader-letters');
  const main    = document.getElementById('main');

  // Detect if page was reloaded (not just navigated to)
  const navEntry = performance.getEntriesByType("navigation")[0];
  const isReload = navEntry && navEntry.type === "reload";
  
  if (!isReload) {
    // Not a reload, skip loader
    loader.remove();
    main.style.opacity = '1';
    main.style.pointerEvents = 'auto';
    document.body.classList.add('loaded');
    return;
  }

  // Show loader only on reload
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

  // Set initial border-radius to fully rounded
  dockToggle.style.borderRadius = '22px';

  dockToggle.addEventListener('click', () => {
    isDockVisible = !isDockVisible;
    if (isDockVisible) {
      dockShelf.classList.remove('hidden');
      dockToggle.style.borderRadius = '22px 22px 0 0';
    } else {
      dockShelf.classList.add('hidden');
      dockToggle.style.borderRadius = '22px';
    }
  });
})();

// DOCK
(function initDock() {
  const dockEl   = document.getElementById('dock');
  const items    = [...document.querySelectorAll('.dock-item')];
  
  // Let CSS handle the basic hover effect now
  // This function is kept for future enhancements
})();


// Interactive 0s and 1s Canvas
(function initInteractiveCanvas() {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  const SPACING = 30;
  const FONT_SIZE = 12;
  
  let particles = [];
  const storedInteractive = localStorage.getItem('interactiveEnabled');
  let isEnabled = storedInteractive !== null ? storedInteractive === 'true' : window.innerWidth > 768;
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
        particles.push({
          x: c * SPACING,
          y: r * SPACING,
          active: false,
          value: '0',
          timer: 0
        });
      }
    }
  }
  
  function isMouseOverInteractive(x, y) {
    const elementUnderMouse = document.elementFromPoint(x, y);
    
    return (
      elementUnderMouse?.closest('.navbar') ||
      elementUnderMouse?.closest('.dock') ||
      elementUnderMouse?.closest('.info-card') ||
      elementUnderMouse?.closest('.profile-card') ||
      elementUnderMouse?.closest('.project-card') ||
      elementUnderMouse?.closest('.theme-container') ||
      elementUnderMouse?.closest('.theme-toggle') ||
      elementUnderMouse?.closest('.theme-info')
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
        const canvasColor = getComputedStyle(document.documentElement)
          .getPropertyValue('--canvas-text-color').trim();
        ctx.fillStyle = canvasColor;
        ctx.fillText(p.value, p.x, p.y);
      }
    }
    
    requestAnimationFrame(draw);
  }
  
  window.addEventListener('resize', resizeCanvas);
  
  document.addEventListener('mousemove', (e) => {
    if (!isEnabled) return;
    
    // Check if mouse is over an interactive element FIRST
    if (isMouseOverInteractive(e.clientX, e.clientY)) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      return; // Don't activate any particles
    }
    
    let closest = null;
    let minDist = Infinity;
    
    for (const p of particles) {
      const dist = Math.hypot(e.clientX - p.x, e.clientY - p.y);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
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
  toggleBtn.querySelector('.toggle-text').textContent =
    isEnabled ? 'Interactive: ON' : 'Interactive: OFF';
  
  toggleBtn.addEventListener('click', () => {
    isEnabled = !isEnabled;
    localStorage.setItem('interactiveEnabled', String(isEnabled));
    toggleBtn.querySelector('.toggle-text').textContent =
      isEnabled ? 'Interactive: ON' : 'Interactive: OFF';
  });
  
  resizeCanvas();
  draw();
})();


// Theme Toggle
// ================== THEME TOGGLE ==================
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
