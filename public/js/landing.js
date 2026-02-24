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

  function onNavScroll() {
    if (window.scrollY > 40) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
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
      setTimeout(function () {
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
      }, 800);
    });
  }

  /* =======================================================
     ALL MOTION ANIMATIONS -- gated by reduced motion
     ======================================================= */
  if (prefersReducedMotion) {
    /* Make everything immediately visible */
    var allReveal = document.querySelectorAll(
      '.reveal-section, .reveal-item, .reveal-item--from-left, .reveal-item--from-right, .section-break'
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

    /* Overline: show text immediately */
    var overlineEl = document.getElementById('heroOverline');
    if (overlineEl) {
      overlineEl.textContent = overlineEl.getAttribute('data-typewriter');
      overlineEl.classList.add('typewriter-done');
    }

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
     1. HERO ANIMATIONS
     ------------------------------------------------------- */

  /* 1a. Typewriter effect for the overline */
  var heroOverline = document.getElementById('heroOverline');

  function runTypewriter(el, text, speed, onDone) {
    var idx = 0;
    el.textContent = '';
    function type() {
      if (idx < text.length) {
        el.textContent += text[idx];
        idx++;
        setTimeout(type, speed);
      } else {
        el.classList.add('typewriter-done');
        if (onDone) onDone();
      }
    }
    type();
  }

  /* 1b. Wrap hero title words with inner spans for reveal */
  var heroTitle = document.getElementById('heroTitle');
  var heroWords = heroTitle ? heroTitle.querySelectorAll('.hero__word') : [];

  for (var w = 0; w < heroWords.length; w++) {
    var inner = document.createElement('span');
    inner.className = 'hero__word-inner';
    inner.innerHTML = heroWords[w].innerHTML;
    heroWords[w].innerHTML = '';
    heroWords[w].appendChild(inner);
  }

  /* 1c. Staggered hero sequence */
  var heroAccentEl = document.getElementById('heroAccent');
  var heroSubtitle = document.getElementById('heroSubtitle');
  var heroCTAs = document.getElementById('heroCTAs');
  var heroWordInners = heroTitle ? heroTitle.querySelectorAll('.hero__word-inner') : [];

  function runHeroSequence() {
    var baseDelay = 300; /* ms after typewriter starts */

    /* Start typewriter immediately */
    if (heroOverline) {
      runTypewriter(heroOverline, heroOverline.getAttribute('data-typewriter'), 55, null);
    }

    /* Reveal words one by one */
    for (var ww = 0; ww < heroWordInners.length; ww++) {
      (function (index, el) {
        setTimeout(function () {
          el.classList.add('is-revealed');
        }, baseDelay + index * 110);
      })(ww, heroWordInners[ww]);
    }

    /* Accent em tag clip-path reveal */
    var accentDelay = baseDelay + heroWordInners.length * 110 + 80;
    if (heroAccentEl) {
      setTimeout(function () {
        heroAccentEl.classList.add('is-revealed');
      }, accentDelay);
    }

    /* Subtitle fade-in */
    if (heroSubtitle) {
      setTimeout(function () {
        heroSubtitle.classList.add('is-revealed');
      }, accentDelay + 400);
    }

    /* CTAs slide-up */
    if (heroCTAs) {
      setTimeout(function () {
        heroCTAs.classList.add('is-revealed');
      }, accentDelay + 650);
    }
  }

  /* Run hero sequence on DOMContentLoaded (already in IIFE, so on load) */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runHeroSequence);
  } else {
    setTimeout(runHeroSequence, 80);
  }

  /* -------------------------------------------------------
     2. HERO PARALLAX -- subtle on scroll
     ------------------------------------------------------- */
  var heroContent = document.querySelector('.hero__content');

  if (window.innerWidth > 768 && heroContent) {
    window.addEventListener('scroll', function () {
      var scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        var offset = scrolled * 0.1;
        var fadeRatio = Math.max(0, 1 - scrolled / (window.innerHeight * 0.85));
        heroContent.style.transform = 'translateY(' + offset + 'px)';
        heroContent.style.opacity = fadeRatio;
      }
    }, { passive: true });
  }

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
     8. EQUIPE -- Photo + name + role animations
     ------------------------------------------------------- */

  /* Wrap equipe names in inner span for slide-up */
  var equipeNames = document.querySelectorAll('.equipe__name--animate');
  for (var en = 0; en < equipeNames.length; en++) {
    var nameInner = document.createElement('span');
    nameInner.className = 'equipe__name-inner';
    nameInner.textContent = equipeNames[en].textContent;
    equipeNames[en].textContent = '';
    equipeNames[en].appendChild(nameInner);
  }

  /* Photo and name animation observer -- uses reveal-item .is-visible class
     already handled by itemObserver. CSS transitions key off .equipe__member.is-visible
     so no extra JS needed for those. */

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
    /* 50 clients → 70%, 120 projects → 85%, 4 years → 55%, 100% → 95% */
    var ratioMap = {
      '50': 0.70,
      '120': 0.85,
      '4': 0.55,
      '100': 0.95
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

})();
