// Studio onboarding — step navigation
(function() {
  let currentStep = 1;
  const totalSteps = 5;
  let selectedMetier = null;
  const selectedNeeds = new Set();
  let isTransitioning = false;

  const steps = document.querySelectorAll('.ob-step');
  const dots = document.querySelectorAll('.ob-j-dot');
  const lines = document.querySelectorAll('.ob-j-line');
  const labels = document.querySelectorAll('.ob-j-labels span');
  const stepNum = document.getElementById('stepNum');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  function goToStep(n) {
    if (n < 1 || n > totalSteps || n === currentStep || isTransitioning) return;
    isTransitioning = true;

    const oldStep = document.querySelector('.ob-step.active');
    const newStep = document.querySelector(`.ob-step[data-step="${n}"]`);

    // Animate out current step
    if (oldStep) {
      oldStep.classList.remove('active');
      oldStep.classList.add('leaving');
      oldStep.addEventListener('animationend', function handler() {
        oldStep.classList.remove('leaving');
        oldStep.removeEventListener('animationend', handler);
      }, { once: true });
    }

    // Animate in new step after short delay
    setTimeout(() => {
      if (newStep) {
        newStep.classList.add('active');
        // Scroll the step content to top
        newStep.scrollTop = 0;
      }
      isTransitioning = false;
    }, 200);

    currentStep = n;
    updateProgress(n);
    updateButtons(n);
  }

  function updateProgress(n) {
    // Dots
    dots.forEach(d => {
      const num = parseInt(d.dataset.dot);
      d.classList.remove('active', 'done');
      if (num === n) d.classList.add('active');
      else if (num < n) d.classList.add('done');
    });

    // Lines
    lines.forEach(l => {
      const num = parseInt(l.dataset.line);
      l.classList.toggle('done', num < n);
    });

    // Labels
    labels.forEach(l => {
      const num = parseInt(l.dataset.label);
      l.classList.toggle('active', num === n);
    });

    // Step indicator
    stepNum.textContent = String(n).padStart(2, '0');
  }

  function updateButtons(n) {
    prevBtn.style.visibility = n === 1 ? 'hidden' : 'visible';
    if (n === totalSteps) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = '';
    }
  }

  // Button clicks
  nextBtn.addEventListener('click', () => goToStep(currentStep + 1));
  prevBtn.addEventListener('click', () => goToStep(currentStep - 1));

  // Dot click navigation
  dots.forEach(d => {
    d.addEventListener('click', () => {
      goToStep(parseInt(d.dataset.dot));
    });
  });

  // Metier card selection (single)
  document.querySelectorAll('.ob-metier-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.ob-metier-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedMetier = card.dataset.metier;
    });
  });

  // Need card toggle (multi)
  document.querySelectorAll('.ob-need-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const need = card.dataset.need;
      if (selectedNeeds.has(need)) selectedNeeds.delete(need);
      else selectedNeeds.add(need);
    });
  });

  // Dynamic solution content
  const solutionTitle = document.getElementById('solutionTitle');
  const solutionFeatures = document.getElementById('solutionFeatures');

  const metierNames = {
    commerce: 'Commerce & Retail',
    artisan: 'Artisanat & BTP',
    sante: 'Sante & Bien-etre',
    liberal: 'Profession liberale',
    sport: 'Sport & Loisirs',
    autre: 'Votre activite'
  };

  const needLabels = {
    site: 'Site professionnel responsive',
    reservation: 'Systeme de reservation en ligne',
    assistant: 'Assistant IA conversationnel',
    app: 'Application mobile sur-mesure',
    auto: 'Automatisation des taches par IA',
    contenu: 'Generation de contenu par IA'
  };

  // Watch step 4 activation
  const observer = new MutationObserver(() => {
    const step4 = document.querySelector('.ob-step[data-step="4"]');
    if (step4 && step4.classList.contains('active')) updateSolution();
  });
  steps.forEach(s => observer.observe(s, { attributes: true, attributeFilter: ['class'] }));

  function updateSolution() {
    const label = selectedMetier ? metierNames[selectedMetier] : 'Votre activite';
    solutionTitle.textContent = `Parcours ${label}`;

    const features = [];
    selectedNeeds.forEach(n => { if (needLabels[n]) features.push(needLabels[n]); });
    features.push("Formation a l'autonomie");
    features.push('Support continu post-lancement');

    solutionFeatures.innerHTML = features.map(f => `
      <div class="ob-solution-feature">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4622a" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${f}</span>
      </div>
    `).join('');
  }
})();
