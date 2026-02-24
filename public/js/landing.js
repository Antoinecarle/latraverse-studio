/* ============================================================
   LA TRAVERSE -- Motion Narrative Landing Page
   Vanilla JS, IntersectionObserver, requestAnimationFrame
   No external dependencies
   ============================================================ */

(function () {
  'use strict';

  /* -------------------------------------------------------
     REDUCED MOTION GATE
     ------------------------------------------------------- */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------
     NAV -- Scroll shadow + background
     ------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var heroDark = document.querySelector('.hero--dark');

  function onNavScroll() {
    if (!nav) return;
    var heroBottom = heroDark ? heroDark.offsetHeight : 0;

    if (heroDark && window.scrollY < heroBottom - 80) {
      nav.classList.add('nav--dark');
      if (window.scrollY > 40) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    } else {
      nav.classList.remove('nav--dark');
      if (window.scrollY > 40) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    }
  }

  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

  /* -------------------------------------------------------
     MOBILE MENU -- Burger toggle
     ------------------------------------------------------- */
  var burger = document.getElementById('navBurger');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    burger.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  function openMobileMenu() {
    mobileMenu.classList.add('is-open');
    burger.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  if (burger) {
    burger.addEventListener('click', function () {
      if (mobileMenu.classList.contains('is-open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  for (var i = 0; i < mobileLinks.length; i++) {
    mobileLinks[i].addEventListener('click', closeMobileMenu);
  }

  /* -------------------------------------------------------
     SMOOTH SCROLL -- Anchor links
     ------------------------------------------------------- */
  var anchorLinks = document.querySelectorAll('a[href^="#"]');
  for (var j = 0; j < anchorLinks.length; j++) {
    anchorLinks[j].addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      closeMobileMenu();
      var offset = nav ? nav.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* -------------------------------------------------------
     ACTIVE NAV LINK -- Highlight based on scroll position
     ------------------------------------------------------- */
  var navLinks = document.querySelectorAll('.nav__link');
  var sections = [];

  for (var r = 0; r < navLinks.length; r++) {
    var sHref = navLinks[r].getAttribute('href');
    var sec = document.querySelector(sHref);
    if (sec) {
      sections.push({ el: sec, link: navLinks[r] });
    }
  }

  function updateActiveLink() {
    var scrollPos = window.scrollY + 200;
    for (var s = sections.length - 1; s >= 0; s--) {
      if (sections[s].el.offsetTop <= scrollPos) {
        for (var t = 0; t < sections.length; t++) {
          sections[t].link.style.color = '';
        }
        sections[s].link.style.color = '#c4622a';
        return;
      }
    }
    for (var u = 0; u < sections.length; u++) {
      sections[u].link.style.color = '';
    }
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  /* -------------------------------------------------------
     CONTACT FORM -- Prevent default + success message
     ------------------------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';
      }

      var formData = new FormData(contactForm);
      var payload = {};
      formData.forEach(function(value, key) { payload[key] = value; });

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        contactForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Envoyer <span class="btn__arrow">&rarr;</span>';
        }
        if (formSuccess) {
          formSuccess.classList.add('is-visible');
          setTimeout(function () {
            formSuccess.classList.remove('is-visible');
          }, 5000);
        }
      })
      .catch(function() {
        /* En cas d'erreur reseau, ouvrir le client mail en fallback */
        var subject = encodeURIComponent('Contact depuis latraverse.studio');
        var body = encodeURIComponent(
          'Nom: ' + (payload.name || '') + '\n' +
          'Email: ' + (payload.email || '') + '\n' +
          'Metier: ' + (payload.metier || '') + '\n\n' +
          (payload.message || '')
        );
        window.location.href = 'mailto:hello@latraverse.studio?subject=' + subject + '&body=' + body;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Envoyer <span class="btn__arrow">&rarr;</span>';
        }
      });
    });
  }

  /* =======================================================
     ALL MOTION ANIMATIONS -- gated by reduced motion
     ======================================================= */
  if (prefersReducedMotion) {
    /* Make everything immediately visible */
    var allReveal = document.querySelectorAll(
      '.reveal-section, .reveal-item, .reveal-item--from-left, .reveal-item--from-right, .reveal-item--scale, .reveal-item--tilt, .reveal-item--deep, .section-break'
    );
    for (var p = 0; p < allReveal.length; p++) {
      allReveal[p].classList.add('is-visible');
    }
    document.querySelectorAll('.hero__word-inner').forEach(function (el) {
      el.classList.add('is-revealed');
    });
    var heroAccent = document.getElementById('heroAccent');
    if (heroAccent) heroAccent.classList.add('is-revealed');
    document.querySelectorAll('.hero__reveal-item').forEach(function (el) {
      el.classList.add('is-revealed');
    });
    var timelineLine = document.getElementById('methodeTimelineLine');
    if (timelineLine) timelineLine.classList.add('is-drawing');

    /* Badge: show immediately */
    var overlineEl = document.getElementById('heroBadge');
    if (overlineEl) {
      overlineEl.style.opacity = '1';
      overlineEl.style.transform = 'none';
    }

    /* Show clarity, hide chaos for reduced motion */
    var rmChaos = document.querySelector('.scene-chaos');
    if (rmChaos) rmChaos.style.display = 'none';
    var rmClarity = document.querySelector('.scene-clarity');
    if (rmClarity) {
      rmClarity.style.position = 'relative';
      rmClarity.style.opacity = '1';
    }
    document.querySelectorAll('.scene-clarity__line').forEach(function(l) {
      l.style.opacity = '1';
      l.style.transform = 'none';
    });

    /* Show title + descriptor immediately */
    var rmTitle = document.getElementById('heroTitle');
    if (rmTitle) { rmTitle.style.opacity = '1'; rmTitle.style.transform = 'none'; }
    var rmDesc = document.querySelector('.hero__descriptor');
    if (rmDesc) { rmDesc.style.opacity = '1'; rmDesc.style.transform = 'none'; }

    /* Show value prop, CTA, reassurance */
    var rmValueProp = document.getElementById('heroValueProp');
    if (rmValueProp) { rmValueProp.classList.add('is-visible'); }
    ['heroCTA', 'heroReassurance'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
    });

    /* Stats: show final values immediately */
    document.querySelectorAll('.stats-band__item').forEach(function (item) {
      var target = item.getAttribute('data-stat-target');
      var suffix = item.getAttribute('data-stat-suffix') || '';
      var valueEl = item.querySelector('.stats-band__value');
      if (valueEl && target) valueEl.textContent = target + suffix;
      var fill = item.querySelector('.stats-gauge__fill');
      if (fill) {
        fill.style.strokeDashoffset = '0';
        fill.style.transition = 'none';
      }
    });

    /* Sparklines: show fully drawn (inline style override) */
    document.querySelectorAll('.sparkline__path').forEach(function (path) {
      path.style.strokeDasharray = '300';
      path.style.strokeDashoffset = '0';
      path.style.transition = 'none';
    });

    /* Progress bar: show at 60% */
    var pFill = document.getElementById('methodeProgressFill');
    if (pFill) { pFill.style.width = '60%'; pFill.classList.add('is-animating'); }
    var pEl = document.getElementById('methodeProgress');
    if (pEl) pEl.classList.add('is-visible');

    return; /* Skip all animations */
  }

  /* -------------------------------------------------------
     1. HERO ANIMATIONS (Motion Narrative — SVG ribbons,
        particles, chaos/clarity transformation)
     ------------------------------------------------------- */

  /* --- Utility: animate with requestAnimationFrame --- */
  function animateValue(duration, easing, onUpdate, onComplete) {
    var start = performance.now();
    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var easedProgress = easing(progress);
      onUpdate(easedProgress);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else if (onComplete) {
        onComplete();
      }
    }
    requestAnimationFrame(tick);
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  /* --- Fade in element with transform --- */
  function heroFadeIn(el, delay, duration, translateFrom) {
    translateFrom = translateFrom || 24;
    duration = duration || 700;
    setTimeout(function() {
      animateValue(duration, easeOutCubic, function(p) {
        el.style.opacity = p;
        el.style.transform = 'translateY(' + (translateFrom * (1 - p)) + 'px)';
      });
    }, delay);
  }

  /* --- PARTICLES — subtle copper dots --- */
  var particleContainer = document.querySelector('.hero-particles');
  var NUM_PARTICLES = 12;
  var particles = [];
  var particleRAF;

  if (particleContainer) {
    for (var pi = 0; pi < NUM_PARTICLES; pi++) {
      var pel = document.createElement('div');
      pel.className = 'particle';
      pel.style.left = (Math.random() * 100) + '%';
      pel.style.top = (Math.random() * 100) + '%';
      var pSize = (2 + Math.random() * 3) + 'px';
      pel.style.width = pSize;
      pel.style.height = pSize;
      particleContainer.appendChild(pel);
      particles.push({
        el: pel,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.015,
        vy: (Math.random() - 0.5) * 0.01,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5
      });
    }

    function updateParticles(time) {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5) p.x = 105;
        if (p.x > 105) p.x = -5;
        if (p.y < -5) p.y = 105;
        if (p.y > 105) p.y = -5;
        var alpha = 0.12 + Math.sin(time * 0.001 * p.speed + p.phase) * 0.08;
        p.el.style.transform = 'translate(' + p.x + 'vw, ' + p.y + 'vh)';
        p.el.style.opacity = alpha;
      }
    }

    function particleLoop(time) {
      updateParticles(time);
      particleRAF = requestAnimationFrame(particleLoop);
    }
    particleRAF = requestAnimationFrame(particleLoop);
  }

  /* --- SVG CURVED TEXT RIBBON ANIMATION --- */
  var ribbonPaths = document.querySelectorAll('.ribbon-path');
  var ribbonGlows = document.querySelectorAll('.ribbon-path-glow');
  var ribbonText = document.querySelector('.ribbon-text');
  var ribbonText2 = document.querySelector('.ribbon-text-2');
  var textPath1 = document.getElementById('textPath1');
  var textPath2 = document.getElementById('textPath2');

  var ribbonOffset1 = 0;
  var ribbonOffset2 = -30;
  var ribbonRAF;

  function animateRibbon() {
    setTimeout(function() {
      ribbonPaths.forEach(function(p) { p.classList.add('visible'); });
      ribbonGlows.forEach(function(g) { g.classList.add('visible'); });
    }, 400);

    setTimeout(function() {
      if (ribbonText) ribbonText.classList.add('visible');
    }, 800);

    setTimeout(function() {
      if (ribbonText2) ribbonText2.classList.add('visible');
    }, 1200);

    function flowLoop() {
      ribbonOffset1 += 0.015;
      ribbonOffset2 += 0.02;
      if (ribbonOffset1 > 100) ribbonOffset1 -= 100;
      if (ribbonOffset2 > 100) ribbonOffset2 -= 100;
      if (textPath1) textPath1.setAttribute('startOffset', ribbonOffset1 + '%');
      if (textPath2) textPath2.setAttribute('startOffset', ribbonOffset2 + '%');
      ribbonRAF = requestAnimationFrame(flowLoop);
    }

    setTimeout(function() {
      ribbonRAF = requestAnimationFrame(flowLoop);
    }, 800);
  }

  /* --- ENTRANCE SEQUENCE --- */
  var heroBadge = document.getElementById('heroBadge');
  var heroTitle = document.getElementById('heroTitle');
  var traverseAccent = document.querySelector('.hero__title-traverse');
  var heroCTAWrap = document.getElementById('heroCTA');
  var heroReassurance = document.getElementById('heroReassurance');
  var chaosContainer = document.querySelector('.scene-chaos');
  var chaosLines = document.querySelectorAll('.scene-chaos__line');
  var clarityLines = document.querySelectorAll('.scene-clarity__line');

  /* ACT 1: Static elements fade in */
  if (heroBadge) heroFadeIn(heroBadge, 200, 600, 20);

  var heroDescriptor = document.querySelector('.hero__descriptor');

  if (heroTitle) {
    setTimeout(function() {
      animateValue(900, easeOutQuart, function(p) {
        heroTitle.style.opacity = p;
        heroTitle.style.transform = 'translateY(' + (40 * (1 - p)) + 'px)';
      }, function() {
        if (traverseAccent) {
          setTimeout(function() {
            animateValue(600, easeOutCubic, function(p) {
              traverseAccent.style.setProperty('--underline-opacity', p * 0.4);
              traverseAccent.style.setProperty('--underline-scale', p);
            });
          }, 200);
        }
        /* Reveal descriptor after title */
        if (heroDescriptor) {
          setTimeout(function() { heroDescriptor.classList.add('is-visible'); }, 400);
        }
      });
    }, 500);
  }

  /* Inject underline style patch */
  var underlineStyle = document.createElement('style');
  underlineStyle.textContent = '.hero__title-traverse::after { opacity: var(--underline-opacity, 0); transform: scaleX(var(--underline-scale, 0)); }';
  document.head.appendChild(underlineStyle);

  /* Start ribbon animation */
  animateRibbon();

  /* --- ACT 2: TRANSFORMATION SCENE (chaos → clarity cycle) --- */
  var currentChaosIndex = 0;
  var transformationActive = true;
  var cycleTimeout;

  function showChaosPhrase(index, callback) {
    var line = chaosLines[index];
    if (!line) return;
    var words = line.querySelectorAll('.chaos-word');

    chaosLines.forEach(function(l) {
      l.style.opacity = '0';
      l.style.transform = 'translateY(12px)';
    });

    if (chaosContainer) chaosContainer.style.opacity = '1';
    line.style.opacity = '1';
    line.style.transform = 'translateY(0)';

    words.forEach(function(word, i) {
      var randomX = (Math.random() - 0.5) * 16;
      var randomRot = (Math.random() - 0.5) * 6;
      word.style.opacity = '0';
      word.style.transform = 'translateX(' + randomX + 'px) rotate(' + randomRot + 'deg) translateY(8px)';

      setTimeout(function() {
        animateValue(400, easeOutCubic, function(p) {
          word.style.opacity = p * 0.85;
          word.style.transform =
            'translateX(' + (randomX * (1 - p)) + 'px) ' +
            'rotate(' + (randomRot * (1 - p * 0.7)) + 'deg) ' +
            'translateY(' + (8 * (1 - p)) + 'px)';
        });
      }, i * 70);
    });

    setTimeout(function() {
      words.forEach(function(word, i) {
        var exitX = (Math.random() - 0.5) * 30;
        var exitY = -10 - Math.random() * 12;
        var startOpacity = parseFloat(word.style.opacity) || 0.85;

        setTimeout(function() {
          animateValue(500, easeInOutCubic, function(p) {
            word.style.opacity = startOpacity * (1 - p);
            word.style.transform =
              'translateX(' + (exitX * p) + 'px) ' +
              'translateY(' + (exitY * p) + 'px) ' +
              'scale(' + (1 - p * 0.15) + ')';
          });
        }, i * 40);
      });

      setTimeout(function() {
        if (callback) callback();
      }, 500 + words.length * 40);
    }, 1800);
  }

  function showClarity() {
    if (chaosContainer) chaosContainer.style.opacity = '0';

    clarityLines.forEach(function(line, i) {
      setTimeout(function() {
        animateValue(700, easeOutCubic, function(p) {
          line.style.opacity = p;
          line.style.transform = 'translateY(' + (16 * (1 - p)) + 'px) scale(' + (0.96 + 0.04 * p) + ')';
        });
      }, i * 200);
    });

    /* After clarity is shown briefly, fade it out and reveal permanent value prop */
    setTimeout(function() {
      /* Fade out clarity lines */
      clarityLines.forEach(function(line) {
        line.style.transition = 'opacity 0.6s ease';
        line.style.opacity = '0';
      });
      /* Then show permanent value prop in the same zone */
      setTimeout(function() {
        var valueProp = document.getElementById('heroValueProp');
        if (valueProp) valueProp.classList.add('is-visible');
      }, 400);
    }, 2000);
  }

  function runTransformationCycle() {
    if (!transformationActive) return;

    if (currentChaosIndex < chaosLines.length) {
      showChaosPhrase(currentChaosIndex, function() {
        currentChaosIndex++;
        if (currentChaosIndex >= chaosLines.length) {
          /* All chaos phrases shown — reveal clarity and STOP (no loop) */
          setTimeout(function() {
            showClarity();
          }, 300);
        } else {
          cycleTimeout = setTimeout(runTransformationCycle, 200);
        }
      });
    }
  }

  /* Start transformation scene after title arrives */
  setTimeout(function() {
    runTransformationCycle();
  }, 1800);

  /* ACT 3: Supporting elements fade in */
  if (heroCTAWrap) heroFadeIn(heroCTAWrap, 2600, 700, 20);
  if (heroReassurance) heroFadeIn(heroReassurance, 3000, 700, 16);

  /* --- CLEANUP on visibility change --- */
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      transformationActive = false;
      if (cycleTimeout) clearTimeout(cycleTimeout);
      if (particleRAF) cancelAnimationFrame(particleRAF);
      if (ribbonRAF) cancelAnimationFrame(ribbonRAF);
    } else {
      transformationActive = true;
      if (particleContainer) particleRAF = requestAnimationFrame(particleLoop);
      if (textPath1 || textPath2) {
        ribbonRAF = requestAnimationFrame(function flowLoop() {
          ribbonOffset1 += 0.015;
          ribbonOffset2 += 0.02;
          if (ribbonOffset1 > 100) ribbonOffset1 -= 100;
          if (ribbonOffset2 > 100) ribbonOffset2 -= 100;
          if (textPath1) textPath1.setAttribute('startOffset', ribbonOffset1 + '%');
          if (textPath2) textPath2.setAttribute('startOffset', ribbonOffset2 + '%');
          ribbonRAF = requestAnimationFrame(flowLoop);
        });
      }
      runTransformationCycle();
    }
  });

  /* -------------------------------------------------------
     3. MANIFESTO -- Word-by-word scroll-driven opacity
     ------------------------------------------------------- */
  var manifestoQuote = document.getElementById('manifestoQuote');

  function wrapManifestoWords(container) {
    if (!container) return;

    /* We need to process text nodes and <br> and <em> */
    var nodes = Array.prototype.slice.call(container.childNodes);
    var newHTML = '';

    nodes.forEach(function (node) {
      if (node.nodeType === Node.COMMENT_NODE) {
        return; /* Skip HTML comments */
      }
      if (node.nodeType === Node.TEXT_NODE) {
        var text = node.textContent;
        var words = text.split(/(\s+)/);
        words.forEach(function (part) {
          if (part.trim() === '') {
            newHTML += part;
          } else {
            newHTML += '<span class="manifesto__word">' + part + '</span>';
          }
        });
      } else if (node.nodeName === 'BR') {
        newHTML += '<br>';
      } else if (node.nodeName === 'EM') {
        /* Wrap words inside em with the accent modifier */
        var emText = node.textContent;
        var emWords = emText.split(/(\s+)/);
        var emInner = '';
        emWords.forEach(function (part) {
          if (part.trim() === '') {
            emInner += part;
          } else {
            emInner += '<span class="manifesto__word manifesto__word--accent">' + part + '</span>';
          }
        });
        newHTML += '<em>' + emInner + '</em>';
      } else {
        newHTML += node.outerHTML || node.textContent;
      }
    });

    container.innerHTML = newHTML;
  }

  wrapManifestoWords(manifestoQuote);

  /* Scroll-driven word lighting using IntersectionObserver + scroll */
  function setupManifestoScroll() {
    var manifesto = document.getElementById('manifesto');
    if (!manifesto) return;

    var words = manifesto.querySelectorAll('.manifesto__word');
    if (!words.length) return;

    function updateWordOpacity() {
      var rect = manifesto.getBoundingClientRect();
      var viewH = window.innerHeight;

      /* Progress: 0 when top of manifesto enters bottom of screen,
                   1 when bottom of manifesto exits top of screen */
      var start = viewH * 0.8;
      var end = rect.height * 0.5;
      var progress = (start - rect.top) / (start + end);
      progress = Math.max(0, Math.min(1, progress));

      var wordCount = words.length;
      for (var wi = 0; wi < wordCount; wi++) {
        var wordProgress = wi / (wordCount - 1 || 1);
        if (progress >= wordProgress - 0.05) {
          words[wi].classList.add('is-lit');
        } else {
          words[wi].classList.remove('is-lit');
        }
      }
    }

    window.addEventListener('scroll', updateWordOpacity, { passive: true });
    updateWordOpacity();
  }

  setupManifestoScroll();

  /* -------------------------------------------------------
     4. SECTION REVEALS -- IntersectionObserver
     ------------------------------------------------------- */

  /* Section-level */
  var sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          sectionObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  var revealSections = document.querySelectorAll('.reveal-section');
  for (var k = 0; k < revealSections.length; k++) {
    sectionObserver.observe(revealSections[k]);
  }

  /* Item-level with stagger */
  var itemObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var parent = entry.target.parentElement;
          var siblings = parent ? parent.querySelectorAll('.reveal-item') : [];
          var index = 0;
          for (var m = 0; m < siblings.length; m++) {
            if (siblings[m] === entry.target) {
              index = m;
              break;
            }
          }
          entry.target.style.transitionDelay = (index * 110) + 'ms';
          entry.target.classList.add('is-visible');
          itemObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  var revealItems = document.querySelectorAll('.reveal-item');
  for (var n = 0; n < revealItems.length; n++) {
    itemObserver.observe(revealItems[n]);
  }

  /* -------------------------------------------------------
     4b. PARALLAX SCROLL ENGINE -- Depth effect on sections
     ------------------------------------------------------- */

  var parallaxEls = document.querySelectorAll('[data-parallax-speed]');
  var parallaxData = [];

  for (var px = 0; px < parallaxEls.length; px++) {
    var speed = parseFloat(parallaxEls[px].getAttribute('data-parallax-speed')) || 0;
    parallaxData.push({
      el: parallaxEls[px],
      speed: speed,
      cached: 0
    });
  }

  var parallaxTicking = false;

  function updateParallax() {
    var scrollY = window.scrollY;
    var viewH = window.innerHeight;

    for (var i = 0; i < parallaxData.length; i++) {
      var item = parallaxData[i];
      var rect = item.el.getBoundingClientRect();

      /* Only compute parallax when element is near viewport */
      if (rect.bottom < -200 || rect.top > viewH + 200) continue;

      /* Center of element relative to viewport center */
      var elCenter = rect.top + rect.height / 2;
      var viewCenter = viewH / 2;
      var delta = (elCenter - viewCenter) * item.speed;

      /* Clamp to avoid extreme offsets */
      delta = Math.max(-60, Math.min(60, delta));

      /* Only update if value changed meaningfully (>0.5px) */
      if (Math.abs(delta - item.cached) > 0.5) {
        item.el.style.transform = 'translateY(' + delta.toFixed(1) + 'px)';
        item.cached = delta;
      }
    }

    parallaxTicking = false;
  }

  if (parallaxData.length > 0) {
    window.addEventListener('scroll', function () {
      if (!parallaxTicking) {
        parallaxTicking = true;
        requestAnimationFrame(updateParallax);
      }
    }, { passive: true });

    /* Initial pass */
    updateParallax();
  }

  /* -------------------------------------------------------
     5. METHODE TIMELINE -- Draw line on scroll
     ------------------------------------------------------- */
  var timelineLine = document.getElementById('methodeTimelineLine');
  var methodeSection = document.getElementById('methode');

  if (timelineLine && methodeSection) {
    var timelineObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            timelineLine.classList.add('is-drawing');
            timelineObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    timelineObserver.observe(methodeSection);
  }

  /* -------------------------------------------------------
     6. SECTION NUMBER COUNT-UP
     ------------------------------------------------------- */
  function padNumber(n, len) {
    var s = String(n);
    while (s.length < len) s = '0' + s;
    return s;
  }

  function animateCountUp(el, target, duration) {
    var start = null;
    var targetNum = parseInt(target, 10);
    var numLen = String(target).length;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      /* Ease out expo */
      var eased = 1 - Math.pow(1 - progress, 4);
      var current = Math.floor(eased * targetNum);
      el.textContent = padNumber(current, numLen);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = padNumber(targetNum, numLen);
      }
    }

    requestAnimationFrame(step);
  }

  var countUpObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = el.getAttribute('data-count-target');
          if (target) {
            animateCountUp(el, target, 900);
          }
          countUpObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.3 }
  );

  var countTargets = document.querySelectorAll('[data-count-target]');
  for (var ct = 0; ct < countTargets.length; ct++) {
    /* Only section__number elements -- step numbers handled separately */
    if (countTargets[ct].classList.contains('section__number')) {
      /* Start from 0 visually */
      var tgt = countTargets[ct].getAttribute('data-count-target');
      countTargets[ct].textContent = padNumber(0, tgt.length);
      countUpObserver.observe(countTargets[ct]);
    }
  }

  /* -------------------------------------------------------
     7. METHODE STEP NUMBERS -- Count-up on step visibility
     ------------------------------------------------------- */
  var stepNumberObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var stepNum = entry.target.querySelector('.methode__step-number');
          if (stepNum) {
            var target = stepNum.getAttribute('data-count-target');
            if (target) {
              animateCountUp(stepNum, target, 600);
            }
          }
          stepNumberObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  var methodeSteps = document.querySelectorAll('.methode__step');
  for (var ms = 0; ms < methodeSteps.length; ms++) {
    var stepNum = methodeSteps[ms].querySelector('.methode__step-number');
    if (stepNum) {
      var tgtStr = stepNum.getAttribute('data-count-target');
      if (tgtStr) {
        stepNum.textContent = padNumber(0, tgtStr.length);
      }
    }
    stepNumberObserver.observe(methodeSteps[ms]);
  }

  /* -------------------------------------------------------
     8. EQUIPE -- Card reveal animations
     ------------------------------------------------------- */

  /* Card reveal observer -- adds .is-visible to equipe__card elements */
  var equipeCards = document.querySelectorAll('.equipe__card');
  var equipeCardObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        equipeCardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  for (var ec = 0; ec < equipeCards.length; ec++) {
    equipeCardObserver.observe(equipeCards[ec]);
  }

  /* -------------------------------------------------------
     9. EQUIPE QUOTE -- Staggered word reveal
     ------------------------------------------------------- */
  var equipeQuoteBlock = document.getElementById('equipeQuote');

  function wrapQuoteWords(container) {
    if (!container) return;
    var blockquote = container.querySelector('.equipe__quote-text');
    if (!blockquote) return;

    var words = blockquote.textContent.trim().split(/\s+/);
    blockquote.innerHTML = words.map(function (word) {
      return '<span class="quote-word">' + word + '</span>';
    }).join(' ');
  }

  wrapQuoteWords(equipeQuoteBlock);

  /* Apply stagger delays to quote words */
  if (equipeQuoteBlock) {
    var quoteWords = equipeQuoteBlock.querySelectorAll('.quote-word');
    for (var qw = 0; qw < quoteWords.length; qw++) {
      quoteWords[qw].style.transitionDelay = (qw * 80) + 'ms';
    }
  }

  /* -------------------------------------------------------
     10. REAL-CARD TAGS -- Typewriter on card visibility
     ------------------------------------------------------- */
  function typewriterCard(el, text, speed) {
    el.textContent = '';
    var idx = 0;
    function type() {
      if (idx < text.length) {
        el.textContent += text[idx];
        idx++;
        setTimeout(type, speed);
      }
    }
    type();
  }

  var cardTagObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var tag = entry.target.querySelector('.real-card__tag[data-typewriter-card]');
          if (tag) {
            var fullText = tag.getAttribute('data-typewriter-card');
            setTimeout(function () {
              typewriterCard(tag, fullText, 60);
            }, 300);
          }
          cardTagObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  var realCards = document.querySelectorAll('.real-card[class]');
  for (var rc = 0; rc < realCards.length; rc++) {
    var cardTag = realCards[rc].querySelector('.real-card__tag[data-typewriter-card]');
    if (cardTag) {
      cardTag.textContent = ''; /* Clear text until visible */
      cardTagObserver.observe(realCards[rc]);
    }
  }

  /* -------------------------------------------------------
     11. MARQUEE -- Pure CSS animation (no JS needed)
     ------------------------------------------------------- */
  /* CSS handles marquee-flow animation */

  /* -------------------------------------------------------
     12. REAL-CARD -- Hover gradient position animation
     ------------------------------------------------------- */
  var realCardEls = document.querySelectorAll('.real-card');
  realCardEls.forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });

  /* -------------------------------------------------------
     13. SERVICE CARD -- Border draw (CSS)
     ------------------------------------------------------- */
  /* Pure CSS handles border-draw via ::before width transition */

  /* -------------------------------------------------------
     14. STATS BAND -- SVG gauge + counter animation
     ------------------------------------------------------- */

  var statItems = document.querySelectorAll('.stats-band__item');
  var CIRCUMFERENCE = 163.36; /* 2 * Math.PI * 26 */

  function animateStatGauge(item) {
    var target = parseInt(item.getAttribute('data-stat-target'), 10);
    var suffix = item.getAttribute('data-stat-suffix') || '';
    var gaugeColor = item.getAttribute('data-gauge-color') || '#c4622a';
    var fill = item.querySelector('.stats-gauge__fill');
    var valueEl = item.querySelector('.stats-band__value');

    /* Determine fill ratio: cap at 95% of circle for visual clarity */
    var ratioMap = {
      '2': 0.80,
      '0': 0.05,
      '6': 0.65,
      '30': 0.90
    };
    var ratio = ratioMap[String(target)] !== undefined ? ratioMap[String(target)] : Math.min(target / 120, 0.95);
    var targetOffset = CIRCUMFERENCE * (1 - ratio);

    if (fill) {
      fill.style.strokeDashoffset = targetOffset;
    }

    /* Counter animation */
    if (valueEl) {
      var startTime = null;
      var duration = 1200;

      function countStep(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.floor(eased * target);
        valueEl.textContent = current + suffix;
        if (progress < 1) {
          requestAnimationFrame(countStep);
        } else {
          valueEl.textContent = target + suffix;
        }
      }

      requestAnimationFrame(countStep);
    }
  }

  var statObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateStatGauge(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  for (var si = 0; si < statItems.length; si++) {
    statObserver.observe(statItems[si]);
  }

  /* -------------------------------------------------------
     15. SPARKLINES -- Animate stroke-dashoffset via JS observer
         (inline style overrides CSS, so JS drives the animation)
     ------------------------------------------------------- */
  var sparklineCards = document.querySelectorAll('.service-card');

  function initSparkline(path) {
    var len = 300; /* fallback */
    try {
      if (path.getTotalLength) {
        len = Math.ceil(path.getTotalLength());
      }
    } catch (e) { /* ignore */ }
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    return len;
  }

  /* Initialize all sparklines to hidden state */
  var allSparklinePaths = document.querySelectorAll('.sparkline__path');
  for (var sp = 0; sp < allSparklinePaths.length; sp++) {
    initSparkline(allSparklinePaths[sp]);
  }

  /* Animate sparkline when parent card becomes visible */
  var sparklineObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var path = entry.target.querySelector('.sparkline__path');
          if (path) {
            /* Trigger transition by removing the dashoffset */
            setTimeout(function () {
              path.style.strokeDashoffset = '0';
            }, 300);
          }
          sparklineObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  for (var sc = 0; sc < sparklineCards.length; sc++) {
    if (sparklineCards[sc].querySelector('.sparkline__path')) {
      sparklineObserver.observe(sparklineCards[sc]);
    }
  }

  /* -------------------------------------------------------
     16. METHODE PROGRESS BAR -- Animate on scroll
     ------------------------------------------------------- */
  var progressEl = document.getElementById('methodeProgress');
  var progressFill = document.getElementById('methodeProgressFill');

  if (progressEl && progressFill) {
    var progressObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            /* Delay fill animation slightly after track appears */
            setTimeout(function () {
              progressFill.classList.add('is-animating');
            }, 200);
            progressObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    progressObserver.observe(progressEl);
  }

  /* -------------------------------------------------------
     17. SECTION BREAKS -- Reveal via sectionObserver
         (section-break uses reveal-section class so it's already
          handled, but inner content needs a separate trigger)
     ------------------------------------------------------- */
  /* section-break .section-break__inner is animated via CSS
     keyed off .section-break.is-visible — sectionObserver covers this */

  /* -------------------------------------------------------
     18. STAGGER ENTRANCE -- Apply cubic-bezier + index delay
         to service and real cards for premium entrance
     ------------------------------------------------------- */
  function applyStaggerEntrance(gridSelector) {
    var grid = document.querySelector(gridSelector);
    if (!grid) return;
    var cards = grid.querySelectorAll('.reveal-item');
    for (var ci = 0; ci < cards.length; ci++) {
      /* We rely on itemObserver already computing delay,
         but override the transition function for smoother feel */
      cards[ci].style.transitionTimingFunction = 'cubic-bezier(0.2, 0.9, 0.2, 1)';
      cards[ci].style.transitionDuration = '0.75s';
    }
  }

  applyStaggerEntrance('.services__grid');
  applyStaggerEntrance('.realisations__grid');

  /* -------------------------------------------------------
     19. AVAILABILITY TAG -- Reduced motion guard (CSS pulse)
     ------------------------------------------------------- */
  /* avail-pulse animation is pure CSS -- no JS needed */

  /* -------------------------------------------------------
     20. ACTIVITY DOT MATRIX -- Generate dots + animate
     ------------------------------------------------------- */
  var activityGrid = document.getElementById('activityGrid');
  if (activityGrid) {
    var dotRows = [
      [0.12,0.30,0.50,0.80,0.65,0.90,1.00,0.75,0.45,0.80,0.90,0.60,1.00,0.80],
      [0.20,0.45,0.70,0.85,0.55,0.70,0.80,0.90,0.60,0.70,0.85,0.90,0.70,0.60],
      [0.30,0.50,0.60,0.75,0.80,0.60,0.95,0.70,0.80,0.90,0.60,0.80,0.95,1.00],
      [0.10,0.20,0.45,0.60,0.70,0.80,0.70,0.60,0.50,0.70,0.90,0.70,0.80,0.90],
      [0.40,0.60,0.80,0.50,0.90,0.70,0.60,0.80,0.90,0.60,0.70,0.95,0.80,0.70]
    ];

    dotRows.forEach(function(row, ri) {
      row.forEach(function(val, ci) {
        var dot = document.createElement('div');
        dot.className = 'activity__dot';
        dot.style.opacity = val;
        dot.style.transitionDelay = ((ri * 14 + ci) * 9) + 'ms';
        activityGrid.appendChild(dot);
      });
    });

    if (!prefersReducedMotion) {
      var dotObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var dots = activityGrid.querySelectorAll('.activity__dot');
            dots.forEach(function(d) {
              d.style.transform = 'scale(1)';
            });
            dotObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      dotObserver.observe(activityGrid);
    } else {
      var dots = activityGrid.querySelectorAll('.activity__dot');
      dots.forEach(function(d) {
        d.style.transform = 'scale(1)';
      });
    }
  }

  /* =========================================================
     21. HERO MOTION — Banderoles are CSS-only, no JS needed
     ========================================================= */

  /* Cleanup on visibility change (save CPU when tab hidden) */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopRibbonInterlude();
    } else {
      if (riInterludeVisible) startRibbonInterlude();
    }
  });


  /* =========================================================
     RIBBON INTERLUDE — Flowing text animation (services → méthode)
     ========================================================= */
  var riSection = document.getElementById('ribbon-interlude');
  var riTP1 = document.getElementById('riTP1');
  var riTP2 = document.getElementById('riTP2');
  var riTP3 = document.getElementById('riTP3');
  var riTP4 = document.getElementById('riTP4');
  var riMsgLabel = riSection ? riSection.querySelector('.ri-msg-label') : null;
  var riMsgTitle = riSection ? riSection.querySelector('.ri-msg-title') : null;
  var riMsgSub = riSection ? riSection.querySelector('.ri-msg-sub') : null;

  var riOffsets = [0, 25, 50, 75];
  var riSpeeds = [0.012, -0.018, 0.009, -0.014];
  var riRAF = null;
  var riInterludeVisible = false;

  function flowRibbonInterlude() {
    riOffsets[0] += riSpeeds[0];
    riOffsets[1] += riSpeeds[1];
    riOffsets[2] += riSpeeds[2];
    riOffsets[3] += riSpeeds[3];

    for (var i = 0; i < 4; i++) {
      if (riOffsets[i] > 100) riOffsets[i] -= 100;
      if (riOffsets[i] < -100) riOffsets[i] += 100;
    }

    if (riTP1) riTP1.setAttribute('startOffset', riOffsets[0] + '%');
    if (riTP2) riTP2.setAttribute('startOffset', riOffsets[1] + '%');
    if (riTP3) riTP3.setAttribute('startOffset', riOffsets[2] + '%');
    if (riTP4) riTP4.setAttribute('startOffset', riOffsets[3] + '%');

    if (riInterludeVisible) {
      riRAF = requestAnimationFrame(flowRibbonInterlude);
    }
  }

  function startRibbonInterlude() {
    if (!prefersReducedMotion && !riRAF) {
      riRAF = requestAnimationFrame(flowRibbonInterlude);
    }
  }

  function stopRibbonInterlude() {
    if (riRAF) {
      cancelAnimationFrame(riRAF);
      riRAF = null;
    }
  }

  if (riSection) {
    var riObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          riInterludeVisible = true;
          riSection.classList.add('is-visible');

          // Staggered doubt phrases reveal
          var riDoubts = riSection.querySelectorAll('.ri-doubt');
          riDoubts.forEach(function(doubt, i) {
            setTimeout(function() {
              doubt.classList.add('in-view');
            }, 200 + (i * 200));
          });

          // Staggered message reveal (after doubts finish)
          var msgDelay = 200 + (riDoubts.length * 200) + 300;
          setTimeout(function () { if (riMsgLabel) riMsgLabel.classList.add('in-view'); }, msgDelay);
          setTimeout(function () { if (riMsgTitle) riMsgTitle.classList.add('in-view'); }, msgDelay + 300);
          setTimeout(function () { if (riMsgSub) riMsgSub.classList.add('in-view'); }, msgDelay + 600);

          startRibbonInterlude();
        } else {
          riInterludeVisible = false;
          stopRibbonInterlude();
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    riObserver.observe(riSection);
  }

})();
