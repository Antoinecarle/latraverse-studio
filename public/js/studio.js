// Studio onboarding - step navigation
(function() {
  let currentStep = 1;
  const totalSteps = 5;
  let selectedMetier = null;
  const selectedNeeds = new Set();

  const steps = document.querySelectorAll('.ob-step');
  const dots = document.querySelectorAll('.ob-j-dot');
  const lines = document.querySelectorAll('.ob-j-line');
  const labels = document.querySelectorAll('.ob-j-labels span');
  const stepNum = document.getElementById('stepNum');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  function goToStep(n) {
    if (n < 1 || n > totalSteps) return;
    currentStep = n;

    // Update steps visibility
    steps.forEach(s => s.classList.remove('active'));
    const target = document.querySelector(`.ob-step[data-step="${n}"]`);
    if (target) target.classList.add('active');

    // Update dots
    dots.forEach(d => {
      const num = parseInt(d.dataset.dot);
      d.classList.remove('active', 'done');
      if (num === n) d.classList.add('active');
      else if (num < n) d.classList.add('done');
    });

    // Update lines
    lines.forEach(l => {
      const num = parseInt(l.dataset.line);
      l.classList.toggle('done', num < n);
    });

    // Update labels
    labels.forEach(l => {
      const num = parseInt(l.dataset.label);
      l.classList.toggle('active', num === n);
    });

    // Update step indicator
    stepNum.textContent = String(n).padStart(2, '0');

    // Update buttons
    prevBtn.style.visibility = n === 1 ? 'hidden' : 'visible';
    if (n === totalSteps) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = '';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Next / Prev
  nextBtn.addEventListener('click', () => goToStep(currentStep + 1));
  prevBtn.addEventListener('click', () => goToStep(currentStep - 1));

  // Dot click navigation
  dots.forEach(d => {
    d.addEventListener('click', () => {
      const target = parseInt(d.dataset.dot);
      goToStep(target);
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
      if (selectedNeeds.has(need)) {
        selectedNeeds.delete(need);
      } else {
        selectedNeeds.add(need);
      }
    });
  });

  // Update solution based on selections when entering step 4
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
    ecommerce: 'Boutique e-commerce',
    app: 'Application mobile sur-mesure',
    outil: 'Outil de gestion metier',
    seo: 'Referencement local Google'
  };

  // Observe step 4 becoming active to update solution
  const observer = new MutationObserver(() => {
    const step4 = document.querySelector('.ob-step[data-step="4"]');
    if (step4 && step4.classList.contains('active')) {
      updateSolution();
    }
  });
  steps.forEach(s => observer.observe(s, { attributes: true, attributeFilter: ['class'] }));

  function updateSolution() {
    const metierLabel = selectedMetier ? metierNames[selectedMetier] : 'Votre activite';
    solutionTitle.textContent = `Parcours ${metierLabel}`;

    const features = [];
    if (selectedNeeds.size > 0) {
      selectedNeeds.forEach(n => {
        if (needLabels[n]) features.push(needLabels[n]);
      });
    }
    // Always add these base features
    features.push('Formation a l\'autonomie');
    features.push('Support continu post-lancement');

    solutionFeatures.innerHTML = features.map(f => `
      <div class="ob-solution-feature">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4622a" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${f}</span>
      </div>
    `).join('');
  }
})();
