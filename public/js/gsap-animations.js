/* ============================================================
   LA TRAVERSE — GSAP Animations Layer
   GSAP 3.12 + ScrollTrigger + Lenis smooth scroll
   ============================================================ */

(function () {
  'use strict';

  /* --- Reduced motion gate --- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* Flag: prevent landing.js hero title vanilla animation */
  window.__gsapHeroTitle = true;

  /* -------------------------------------------------------
     1. LENIS — Smooth scroll avec momentum
     ------------------------------------------------------- */
  var lenis = new Lenis({
    duration: 1.2,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothTouch: false,
    touchMultiplier: 2
  });

  /* Connect Lenis RAF to GSAP ticker */
  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  /* Disable CSS scroll-behavior (Lenis gère ça) */
  document.documentElement.style.scrollBehavior = 'auto';

  /* Register ScrollTrigger */
  gsap.registerPlugin(ScrollTrigger);

  /* Sync Lenis scroll avec ScrollTrigger */
  lenis.on('scroll', ScrollTrigger.update);

  /* -------------------------------------------------------
     2. HERO TITLE — Lettre par lettre, flip 3D depuis le bas
     ------------------------------------------------------- */
  var heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    var laEl = heroTitle.querySelector('.hero__title-la');
    var traverseEl = heroTitle.querySelector('.hero__title-traverse');

    function splitToChars(el) {
      var text = el.textContent;
      el.innerHTML = '';
      text.split('').forEach(function (ch) {
        var span = document.createElement('span');
        span.className = 'g-ch';
        span.style.display = 'inline-block';
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        el.appendChild(span);
      });
      return el.querySelectorAll('.g-ch');
    }

    /* Force heroTitle visible — landing.js aurait animé ça */
    heroTitle.style.opacity = '1';
    heroTitle.style.transform = 'none';

    if (laEl && traverseEl) {
      var laChars   = Array.from(splitToChars(laEl));
      var travChars = Array.from(splitToChars(traverseEl));
      var allChars  = laChars.concat(travChars);

      /* État initial: invisible + rotationX 3D */
      gsap.set(allChars, {
        opacity: 0,
        y: 80,
        rotationX: -90,
        transformPerspective: 800,
        transformOrigin: '50% 100%'
      });

      /* Animation entrée */
      gsap.to(allChars, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.85,
        stagger: 0.04,
        ease: 'power3.out',
        delay: 0.35,
        onComplete: function () {
          /* Déclencher l'underline sur "Traverse" */
          var underline = { val: 0 };
          gsap.to(underline, {
            val: 1,
            duration: 0.6,
            ease: 'power2.out',
            onUpdate: function () {
              if (traverseEl) {
                traverseEl.style.setProperty('--underline-opacity', underline.val * 0.4);
                traverseEl.style.setProperty('--underline-scale', underline.val);
              }
            }
          });
          /* Révéler le descriptor */
          var descriptor = document.querySelector('.hero__descriptor');
          if (descriptor) {
            gsap.delayedCall(0.3, function () {
              descriptor.classList.add('is-visible');
            });
          }
        }
      });
    }
  }

  /* -------------------------------------------------------
     3. SECTION MÉTHODE — Pinned + étapes apparaissent au scroll
     ------------------------------------------------------- */
  var methodeSection   = document.getElementById('methode');
  var methodeSteps     = document.querySelectorAll('.methode__step');
  var methodeTimeLine  = document.getElementById('methodeTimelineLine');

  if (methodeSection && methodeSteps.length && window.innerWidth > 768) {

    /* Retirer reveal-item pour éviter conflit avec IntersectionObserver */
    methodeSteps.forEach(function (step) {
      step.classList.remove('reveal-item');
    });

    /* État initial GSAP */
    gsap.set(methodeSteps, { autoAlpha: 0, x: -50 });

    /* Reset la ligne CSS → GSAP prend le contrôle via scaleY */
    if (methodeTimeLine) {
      methodeTimeLine.classList.remove('is-drawing');
      /* Mettre height à 100% et animer via scaleY (GPU) */
      methodeTimeLine.style.height = '100%';
      methodeTimeLine.style.transition = 'none';
      gsap.set(methodeTimeLine, { scaleY: 0, transformOrigin: 'top center' });
    }

    /* Timeline GSAP pilotée par le scroll */
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: methodeSection,
        start: 'top 5%',
        end: '+=' + (methodeSteps.length * 300),
        scrub: 1.5,
        pin: true,
        anticipatePin: 1
      }
    });

    /* Ligne qui se dessine en sync avec le scroll */
    if (methodeTimeLine) {
      tl.to(methodeTimeLine, {
        scaleY: 1,
        duration: methodeSteps.length,
        ease: 'none'
      }, 0);
    }

    /* Chaque étape apparaît l'une après l'autre */
    methodeSteps.forEach(function (step, i) {
      tl.to(step, {
        autoAlpha: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, i * 1.0 + 0.15);
    });
  }

  /* -------------------------------------------------------
     4. CTA MAGNÉTIQUE — Le bouton suit le curseur avec spring
     ------------------------------------------------------- */
  var ctaBtn = document.querySelector('.hero__cta');
  if (ctaBtn && window.innerWidth > 768) {
    var ctaR = null;

    ctaBtn.addEventListener('mouseenter', function () {
      ctaR = ctaBtn.getBoundingClientRect();
    });

    ctaBtn.addEventListener('mousemove', function (e) {
      if (!ctaR) return;
      var dx = (e.clientX - (ctaR.left + ctaR.width  / 2)) * 0.38;
      var dy = (e.clientY - (ctaR.top  + ctaR.height / 2)) * 0.38;
      gsap.to(ctaBtn, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' });
    });

    ctaBtn.addEventListener('mouseleave', function () {
      gsap.to(ctaBtn, { x: 0, y: 0, duration: 0.85, ease: 'elastic.out(1, 0.4)' });
      ctaR = null;
    });
  }

  /* -------------------------------------------------------
     5. SECTION TITLES — Reveal plus dramatique avec clip-path
     ------------------------------------------------------- */
  document.querySelectorAll('.section__title h2, .section__title, .onyx-showcase__title, .trust-section__title, .ri-msg-title').forEach(function (el) {
    /* Éviter de ré-animer si déjà géré */
    if (el.closest('#methode')) return;

    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true
      },
      y: 55,
      opacity: 0,
      duration: 1.0,
      ease: 'power3.out'
    });
  });

  /* -------------------------------------------------------
     6. STATS BAND — Compteurs avec effet parallax léger
     ------------------------------------------------------- */
  gsap.from('.stats-band__inner', {
    scrollTrigger: {
      trigger: '.stats-band',
      start: 'top 85%',
      once: true
    },
    y: 40,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out'
  });

  /* -------------------------------------------------------
     7. ÉQUIPE CARDS — Entrée avec légère rotation 3D
     ------------------------------------------------------- */
  document.querySelectorAll('.equipe__card').forEach(function (card, i) {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        once: true
      },
      opacity: 0,
      y: 50,
      rotationY: i % 2 === 0 ? -8 : 8,
      transformPerspective: 1000,
      duration: 1.0,
      delay: i * 0.15,
      ease: 'power3.out',
      onStart: function () {
        card.classList.remove('reveal-item');
      }
    });
  });

})();
