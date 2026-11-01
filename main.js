/**
 * NOCTIS — Scrollytelling Engine
 * Vanilla JavaScript only: zero libraries, zero npm dependencies.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    isMobile: window.innerWidth < 768,
    preloaded: false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    
    // Scrollytelling Hero
    hero: {
      targetFrame: 0,
      currentFrame: 0,
      lastRenderedFrame: -1,
      progress: 0,
      images: [],
      loadedCount: 0
    },

    // Scrollytelling Dismantle
    dismantle: {
      targetFrame: 0,
      currentFrame: 0,
      lastRenderedFrame: -1,
      progress: 0,
      images: [],
      loadedCount: 0
    },

    // Custom Cursor
    cursor: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      isHovering: false,
      label: ''
    },

    // Navigation scroll tracking
    lastScrollY: 0,
    activeLineupIndex: 0,
    hoverDebounceTimer: null
  };

  // DOM Elements
  const DOM = {
    body: document.body,
    preloader: document.getElementById('preloader'),
    preloaderLine: document.getElementById('preloader-line'),
    preloaderCounter: document.getElementById('preloader-counter'),
    header: document.getElementById('site-header'),
    filmGrain: document.getElementById('film-grain'),
    cursor: document.getElementById('cursor'),
    cursorLabel: document.querySelector('.cursor-label'),
    
    // Hero
    heroSection: document.getElementById('hero'),
    heroCanvas: document.getElementById('hero-canvas'),
    heroProgressBar: document.getElementById('hero-progress-bar'),
    hudChapterText: document.getElementById('hud-chapter-text'),
    hudSpeedVal: document.getElementById('hud-speed-val'),
    hudDistVal: document.getElementById('hud-dist-val'),
    heroChapters: document.querySelectorAll('.hero-chapter'),

    // Statement
    statementSection: document.getElementById('statement'),
    statementWords: document.querySelectorAll('.statement-word'),

    // Dismantle
    dismantleSection: document.getElementById('dismantle'),
    dismantleCanvas: document.getElementById('dismantle-canvas'),
    dismantleProgressBar: document.getElementById('dismantle-progress-bar'),
    dismantleCallouts: document.querySelectorAll('.callout-item'),

    // Lineup
    lineupSection: document.getElementById('lineup'),
    lineupAccordion: document.getElementById('lineup-accordion'),
    lineupSlides: document.querySelectorAll('.lineup-slide'),

    // Reserve
    reserveBtn: document.getElementById('reserve-btn')
  };

  // Canvas contexts
  const heroCtx = DOM.heroCanvas ? DOM.heroCanvas.getContext('2d', { alpha: false }) : null;
  const dismantleCtx = DOM.dismantleCanvas ? DOM.dismantleCanvas.getContext('2d', { alpha: false }) : null;

  /* ==========================================================================
     1. Preloading & Asset Pipeline
     ========================================================================== */
  function getFramePath(type, index) {
    const isMobile = state.isMobile;
    if (type === 'hero') {
      return isMobile
        ? CONFIG.frames.hero.mobilePath(index)
        : CONFIG.frames.hero.desktopPath(index);
    } else {
      return isMobile
        ? CONFIG.frames.dismantle.mobilePath(index)
        : CONFIG.frames.dismantle.desktopPath(index);
    }
  }

  function initPreloader() {
    const initialTarget = CONFIG.frames.hero.preloadInitial || 40;
    let initialLoaded = 0;

    // Set section heights based on config
    if (DOM.heroSection) {
      DOM.heroSection.style.height = `${CONFIG.sections.heroHeightVh}vh`;
    }
    if (DOM.dismantleSection) {
      DOM.dismantleSection.style.height = `${CONFIG.sections.dismantleHeightVh}vh`;
    }

    // Load initial batch of hero frames
    for (let i = 1; i <= CONFIG.frames.hero.count; i++) {
      const img = new Image();
      img.src = getFramePath('hero', i);
      const frameObj = { img, loaded: false };
      state.hero.images.push(frameObj);

      const onFrameReady = () => {
        if (frameObj.loaded) return;
        frameObj.loaded = true;
        if (i <= initialTarget) {
          initialLoaded++;
          const percent = Math.min(100, Math.round((initialLoaded / initialTarget) * 100));
          updatePreloaderProgress(percent);
          if (initialLoaded >= initialTarget) {
            onInitialPreloadComplete();
          }
        }
      };

      if (img.decode) {
        img.decode().then(onFrameReady).catch(() => {
          img.onload = onFrameReady;
        });
      } else {
        img.onload = onFrameReady;
      }
      img.onerror = () => {
        if (i <= initialTarget) {
          initialLoaded++;
          if (initialLoaded >= initialTarget) {
            onInitialPreloadComplete();
          }
        }
      };
    }

    // Load dismantle frames in background
    for (let i = 1; i <= CONFIG.frames.dismantle.count; i++) {
      const img = new Image();
      img.src = getFramePath('dismantle', i);
      const frameObj = { img, loaded: false };
      state.dismantle.images.push(frameObj);
      
      const onDisReady = () => {
        frameObj.loaded = true;
      };

      if (img.decode) {
        img.decode().then(onDisReady).catch(() => {
          img.onload = onDisReady;
        });
      } else {
        img.onload = onDisReady;
      }
    }
  }

  function updatePreloaderProgress(percent) {
    if (DOM.preloaderLine) {
      DOM.preloaderLine.style.width = `${percent}%`;
    }
    if (DOM.preloaderCounter) {
      DOM.preloaderCounter.textContent = String(percent).padStart(3, '0');
    }
    if (DOM.preloader) {
      DOM.preloader.setAttribute('aria-valuenow', percent);
    }
  }

  function onInitialPreloadComplete() {
    if (state.preloaded) return;
    state.preloaded = true;

    // Flash preloader line brighter for 120ms on exit
    if (DOM.preloader) {
      DOM.preloader.classList.add('is-flash');
    }

    setTimeout(() => {
      DOM.body.classList.remove('loading');
      // Trigger initial resize & render
      handleResize();
      renderHeroFrame(0);
      renderDismantleFrame(0);
      revealChapter(1);
    }, 180);
  }

  /* ==========================================================================
     2. Canvas Rendering & Scaling (Landscape Cover-fit, Portrait Contain-fit)
     ========================================================================== */
  function drawFrameToCanvas(ctx, canvas, imgObj, progressFade = 0) {
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvasWidth = rect.width * dpr;
    const canvasHeight = rect.height * dpr;

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }

    // Clear with flat solid --asphalt
    ctx.fillStyle = '#07080A';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (!imgObj || !imgObj.complete || imgObj.naturalWidth === 0) return;

    const imgW = imgObj.naturalWidth || imgObj.width;
    const imgH = imgObj.naturalHeight || imgObj.height;
    const imgRatio = imgW / imgH;
    const canvasRatio = canvasWidth / canvasHeight;

    const isLandscape = canvasWidth >= canvasHeight;
    let dw, dh, dx, dy;

    if (isLandscape) {
      // Landscape: Cover-fit
      if (canvasRatio > imgRatio) {
        dw = canvasWidth;
        dh = canvasWidth / imgRatio;
      } else {
        dh = canvasHeight;
        dw = canvasHeight * imgRatio;
      }
    } else {
      // Portrait: Contain-fit vertically centred so car is never cropped
      if (canvasRatio > imgRatio) {
        dh = canvasHeight;
        dw = canvasHeight * imgRatio;
      } else {
        dw = canvasWidth;
        dh = canvasWidth / imgRatio;
      }
    }

    dx = (canvasWidth - dw) / 2;
    dy = (canvasHeight - dh) / 2;

    ctx.drawImage(imgObj, dx, dy, dw, dh);

    // Over last 5% of hero scroll, fade canvas to solid black
    if (progressFade > 0) {
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = Math.min(1, Math.max(0, progressFade));
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.globalAlpha = 1.0;
    }

    return { dx, dy, dw, dh, canvasWidth, canvasHeight, dpr };
  }

  function getNearestLoadedImage(imageList, targetIndex) {
    if (!imageList || imageList.length === 0) return null;
    const clamped = Math.max(0, Math.min(imageList.length - 1, targetIndex));
    
    // Check target first
    if (imageList[clamped] && imageList[clamped].loaded && imageList[clamped].img.complete) {
      return imageList[clamped].img;
    }

    // Search outwards for nearest loaded frame
    for (let offset = 1; offset < imageList.length; offset++) {
      const left = clamped - offset;
      const right = clamped + offset;
      if (left >= 0 && imageList[left].loaded && imageList[left].img.complete) {
        return imageList[left].img;
      }
      if (right < imageList.length && imageList[right].loaded && imageList[right].img.complete) {
        return imageList[right].img;
      }
    }
    return imageList[0] ? imageList[0].img : null;
  }

  function renderHeroFrame(frameIndex) {
    const total = CONFIG.frames.hero.count;
    const progress = state.hero.progress;
    const img = getNearestLoadedImage(state.hero.images, frameIndex);

    // Black fade on last 5% (0.95 to 1.00)
    let blackFade = 0;
    if (progress >= 0.95) {
      blackFade = (progress - 0.95) / 0.05;
    }

    drawFrameToCanvas(heroCtx, DOM.heroCanvas, img, blackFade);
    state.hero.lastRenderedFrame = frameIndex;
  }

  let lastDismantleDrawMetrics = null;

  function renderDismantleFrame(frameIndex) {
    const img = getNearestLoadedImage(state.dismantle.images, frameIndex);
    lastDismantleDrawMetrics = drawFrameToCanvas(dismantleCtx, DOM.dismantleCanvas, img, 0);
    state.dismantle.lastRenderedFrame = frameIndex;

    // Update Callouts positioning and visibility
    updateDismantleCallouts();
  }

  /* ==========================================================================
     3. Scrollytelling Scroll Calculation & rAF Loop
     ========================================================================== */
  function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;

    // Header hide on scroll down / show on scroll up
    if (DOM.header) {
      if (scrollY > state.lastScrollY && scrollY > 100) {
        DOM.header.classList.add('nav-hidden');
      } else {
        DOM.header.classList.remove('nav-hidden');
      }
    }
    state.lastScrollY = scrollY;

    // Calculate Hero Progress
    if (DOM.heroSection) {
      const rect = DOM.heroSection.getBoundingClientRect();
      const maxScroll = DOM.heroSection.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / maxScroll));
      state.hero.progress = progress;
      state.hero.targetFrame = Math.round(progress * (CONFIG.frames.hero.count - 1));

      // Update Hero progress bar
      if (DOM.heroProgressBar) {
        DOM.heroProgressBar.style.width = `${progress * 100}%`;
      }

      // Update HUD telemetry
      updateHeroHUD(progress);

      // Update Hero Chapter text visibility
      updateHeroChapters(progress);
    }

    // Calculate Statement Section Word Reveal
    if (DOM.statementSection) {
      const rect = DOM.statementSection.getBoundingClientRect();
      const viewH = window.innerHeight;
      // Active when section moves across viewport
      const start = viewH * 0.8;
      const end = -rect.height * 0.2;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
      updateStatementReveal(progress);
    }

    // Calculate Dismantle Progress
    if (DOM.dismantleSection) {
      const rect = DOM.dismantleSection.getBoundingClientRect();
      const maxScroll = DOM.dismantleSection.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / maxScroll));
      state.dismantle.progress = progress;
      state.dismantle.targetFrame = Math.round(progress * (CONFIG.frames.dismantle.count - 1));

      if (DOM.dismantleProgressBar) {
        DOM.dismantleProgressBar.style.width = `${progress * 100}%`;
      }
    }
  }

  function updateHeroHUD(progress) {
    if (!DOM.hudChapterText) return;

    // Chapter phase display 01/04 to 04/04
    let chapterNum = "01";
    if (progress > 0.72) {
      chapterNum = "04";
    } else if (progress > 0.44) {
      chapterNum = "03";
    } else if (progress > 0.18) {
      chapterNum = "02";
    }
    DOM.hudChapterText.textContent = `${chapterNum}/04`;

    // Speed: 000 -> 118 KM/H
    const currentSpeed = Math.round(progress * CONFIG.hud.maxSpeedKmH);
    DOM.hudSpeedVal.textContent = String(currentSpeed).padStart(3, '0');

    // Distance: 0.0 -> 4.2 KM
    const currentDist = (progress * CONFIG.hud.maxDistanceKm).toFixed(1);
    DOM.hudDistVal.textContent = currentDist;
  }

  function updateHeroChapters(progress) {
    // 0–12%: big "NOCTIS" + "The city is asleep." + hint
    // 22–40%: "It doesn't need the city's light."
    // 50–68%: "It brings its own."
    // 80–100%: "GT-E" + specs row + link
    revealChapter(1, progress >= 0.00 && progress <= 0.16);
    revealChapter(2, progress >= 0.22 && progress <= 0.42);
    revealChapter(3, progress >= 0.50 && progress <= 0.70);
    revealChapter(4, progress >= 0.78 && progress <= 1.00);
  }

  function revealChapter(index, isVisible) {
    const el = document.getElementById(`hero-ch-${index}`);
    if (!el) return;
    if (isVisible) {
      if (!el.classList.contains('is-active')) {
        el.classList.add('is-active');
        el.classList.add('is-revealed');
      }
    } else {
      el.classList.remove('is-active');
      el.classList.remove('is-revealed');
    }
  }

  function updateStatementReveal(progress) {
    if (!DOM.statementWords || DOM.statementWords.length === 0) return;
    const count = DOM.statementWords.length;
    DOM.statementWords.forEach((span, idx) => {
      const wordThreshold = (idx + 0.3) / count;
      if (progress >= wordThreshold) {
        span.style.opacity = '1.0';
      } else {
        span.style.opacity = '0.15';
      }
    });
  }

  /* ==========================================================================
     4. Dismantle Callouts Layer
     ========================================================================== */
  function updateDismantleCallouts() {
    const progress = state.dismantle.progress;
    const callouts = CONFIG.dismantleCallouts;
    const metrics = lastDismantleDrawMetrics;

    if (!DOM.dismantleCallouts || !metrics) return;

    callouts.forEach((co) => {
      const el = document.getElementById(co.id);
      if (!el) return;

      const isVisible = progress >= co.trigger;
      if (isVisible) {
        el.classList.add('is-visible');
      } else {
        el.classList.remove('is-visible');
      }

      // Compute screen coordinates from canvas image space
      const screenX = (metrics.dx + (co.dotX / 100) * metrics.dw) / metrics.dpr;
      const screenY = (metrics.dy + (co.dotY / 100) * metrics.dh) / metrics.dpr;

      // Position the root callout item
      el.style.left = `${screenX}px`;
      el.style.top = `${screenY}px`;

      // Set card offset based on configuration
      const card = el.querySelector('.callout-card');
      const svg = el.querySelector('.callout-line-svg');
      const line = el.querySelector('.callout-line');

      if (card && svg && line) {
        const offX = co.labelOffsetX;
        const offY = co.labelOffsetY;

        card.style.transform = `translate(${offX}px, ${offY}px)`;

        // Update SVG line from (0,0) to card anchor
        const minX = Math.min(0, offX);
        const minY = Math.min(0, offY);
        const w = Math.abs(offX) + 2;
        const h = Math.abs(offY) + 2;

        svg.style.left = `${minX}px`;
        svg.style.top = `${minY}px`;
        svg.style.width = `${w}px`;
        svg.style.height = `${h}px`;

        line.setAttribute('x1', offX >= 0 ? '0' : String(w));
        line.setAttribute('y1', offY >= 0 ? '0' : String(h));
        line.setAttribute('x2', offX >= 0 ? String(w) : '0');
        line.setAttribute('y2', offY >= 0 ? String(h) : '0');
      }
    });
  }

  /* ==========================================================================
     5. Main rAF Loop (Lerp currentFrame -> targetFrame with 0.15)
     ========================================================================== */
  function tick() {
    if (!state.reducedMotion) {
      // Hero Canvas Lerp
      const heroDiff = state.hero.targetFrame - state.hero.currentFrame;
      state.hero.currentFrame += heroDiff * 0.15;
      const roundedHero = Math.round(state.hero.currentFrame);
      if (roundedHero !== state.hero.lastRenderedFrame) {
        renderHeroFrame(roundedHero);
      }

      // Dismantle Canvas Lerp
      const disDiff = state.dismantle.targetFrame - state.dismantle.currentFrame;
      state.dismantle.currentFrame += disDiff * 0.15;
      const roundedDis = Math.round(state.dismantle.currentFrame);
      if (roundedDis !== state.dismantle.lastRenderedFrame) {
        renderDismantleFrame(roundedDis);
      }

      // Custom Cursor Lerp (0.18)
      if (DOM.cursor) {
        state.cursor.x += (state.cursor.targetX - state.cursor.x) * 0.18;
        state.cursor.y += (state.cursor.targetY - state.cursor.y) * 0.18;
        DOM.cursor.style.transform = `translate(${state.cursor.x}px, ${state.cursor.y}px)`;
      }
    }

    requestAnimationFrame(tick);
  }

  /* ==========================================================================
     6. Custom Cursor ("The Headlight")
     ========================================================================== */
  function initCursor() {
    if (state.reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

    window.addEventListener('mousemove', (e) => {
      state.cursor.targetX = e.clientX;
      state.cursor.targetY = e.clientY;
    }, { passive: true });

    // Mousedown: turns brighter for 120ms
    window.addEventListener('mousedown', () => {
      if (DOM.cursor) {
        DOM.cursor.classList.add('is-active');
        setTimeout(() => {
          DOM.cursor.classList.remove('is-active');
        }, 120);
      }
    });

    // Delegated hover handlers
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-cursor], a, button, [role="tab"]');
      if (target) {
        DOM.cursor.classList.add('is-hovering');

        // Check if hovering over lineup slide
        const slide = target.closest('.lineup-slide');
        if (slide) {
          const isOpen = slide.classList.contains('is-active');
          DOM.cursorLabel.textContent = isOpen ? 'CONFIGURE' : 'OPEN';
        } else {
          const customLabel = target.getAttribute('data-cursor') || 'VIEW';
          DOM.cursorLabel.textContent = customLabel;
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-cursor], a, button, [role="tab"]');
      if (target) {
        DOM.cursor.classList.remove('is-hovering');
        DOM.cursorLabel.textContent = '';
      }
    });
  }

  /* ==========================================================================
     7. Lineup Accordion Interaction & Swatches
     ========================================================================== */
  function initLineup() {
    if (!DOM.lineupSlides || DOM.lineupSlides.length === 0) return;

    // Hover with 80ms debounce on desktop
    DOM.lineupSlides.forEach((slide, index) => {
      // Desktop Mouseenter
      slide.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 768) {
          clearTimeout(state.hoverDebounceTimer);
          state.hoverDebounceTimer = setTimeout(() => {
            setActiveSlide(index);
          }, 80);
        }
      });

      // Mobile Tap or Click
      slide.addEventListener('click', (e) => {
        // Prevent clicking internal button from re-toggling
        if (e.target.closest('.swatch') || e.target.closest('.slide-action-link')) return;
        setActiveSlide(index);
      });

      // Keyboard Accessibility (Left/Right & Up/Down arrow keys)
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (index + 1) % DOM.lineupSlides.length;
          setActiveSlide(next);
          DOM.lineupSlides[next].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = (index - 1 + DOM.lineupSlides.length) % DOM.lineupSlides.length;
          setActiveSlide(prev);
          DOM.lineupSlides[prev].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveSlide(index);
        }
      });
    });

    // Swatches click behavior
    document.querySelectorAll('.swatches-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        const swatch = e.target.closest('.swatch');
        if (!swatch) return;
        row.querySelectorAll('.swatch').forEach(s => s.classList.remove('is-active'));
        swatch.classList.add('is-active');
      });
    });

    // Observer to animate slides entrance when Lineup scrolls into view
    const lineupObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          DOM.lineupAccordion.classList.add('is-in-view');
          lineupObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    if (DOM.lineupSection) {
      lineupObserver.observe(DOM.lineupSection);
    }
  }

  function setActiveSlide(index) {
    if (state.activeLineupIndex === index && DOM.lineupSlides[index].classList.contains('is-active')) return;
    state.activeLineupIndex = index;

    DOM.lineupSlides.forEach((slide, idx) => {
      const isActive = idx === index;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-expanded', String(isActive));
    });

    // Update cursor label if currently hovering over slide
    if (DOM.cursor && DOM.cursor.classList.contains('is-hovering')) {
      DOM.cursorLabel.textContent = 'CONFIGURE';
    }
  }

  /* ==========================================================================
     8. Film Grain Overlay (Offscreen tile, shifted ~8fps, 3.5% opacity)
     ========================================================================== */
  function initFilmGrain() {
    if (!DOM.filmGrain) return;
    const canvas = DOM.filmGrain;
    const ctx = canvas.getContext('2d');

    // Create 128x128 noise pattern tile offscreen
    const noiseTile = document.createElement('canvas');
    noiseTile.width = 128;
    noiseTile.height = 128;
    const nCtx = noiseTile.getContext('2d');
    const imgData = nCtx.createImageData(128, 128);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const val = Math.floor(Math.random() * 255);
      data[i] = val;     // R
      data[i + 1] = val; // G
      data[i + 2] = val; // B
      data[i + 3] = 40;  // Alpha ~15% on tile, modulated by canvas opacity 0.035
    }
    nCtx.putImageData(imgData, 0, 0);

    function resizeGrain() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeGrain();
    window.addEventListener('resize', resizeGrain);

    // Shift pattern ~8 times per second (every 125ms)
    setInterval(() => {
      const pattern = ctx.createPattern(noiseTile, 'repeat');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      const ox = (Math.random() * 128) | 0;
      const oy = (Math.random() * 128) | 0;
      ctx.translate(ox, oy);
      ctx.fillStyle = pattern;
      ctx.fillRect(-128, -128, canvas.width + 256, canvas.height + 256);
      ctx.restore();
    }, 125);
  }

  /* ==========================================================================
     9. Reserve Button Action
     ========================================================================== */
  function initReserveButton() {
    if (!DOM.reserveBtn) return;
    DOM.reserveBtn.addEventListener('click', () => {
      const originalText = DOM.reserveBtn.querySelector('.btn-label').textContent;
      DOM.reserveBtn.querySelector('.btn-label').textContent = 'ALLOCATION CONFIRMED';
      DOM.reserveBtn.style.borderColor = 'var(--xenon)';
      DOM.reserveBtn.style.backgroundColor = 'var(--xenon)';
      DOM.reserveBtn.style.color = 'var(--asphalt)';
      setTimeout(() => {
        DOM.reserveBtn.querySelector('.btn-label').textContent = originalText;
        DOM.reserveBtn.style.borderColor = '';
        DOM.reserveBtn.style.backgroundColor = '';
        DOM.reserveBtn.style.color = '';
      }, 2500);
    });
  }

  /* ==========================================================================
     10. Resize Handling & Initialization
     ========================================================================== */
  function handleResize() {
    const isMobileNow = window.innerWidth < 768;
    if (isMobileNow !== state.isMobile) {
      state.isMobile = isMobileNow;
      // Re-render current frame with appropriate mobile/desktop assets
      renderHeroFrame(state.hero.lastRenderedFrame >= 0 ? state.hero.lastRenderedFrame : 0);
      renderDismantleFrame(state.dismantle.lastRenderedFrame >= 0 ? state.dismantle.lastRenderedFrame : 0);
    }

    if (DOM.heroCanvas) {
      renderHeroFrame(state.hero.lastRenderedFrame >= 0 ? state.hero.lastRenderedFrame : 0);
    }
    if (DOM.dismantleCanvas) {
      renderDismantleFrame(state.dismantle.lastRenderedFrame >= 0 ? state.dismantle.lastRenderedFrame : 0);
    }
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Init sequence
  window.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initFilmGrain();
    initCursor();
    initLineup();
    initReserveButton();
    onScroll();
    requestAnimationFrame(tick);
  });

})();
