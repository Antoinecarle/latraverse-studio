// Studio onboarding — step navigation + parcours configuration
(function() {
  let currentStep = 1;
  const totalSteps = 5;
  let selectedMetier = null;
  let selectedParcours = null;
  let configSubStep = 1;
  const configSelections = { step1: new Set(), step2: new Set() };
  let isTransitioning = false;

  const steps = document.querySelectorAll('.ob-step');
  const dots = document.querySelectorAll('.ob-j-dot');
  const lines = document.querySelectorAll('.ob-j-line');
  const labels = document.querySelectorAll('.ob-j-labels span');
  const stepNum = document.getElementById('stepNum');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const configContent = document.getElementById('configContent');

  const metierNames = {
    commerce: 'Commerce & Retail',
    artisan: 'Artisanat & BTP',
    sante: 'Sante & Bien-etre',
    liberal: 'Profession liberale',
    sport: 'Sport & Loisirs',
    autre: 'Votre activite'
  };

  // =============================
  // PARCOURS DATA — complete
  // =============================
  const parcoursData = {
    vitrine: {
      name: 'Parcours Vitrine',
      stepLabels: ['Pages', 'Fonctionnalites', 'Estimation'],
      steps: [
        {
          title: 'Quelles pages pour votre site ?',
          desc: 'Selectionnez les pages dont vous avez besoin. On s\'occupe du design et du contenu.',
          options: [
            { id: 'accueil', name: 'Page d\'accueil', desc: 'Presentation de votre activite et accroche principale', included: true },
            { id: 'apropos', name: 'A propos / Equipe', desc: 'Votre histoire, vos valeurs, votre equipe' },
            { id: 'services', name: 'Services / Prestations', desc: 'Vos offres detaillees avec tarifs indicatifs' },
            { id: 'tarifs', name: 'Grille tarifaire', desc: 'Transparence totale sur vos prix' },
            { id: 'portfolio', name: 'Realisations / Portfolio', desc: 'Galerie de vos projets pour rassurer' },
            { id: 'blog', name: 'Blog / Actualites', desc: 'Partagez vos conseils et renforcez votre SEO' },
            { id: 'contact', name: 'Contact', desc: 'Formulaire, coordonnees et plan d\'acces', included: true },
            { id: 'faq', name: 'FAQ', desc: 'Repondez aux questions avant qu\'on vous les pose' }
          ]
        },
        {
          title: 'Quelles fonctionnalites ?',
          desc: 'Ajoutez les outils qui feront la difference pour vos clients.',
          options: [
            { id: 'seo', name: 'SEO local Google', desc: 'Apparaitre dans les recherches de votre zone' },
            { id: 'form', name: 'Formulaire intelligent', desc: 'Vos clients vous ecrivent en 30 secondes' },
            { id: 'gbp', name: 'Google Business Profile', desc: 'Votre fiche Google optimisee et a jour' },
            { id: 'galerie', name: 'Galerie photos', desc: 'Vos realisations en grand, en beau' },
            { id: 'avis', name: 'Avis clients integres', desc: 'Affichez vos avis Google directement' },
            { id: 'newsletter', name: 'Newsletter', desc: 'Gardez le lien avec vos clients par email' },
            { id: 'map', name: 'Plan d\'acces interactif', desc: 'Carte Google Maps integree' },
            { id: 'chat', name: 'Chat en direct', desc: 'Repondez aux visiteurs en temps reel' }
          ]
        }
      ],
      basePrice: 800,
      pricePerOption: 150,
      duration: '3-5 semaines',
      included: ['Design responsive mobile', 'Hebergement 1 an inclus', 'Formation a l\'autonomie', 'Support continu 6 mois']
    },

    application: {
      name: 'Parcours Application',
      stepLabels: ['Type d\'app', 'Fonctionnalites', 'Estimation'],
      steps: [
        {
          title: 'Quel type d\'application ?',
          desc: 'Choisissez ce qui correspond a votre besoin. On peut combiner plusieurs types.',
          options: [
            { id: 'suivi', name: 'Suivi client / CRM', desc: 'Gerez vos clients, leurs demandes et leur historique' },
            { id: 'rdv', name: 'Prise de rendez-vous', desc: 'Vos clients reservent un creneau directement' },
            { id: 'fidelite', name: 'Programme fidelite', desc: 'Recompensez vos clients reguliers' },
            { id: 'catalogue', name: 'Catalogue / Menu mobile', desc: 'Vos produits ou services dans la poche du client' },
            { id: 'terrain', name: 'Outil terrain', desc: 'Pour vos equipes en deplacement (chantier, visite, livraison)' },
            { id: 'messagerie', name: 'Messagerie equipe', desc: 'Communication interne simple et rapide' }
          ]
        },
        {
          title: 'Quelles fonctionnalites ?',
          desc: 'Personnalisez votre app avec les options adaptees a votre metier.',
          options: [
            { id: 'push', name: 'Notifications push', desc: 'Alertez vos clients ou equipe en temps reel' },
            { id: 'offline', name: 'Mode hors-ligne', desc: 'L\'app fonctionne meme sans connexion' },
            { id: 'paiement', name: 'Paiement in-app', desc: 'Vos clients paient directement dans l\'app' },
            { id: 'geo', name: 'Geolocalisation', desc: 'Localisez vos equipes ou points de service' },
            { id: 'qr', name: 'Scanner QR code', desc: 'Scannez pour valider, pointer ou informer' },
            { id: 'dashboard', name: 'Tableau de bord admin', desc: 'Pilotez tout depuis un seul ecran' },
            { id: 'sync', name: 'Synchronisation temps reel', desc: 'Donnees a jour instantanement partout' },
            { id: 'export', name: 'Export PDF / Partage', desc: 'Partagez des rapports et documents facilement' }
          ]
        }
      ],
      basePrice: 3000,
      pricePerOption: 400,
      duration: '6-10 semaines',
      included: ['iOS & Android natif', 'Design sur-mesure', 'Publication sur les stores', 'Formation equipe', 'Support continu 6 mois']
    },

    outil: {
      name: 'Parcours Outil',
      stepLabels: ['Modules', 'Fonctionnalites', 'Estimation'],
      steps: [
        {
          title: 'Quels modules pour votre outil ?',
          desc: 'Selectionnez les briques dont vous avez besoin au quotidien.',
          options: [
            { id: 'devis', name: 'Devis & Facturation', desc: 'Creez, envoyez et suivez vos devis en quelques clics' },
            { id: 'planning', name: 'Planning equipe', desc: 'Organisez les emplois du temps et les interventions' },
            { id: 'chantier', name: 'Suivi chantier / Projets', desc: 'Suivez l\'avancement de vos projets en temps reel' },
            { id: 'crm', name: 'CRM / Fichier clients', desc: 'Centralisez toutes vos informations clients' },
            { id: 'stock', name: 'Gestion de stock', desc: 'Suivez vos stocks, commandes et approvisionnements' },
            { id: 'compta', name: 'Tableau de bord financier', desc: 'CA, marges, tresorerie — tout en un coup d\'oeil' }
          ]
        },
        {
          title: 'Quelles fonctionnalites ?',
          desc: 'Ajoutez les options qui vous feront gagner du temps chaque jour.',
          options: [
            { id: 'multi', name: 'Multi-utilisateurs', desc: 'Chaque membre de l\'equipe a son propre acces' },
            { id: 'pdf', name: 'Export PDF automatique', desc: 'Generez des documents pro en un clic' },
            { id: 'notifs', name: 'Notifications & rappels', desc: 'Ne ratez plus aucune echeance ni relance' },
            { id: 'compta_int', name: 'Integration comptable', desc: 'Synchronisez avec votre expert-comptable' },
            { id: 'stats', name: 'Statistiques & rapports', desc: 'Analysez votre performance en chiffres' },
            { id: 'api', name: 'API & integrations tierces', desc: 'Connectez vos outils existants' },
            { id: 'backup', name: 'Sauvegarde automatique', desc: 'Vos donnees toujours en securite, toujours' },
            { id: 'mobile_comp', name: 'App mobile compagnon', desc: 'Accedez a tout depuis votre telephone' }
          ]
        }
      ],
      basePrice: 2500,
      pricePerOption: 350,
      duration: '6-12 semaines',
      included: ['Hebergement cloud securise', 'Mises a jour continues', 'Formation equipe complete', 'Support continu 6 mois']
    },

    ia: {
      name: 'Parcours IA',
      stepLabels: ['Outils IA', 'Canaux', 'Estimation'],
      steps: [
        {
          title: 'Quels outils IA pour votre activite ?',
          desc: 'Tout ce que l\'IA peut faire pour une PME / TPE. Concret, utile, sans jargon.',
          options: [
            { id: 'chatbot', name: 'Assistant client 24/7', desc: 'Un chatbot sur votre site qui repond aux questions de vos clients jour et nuit' },
            { id: 'email_auto', name: 'Reponses email automatiques', desc: 'L\'IA trie vos emails, repond aux questions simples et relance vos clients' },
            { id: 'contenu', name: 'Generation de contenu', desc: 'Posts reseaux sociaux, fiches produit, newsletters, descriptions — generes pour vous' },
            { id: 'devis_auto', name: 'Devis & factures automatiques', desc: 'Generer, envoyer et relancer vos devis sans effort manuel' },
            { id: 'leads', name: 'Qualification des prospects', desc: 'L\'IA identifie vos meilleurs leads et les priorise automatiquement' },
            { id: 'rdv_ia', name: 'Prise de RDV intelligente', desc: 'Vos clients reservent au bon moment, zero aller-retour par telephone' },
            { id: 'avis_ia', name: 'Gestion des avis en ligne', desc: 'Suivi, reponse personnalisee et analyse de vos avis Google et reseaux' },
            { id: 'reporting', name: 'Analyse & tableaux de bord', desc: 'KPIs, tendances et predictions pour piloter votre activite en un clin d\'oeil' },
            { id: 'transcription', name: 'Resume de reunions', desc: 'Transcription automatique et compte-rendu de vos echanges clients ou equipe' },
            { id: 'traduction', name: 'Traduction automatique', desc: 'Communiquez avec des clients internationaux sans barriere de langue' },
            { id: 'veille', name: 'Veille concurrentielle', desc: 'Surveillez vos concurrents et les tendances de votre marche automatiquement' },
            { id: 'assistant_interne', name: 'Assistant equipe interne', desc: 'Un assistant IA prive pour aider votre equipe au quotidien (recherche, redaction, analyse)' }
          ]
        },
        {
          title: 'Sur quels canaux deployer ?',
          desc: 'Ou vos clients et votre equipe interagissent ? On connecte l\'IA directement la ou ca compte.',
          options: [
            { id: 'web', name: 'Site web (widget)', desc: 'Chatbot ou assistant integre directement sur votre site' },
            { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Vos clients vous contactent via WhatsApp, l\'IA repond' },
            { id: 'social', name: 'Instagram / Facebook', desc: 'Reponses automatiques sur vos messages et commentaires' },
            { id: 'email_canal', name: 'Email professionnel', desc: 'L\'IA se connecte a votre boite email pour traiter les messages' },
            { id: 'google_biz', name: 'Google Business', desc: 'Gestion automatique des questions et avis sur votre fiche' },
            { id: 'sms', name: 'SMS', desc: 'Confirmations, rappels et notifications par SMS automatiques' },
            { id: 'crm_int', name: 'CRM existant', desc: 'Connection avec votre outil de gestion actuel (Hubspot, Pipedrive...)' },
            { id: 'compta_ia', name: 'Outils comptables', desc: 'Synchronisation avec votre logiciel de comptabilite' }
          ]
        }
      ],
      basePrice: 1500,
      pricePerOption: 300,
      duration: '2-6 semaines',
      included: ['Configuration sur-mesure', 'Entrainement IA sur vos donnees', 'Formation equipe', 'Support continu 6 mois', 'Mises a jour du modele IA']
    }
  };

  // =============================
  // MAIN STEP NAVIGATION
  // =============================
  function goToStep(n) {
    if (n < 1 || n > totalSteps || n === currentStep || isTransitioning) return;
    isTransitioning = true;

    var oldStep = document.querySelector('.ob-step.active');
    var newStep = document.querySelector('.ob-step[data-step="' + n + '"]');

    if (oldStep) {
      oldStep.classList.remove('active');
      oldStep.classList.add('leaving');
      oldStep.addEventListener('animationend', function handler() {
        oldStep.classList.remove('leaving');
        oldStep.removeEventListener('animationend', handler);
      }, { once: true });
    }

    setTimeout(function() {
      if (newStep) {
        newStep.classList.add('active');
        newStep.scrollTop = 0;
      }
      isTransitioning = false;
    }, 200);

    currentStep = n;

    // Reset config when entering step 4
    if (n === 4) {
      configSubStep = 1;
      configSelections.step1.clear();
      configSelections.step2.clear();
      initConfigStep();
    }

    updateProgress(n);
    updateButtons();
  }

  function updateProgress(n) {
    dots.forEach(function(d) {
      var num = parseInt(d.dataset.dot);
      d.classList.remove('active', 'done');
      if (num === n) d.classList.add('active');
      else if (num < n) d.classList.add('done');
    });
    lines.forEach(function(l) {
      var num = parseInt(l.dataset.line);
      l.classList.toggle('done', num < n);
    });
    labels.forEach(function(l) {
      var num = parseInt(l.dataset.label);
      l.classList.toggle('active', num === n);
    });
    stepNum.textContent = String(n).padStart(2, '0');
  }

  function updateButtons() {
    var isFirstStep = (currentStep === 1);
    var isLastStep = (currentStep === totalSteps);

    prevBtn.style.visibility = isFirstStep ? 'hidden' : 'visible';
    nextBtn.style.display = isLastStep ? 'none' : '';

    // Hide next button on estimation step (form handles progression)
    if (currentStep === 4 && configSubStep === 3) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.innerHTML = 'Suivant <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
  }

  // =============================
  // BUTTON HANDLERS
  // =============================
  nextBtn.addEventListener('click', function() {
    if (currentStep === 4 && configSubStep < 3) {
      goToConfigSubStep(configSubStep + 1);
    } else {
      goToStep(currentStep + 1);
    }
  });

  prevBtn.addEventListener('click', function() {
    if (currentStep === 4 && configSubStep > 1) {
      goToConfigSubStep(configSubStep - 1);
    } else {
      goToStep(currentStep - 1);
    }
  });

  // Dot click navigation (main)
  dots.forEach(function(d) {
    d.addEventListener('click', function() {
      goToStep(parseInt(d.dataset.dot));
    });
  });

  // =============================
  // METIER SELECTION (Step 2)
  // =============================
  document.querySelectorAll('.ob-metier-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.ob-metier-card').forEach(function(c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      selectedMetier = card.dataset.metier;
    });
  });

  // =============================
  // PARCOURS SELECTION (Step 3)
  // =============================
  document.querySelectorAll('.ob-parcours-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.ob-parcours-card').forEach(function(c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      selectedParcours = card.dataset.parcours;
    });
  });

  // =============================
  // CONFIG SUB-STEPS (Step 4)
  // =============================
  function initConfigStep() {
    if (!selectedParcours || !parcoursData[selectedParcours]) {
      renderConfigContent();
      return;
    }
    var parcours = parcoursData[selectedParcours];

    // Set sub-step labels
    var label1 = document.getElementById('configLabel1');
    var label2 = document.getElementById('configLabel2');
    var label3 = document.getElementById('configLabel3');
    if (label1) label1.textContent = parcours.stepLabels[0];
    if (label2) label2.textContent = parcours.stepLabels[1];
    if (label3) label3.textContent = parcours.stepLabels[2];

    // Pre-select default included options
    if (parcours.steps[0]) {
      parcours.steps[0].options.forEach(function(opt) {
        if (opt.included) configSelections.step1.add(opt.id);
      });
    }

    configSubStep = 1;
    updateConfigStepper();
    renderConfigContent();
  }

  function goToConfigSubStep(n) {
    if (n < 1 || n > 3 || n === configSubStep) return;
    configSubStep = n;
    updateConfigStepper();
    renderConfigContent();
    updateButtons();
  }

  function updateConfigStepper() {
    var cdots = document.querySelectorAll('.ob-config-dot');
    var clines = document.querySelectorAll('.ob-config-line');
    var clabels = document.querySelectorAll('.ob-config-labels span');

    cdots.forEach(function(d) {
      var num = parseInt(d.dataset.cdot);
      d.classList.remove('active', 'done');
      if (num === configSubStep) d.classList.add('active');
      else if (num < configSubStep) d.classList.add('done');
    });
    clines.forEach(function(l) {
      var num = parseInt(l.dataset.cline);
      l.classList.toggle('done', num < configSubStep);
    });
    clabels.forEach(function(l) {
      var num = parseInt(l.dataset.clabel);
      l.classList.toggle('active', num === configSubStep);
    });
  }

  function renderConfigContent() {
    if (!selectedParcours || !parcoursData[selectedParcours]) {
      configContent.innerHTML = '<div class="ob-config-empty"><p>Retournez a l\'etape precedente pour choisir un parcours.</p></div>';
      return;
    }
    var parcours = parcoursData[selectedParcours];

    if (configSubStep === 3) {
      renderEstimation(parcours);
    } else {
      var stepData = parcours.steps[configSubStep - 1];
      renderOptions(stepData, configSubStep);
    }
  }

  function renderOptions(stepData, subStep) {
    var setKey = subStep === 1 ? 'step1' : 'step2';
    var selections = configSelections[setKey];

    var html = '<div class="ob-config-welcome">';
    html += '<h2 class="ob-config-title">' + stepData.title + '</h2>';
    html += '<p class="ob-config-desc">' + stepData.desc + '</p>';
    html += '</div>';
    html += '<div class="ob-config-options">';

    stepData.options.forEach(function(opt) {
      var isSelected = selections.has(opt.id) || opt.included;
      var isIncluded = opt.included || false;
      html += '<button class="ob-config-option' + (isSelected ? ' selected' : '') + (isIncluded ? ' included' : '') + '" data-option="' + opt.id + '" data-substep="' + subStep + '">';
      html += '<div class="ob-config-option-check"></div>';
      html += '<div class="ob-config-option-body">';
      html += '<span class="ob-config-option-name">' + opt.name + '</span>';
      html += '<span class="ob-config-option-desc">' + opt.desc + '</span>';
      html += '</div></button>';
    });

    html += '</div>';
    configContent.innerHTML = html;

    // Attach click handlers
    configContent.querySelectorAll('.ob-config-option:not(.included)').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var optionId = btn.dataset.option;
        if (selections.has(optionId)) {
          selections.delete(optionId);
          btn.classList.remove('selected');
        } else {
          selections.add(optionId);
          btn.classList.add('selected');
        }
      });
    });
  }

  function renderEstimation(parcours) {
    var step1Count = configSelections.step1.size;
    var step2Count = configSelections.step2.size;
    var totalOptions = step1Count + step2Count;
    var priceMin = parcours.basePrice + (totalOptions * parcours.pricePerOption);
    var priceMax = Math.round(priceMin * 1.4);

    var metierLabel = selectedMetier ? metierNames[selectedMetier] : 'votre activite';

    var selectedStep1 = parcours.steps[0].options.filter(function(o) { return configSelections.step1.has(o.id); });
    var selectedStep2 = parcours.steps[1].options.filter(function(o) { return configSelections.step2.has(o.id); });

    var checkSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4622a" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    var checkMuted = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(240,232,220,0.4)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';

    var featuresHtml = '';
    if (selectedStep1.length === 0 && selectedStep2.length === 0) {
      featuresHtml = '<div class="ob-estimation-empty">Aucune option selectionnee. Retournez en arriere pour personnaliser.</div>';
    } else {
      selectedStep1.forEach(function(o) {
        featuresHtml += '<div class="ob-estimation-feature">' + checkSvg + '<span>' + o.name + '</span></div>';
      });
      selectedStep2.forEach(function(o) {
        featuresHtml += '<div class="ob-estimation-feature">' + checkSvg + '<span>' + o.name + '</span></div>';
      });
    }

    var includedHtml = '';
    parcours.included.forEach(function(item) {
      includedHtml += '<div class="ob-estimation-feature ob-estimation-included">' + checkMuted + '<span>' + item + '</span></div>';
    });

    var html = '<div class="ob-estimation-card">';
    html += '<div class="ob-estimation-header">';
    html += '<div class="ob-estimation-badge">Recommande pour ' + metierLabel + '</div>';
    html += '<h3 class="ob-estimation-title">' + parcours.name + '</h3>';
    html += '</div>';
    html += '<div class="ob-estimation-features">';
    html += featuresHtml;
    html += '<div class="ob-estimation-divider"></div>';
    html += includedHtml;
    html += '</div>';
    html += '<div class="ob-estimation-footer">';
    html += '<div class="ob-estimation-price-block">';
    html += '<span class="ob-estimation-from">Estimation</span>';
    html += '<span class="ob-estimation-amount">' + priceMin.toLocaleString('fr-FR') + ' &ndash; ' + priceMax.toLocaleString('fr-FR') + ' &euro; HT</span>';
    html += '</div>';
    html += '<div class="ob-estimation-duration-block">';
    html += '<span class="ob-estimation-from">Delai</span>';
    html += '<span class="ob-estimation-time">' + parcours.duration + '</span>';
    html += '</div>';
    html += '</div>';

    // Email capture form
    html += '<div class="ob-lead-form">';
    html += '<div class="ob-lead-form-title">Recevez votre estimation detaillee</div>';
    html += '<div class="ob-lead-form-desc">On vous recontacte pour un premier echange gratuit et sans engagement.</div>';
    html += '<form id="leadForm" class="ob-lead-fields">';
    html += '<input type="email" id="leadEmail" name="email" placeholder="Votre email *" required class="ob-lead-input" />';
    html += '<div class="ob-lead-row">';
    html += '<input type="text" id="leadName" name="name" placeholder="Votre nom (optionnel)" class="ob-lead-input" />';
    html += '<input type="tel" id="leadPhone" name="phone" placeholder="Telephone (optionnel)" class="ob-lead-input" />';
    html += '</div>';
    html += '<button type="submit" class="ob-lead-submit" id="leadSubmitBtn">';
    html += '<span class="ob-lead-submit-text">Envoyer ma demande</span>';
    html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    html += '</button>';
    html += '<div id="leadFormMsg" class="ob-lead-msg"></div>';
    html += '</form>';
    html += '</div>';

    html += '</div>';

    configContent.innerHTML = html;

    // Attach form submission handler
    var form = document.getElementById('leadForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitLeadForm(parcours, priceMin, priceMax);
      });
    }
  }

  function submitLeadForm(parcours, priceMin, priceMax) {
    var email = document.getElementById('leadEmail').value.trim();
    var name = document.getElementById('leadName').value.trim();
    var phone = document.getElementById('leadPhone').value.trim();
    var submitBtn = document.getElementById('leadSubmitBtn');
    var msgEl = document.getElementById('leadFormMsg');

    if (!email) {
      msgEl.textContent = 'Veuillez renseigner votre email.';
      msgEl.className = 'ob-lead-msg ob-lead-msg-error';
      return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.querySelector('.ob-lead-submit-text').textContent = 'Envoi en cours...';

    var payload = {
      email: email,
      name: name || null,
      phone: phone || null,
      metier: selectedMetier ? metierNames[selectedMetier] : null,
      parcours: selectedParcours,
      selections: {
        step1: Array.from(configSelections.step1),
        step2: Array.from(configSelections.step2)
      },
      estimated_min: priceMin,
      estimated_max: priceMax,
      duration: parcours.duration
    };

    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        msgEl.textContent = 'Merci ! On vous recontacte tres vite.';
        msgEl.className = 'ob-lead-msg ob-lead-msg-success';
        // Auto-advance to step 5 after a short delay
        setTimeout(function() {
          goToStep(5);
        }, 1500);
      } else {
        msgEl.textContent = data.error || 'Une erreur est survenue.';
        msgEl.className = 'ob-lead-msg ob-lead-msg-error';
        submitBtn.disabled = false;
        submitBtn.querySelector('.ob-lead-submit-text').textContent = 'Envoyer ma demande';
      }
    })
    .catch(function() {
      msgEl.textContent = 'Erreur de connexion. Reessayez.';
      msgEl.className = 'ob-lead-msg ob-lead-msg-error';
      submitBtn.disabled = false;
      submitBtn.querySelector('.ob-lead-submit-text').textContent = 'Envoyer ma demande';
    });
  }

  // Config dot click navigation
  document.querySelectorAll('.ob-config-dot').forEach(function(d) {
    d.addEventListener('click', function() {
      var n = parseInt(d.dataset.cdot);
      if (n && n !== configSubStep) {
        goToConfigSubStep(n);
      }
    });
  });

  // Watch step 4 activation
  var observer = new MutationObserver(function() {
    var step4 = document.querySelector('.ob-step[data-step="4"]');
    if (step4 && step4.classList.contains('active')) {
      initConfigStep();
    }
  });
  steps.forEach(function(s) {
    observer.observe(s, { attributes: true, attributeFilter: ['class'] });
  });

})();
