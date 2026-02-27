/* ============================================================
   LA TRAVERSE — Branding Studio JS (Complete)
   ============================================================ */

(function () {
  'use strict';

  // ============ DOM REFS ============
  const canvas = document.getElementById('canvas');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const canvasArea = document.getElementById('canvas-area');
  const canvasHeadline = document.getElementById('canvas-headline');
  const canvasSubline = document.getElementById('canvas-subline');
  const canvasBody = document.getElementById('canvas-body');
  const canvasCta = document.getElementById('canvas-cta');
  const canvasLogo = document.getElementById('canvas-logo');
  const canvasBorder = document.getElementById('canvas-border');
  const canvasGrain = document.getElementById('canvas-grain');
  const canvasBgImage = document.getElementById('canvas-bgimage');
  const canvasVignette = document.getElementById('canvas-vignette');
  const canvasDecorations = document.getElementById('canvas-decorations');
  const canvasGrid = document.getElementById('canvas-grid');
  const canvasStickers = document.getElementById('canvas-stickers');
  const canvasStickersBelow = document.getElementById('canvas-stickers-below');
  const layersPanel = document.getElementById('layers-panel');
  const layersPanelBody = document.getElementById('layers-panel-body');
  const btnLayers = document.getElementById('btn-layers');
  const layersPanelClose = document.getElementById('layers-panel-close');
  const infoFormat = document.getElementById('info-format');
  const infoTemplate = document.getElementById('info-template');
  const exportOverlay = document.getElementById('export-overlay');

  // Forward reference for free layout (defined later, called from updateCanvas)
  var _applyFreeLayoutFn = null;
  function reapplyFreeLayout() {
    if (_applyFreeLayoutFn) _applyFreeLayoutFn();
  }

  // ============ DEFAULT STATE ============
  function getDefaultState() {
    return {
      format: { w: 1080, h: 1080, label: 'Post' },
      template: 'minimal',
      headline: 'Studio digital',
      subline: 'Marseille',
      body: 'Sites, apps et outils sur-mesure pour artisans, commercants et independants.',
      cta: 'latraverse.studio',
      bgColor: '#1a1714',
      textColor: '#f0e8dc',
      accentColor: '#c4622a',
      accentColor2: '#e8a87c',
      stylePack: null,
      showLogo: true,
      showBorder: true,
      borderStyle: 'classic',
      logoScale: 100,
      showGrain: false,
      showVignette: false,
      bgImage: null,
      bgOpacity: 70,
      bgBlur: 0,
      bgBrightness: 100,
      bgContrast: 100,
      bgSaturation: 100,
      gradient: { enabled: false, angle: 135, start: '#c4622a', end: '#1a1714' },
      typoHeadline: { font: "'Playfair Display', serif", size: 48, weight: '700', align: 'left', case: 'none', lh: 110, ls: 0 },
      typoSubline: { size: 14, weight: '400', ls: 0, case: 'none' },
      typoBody: { font: "'Libre Baskerville', serif", size: 15, weight: '400', align: 'left', lh: 160 },
      typoCta: { size: 12, weight: '500', ls: 0 },
      fxShadow: 0,
      fxGlow: 0,
      fxOutline: false,
      fxGradientText: false,
      fxGradientStart: '#c4622a',
      fxGradientEnd: '#e8a87c',
      fxGradientAngle: 135,
      bgPattern: 'none',
      bgPatternOpacity: 15,
      bgPatternScale: 20,
      bgPatternColor: '',
      ctaStyle: 'text',
      canvasPadding: 10,
      opacitySubline: 100,
      opacityBody: 100,
      opacityCta: 100,
      headlineRotation: 0,
      headlineDecoration: 'none',
      textShadowX: 0,
      textShadowY: 2,
      textShadowColor: '#000000',
      contentAlign: 'start',
      bgOverlayColor: '#000000',
      bgOverlayOpacity: 0,
      showSubline: true,
      showBody: true,
      showCta: true,
      headlineColor: '',
      sublineColor: '',
      bodyColor: '',
      ctaBgColor: '',
      ctaTextColor: '',
      sublineStyle: 'text',
      bgPosition: 'center',
      bgSize: 'cover',
      zoom: 100,
      gridVisible: false,
      stickers: [],
      freeLayout: false,
      textPositions: {
        logo:     { x: 10, y: 5 },
        headline: { x: 10, y: 30 },
        subline:  { x: 10, y: 50 },
        body:     { x: 10, y: 60 },
        cta:      { x: 10, y: 85 }
      },
    };
  }

  let state = getDefaultState();

  // ============ PUB PERSISTENCE ============
  let currentPubId = null;
  let autoSaveTimer = null;
  let isSaving = false;
  const AUTOSAVE_DELAY = 1200;

  const pubNameInput = document.getElementById('pub-name');
  const pubToggle = document.getElementById('pub-toggle');
  const pubDropdown = document.getElementById('pub-dropdown');
  const pubList = document.getElementById('pub-list');
  const pubEmpty = document.getElementById('pub-empty');
  const saveIndicator = document.getElementById('save-indicator');
  const btnNewPub = document.getElementById('btn-new-pub');

  function showSaveStatus(status) {
    if (!saveIndicator) return;
    saveIndicator.className = 'save-indicator ' + status;
    if (status === 'saving') saveIndicator.textContent = 'Sauvegarde...';
    else if (status === 'saved') saveIndicator.textContent = 'OK';
    else if (status === 'error') saveIndicator.textContent = 'Erreur';
    else saveIndicator.textContent = '';
    if (status === 'saved') {
      setTimeout(() => { if (saveIndicator.classList.contains('saved')) saveIndicator.textContent = ''; }, 2000);
    }
  }

  async function uploadBgIfDataUrl() {
    if (!state.bgImage || !state.bgImage.startsWith('data:')) return;
    try {
      const match = state.bgImage.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) return;
      const res = await fetch('/api/branding/upload-base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mimeType: match[1], data: match[2] }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        state.bgImage = data.url;
        canvasBgImage.style.backgroundImage = 'url(' + data.url + ')';
      }
    } catch (e) { /* ignore upload errors during auto-save */ }
  }

  async function autoSave() {
    if (!currentPubId || isSaving) return;
    isSaving = true;
    showSaveStatus('saving');
    try {
      await uploadBgIfDataUrl();
      const stateToSave = JSON.parse(JSON.stringify(state));
      delete stateToSave.zoom;
      delete stateToSave.gridVisible;
      await fetch('/api/brandings/' + currentPubId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: stateToSave, name: pubNameInput ? pubNameInput.value : undefined }),
      });
      showSaveStatus('saved');
    } catch (e) {
      showSaveStatus('error');
    }
    isSaving = false;
  }

  function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(autoSave, AUTOSAVE_DELAY);
  }

  async function createNewPub(name) {
    try {
      const res = await fetch('/api/brandings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || 'Sans titre', state: getDefaultState() }),
      });
      const pub = await res.json();
      currentPubId = pub.id;
      localStorage.setItem('branding_last_pub', pub.id);
      state = getDefaultState();
      historyPaused = true;
      restoreFromState();
      historyPaused = false;
      history = [JSON.parse(JSON.stringify(state))];
      historyIndex = 0;
      updateUndoRedoButtons();
      if (pubNameInput) pubNameInput.value = pub.name;
      loadPubList();
      return pub;
    } catch (e) {
      console.error('Create pub error:', e);
    }
  }

  async function loadPub(id) {
    try {
      const res = await fetch('/api/brandings/' + id);
      if (!res.ok) return false;
      const pub = await res.json();
      currentPubId = pub.id;
      localStorage.setItem('branding_last_pub', pub.id);
      state = Object.assign(getDefaultState(), pub.state || {});
      historyPaused = true;
      restoreFromState();
      historyPaused = false;
      history = [JSON.parse(JSON.stringify(state))];
      historyIndex = 0;
      updateUndoRedoButtons();
      if (pubNameInput) pubNameInput.value = pub.name || 'Sans titre';
      return true;
    } catch (e) {
      console.error('Load pub error:', e);
      return false;
    }
  }

  async function deletePub(id) {
    try {
      await fetch('/api/brandings/' + id, { method: 'DELETE' });
      if (currentPubId === id) {
        currentPubId = null;
        const list = await (await fetch('/api/brandings')).json();
        if (list.brandings && list.brandings.length > 0) {
          await loadPub(list.brandings[0].id);
        } else {
          await createNewPub();
        }
      }
      loadPubList();
    } catch (e) {
      console.error('Delete pub error:', e);
    }
  }

  async function duplicatePub(id) {
    try {
      const res = await fetch('/api/brandings/' + id);
      if (!res.ok) return;
      const pub = await res.json();
      var dupState = JSON.parse(JSON.stringify(pub.state || {}));
      var dupName = (pub.name || 'Sans titre') + ' (copie)';
      var createRes = await fetch('/api/brandings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: dupState, name: dupName }),
      });
      if (createRes.ok) {
        var newPub = await createRes.json();
        await autoSave();
        await loadPub(newPub.id);
        loadPubList();
      }
    } catch (e) {
      console.error('Duplicate pub error:', e);
    }
  }

  async function loadPubList() {
    try {
      const res = await fetch('/api/brandings');
      const data = await res.json();
      const items = data.brandings || [];
      if (items.length === 0) {
        if (pubList) pubList.innerHTML = '';
        if (pubEmpty) pubEmpty.style.display = '';
        return;
      }
      if (pubEmpty) pubEmpty.style.display = 'none';
      if (pubList) {
        pubList.innerHTML = items.map(b => {
          const isActive = b.id === currentPubId;
          const date = new Date(b.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          return '<div class="pub-item' + (isActive ? ' active' : '') + '" data-id="' + b.id + '">' +
            '<div class="pub-item__info">' +
              '<div class="pub-item__name">' + (b.name || 'Sans titre') + '</div>' +
              '<div class="pub-item__meta">' + (b.template || 'minimal') + ' &middot; ' + (b.format || 'Post') + ' &middot; ' + date + '</div>' +
            '</div>' +
            '<div class="pub-item__actions">' +
              '<button class="pub-item__dup" data-id="' + b.id + '" title="Dupliquer"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="8" height="8" rx="1"/><path d="M3 3V2a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1"/></svg></button>' +
              (isActive ? '' : '<button class="pub-item__delete" data-id="' + b.id + '" title="Supprimer">&times;</button>') +
            '</div>' +
          '</div>';
        }).join('');
        pubList.querySelectorAll('.pub-item').forEach(item => {
          item.addEventListener('click', (e) => {
            if (e.target.closest('.pub-item__delete') || e.target.closest('.pub-item__dup')) return;
            const id = item.dataset.id;
            if (id !== currentPubId) {
              autoSave().then(() => loadPub(id).then(() => {
                loadPubList();
                closePubDropdown();
              }));
            } else {
              closePubDropdown();
            }
          });
        });
        pubList.querySelectorAll('.pub-item__delete').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Supprimer cette pub ?')) deletePub(btn.dataset.id);
          });
        });
        pubList.querySelectorAll('.pub-item__dup').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            duplicatePub(btn.dataset.id);
          });
        });
      }
    } catch (e) {
      console.error('Load pub list error:', e);
    }
  }

  function closePubDropdown() {
    if (pubDropdown) pubDropdown.classList.remove('open');
    if (pubToggle) pubToggle.classList.remove('open');
  }

  // Pub name input — auto-save on change
  if (pubNameInput) {
    let nameTimer;
    pubNameInput.addEventListener('input', () => {
      clearTimeout(nameTimer);
      nameTimer = setTimeout(scheduleAutoSave, 600);
    });
  }

  // Toggle dropdown
  if (pubToggle) pubToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = pubDropdown.classList.contains('open');
    if (isOpen) {
      closePubDropdown();
    } else {
      loadPubList();
      pubDropdown.classList.add('open');
      pubToggle.classList.add('open');
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (pubDropdown && !pubDropdown.contains(e.target) && !pubToggle.contains(e.target)) {
      closePubDropdown();
    }
  });

  // New pub button
  if (btnNewPub) btnNewPub.addEventListener('click', async () => {
    await autoSave();
    await createNewPub();
    closePubDropdown();
  });

  // ============ HISTORY (Undo/Redo) ============
  let history = [JSON.parse(JSON.stringify(state))];
  let historyIndex = 0;
  const MAX_HISTORY = 50;
  let historyPaused = false;

  function pushHistory() {
    if (historyPaused) return;
    history = history.slice(0, historyIndex + 1);
    history.push(JSON.parse(JSON.stringify(state)));
    if (history.length > MAX_HISTORY) history.shift();
    historyIndex = history.length - 1;
    updateUndoRedoButtons();
    scheduleAutoSave();
  }

  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      state = JSON.parse(JSON.stringify(history[historyIndex]));
      historyPaused = true;
      restoreFromState();
      historyPaused = false;
      updateUndoRedoButtons();
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      state = JSON.parse(JSON.stringify(history[historyIndex]));
      historyPaused = true;
      restoreFromState();
      historyPaused = false;
      updateUndoRedoButtons();
    }
  }

  function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) btnUndo.disabled = historyIndex <= 0;
    if (btnRedo) btnRedo.disabled = historyIndex >= history.length - 1;
  }

  // ============ RAIL + PANEL TABS ============
  const panelDrawer = document.getElementById('sidebar');
  const panelTitle = document.getElementById('panel-title');
  const panelClose = document.getElementById('panel-close');
  const tabTitles = { design: 'Design', text: 'Texte', style: 'Style', stickers: 'Stickers', media: 'Medias', animations: 'Animations SVG' };
  let activeTab = 'design';

  document.querySelectorAll('.rail__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      if (tabName === activeTab && panelDrawer.classList.contains('open')) {
        panelDrawer.classList.remove('open');
        btn.classList.remove('active');
        activeTab = null;
      } else {
        document.querySelectorAll('.rail__btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const content = document.querySelector('[data-tab-content="' + tabName + '"]');
        if (content) content.classList.add('active');
        panelDrawer.classList.add('open');
        if (panelTitle) panelTitle.textContent = tabTitles[tabName] || tabName;
        activeTab = tabName;
      }
    });
  });

  if (panelClose) {
    panelClose.addEventListener('click', () => {
      panelDrawer.classList.remove('open');
      document.querySelectorAll('.rail__btn').forEach(t => t.classList.remove('active'));
      activeTab = null;
    });
  }

  // Keyboard shortcut: Escape to close panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close shortcuts modal first if open
      var scOverlay = document.getElementById('shortcuts-overlay');
      if (scOverlay && scOverlay.classList.contains('visible')) {
        scOverlay.classList.remove('visible');
        return;
      }
      if (panelDrawer && panelDrawer.classList.contains('open')) {
        panelDrawer.classList.remove('open');
        document.querySelectorAll('.rail__btn').forEach(t => t.classList.remove('active'));
        activeTab = null;
      }
    }
  });

  // ============ FORMAT ============
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.format = { w: parseInt(btn.dataset.w), h: parseInt(btn.dataset.h), label: btn.dataset.label };
      pushHistory();
      updateCanvas();
      if (typeof updateExportSizeInfo === 'function') updateExportSizeInfo();
    });
  });

  // ============ STYLE PACKS ============
  const stylePacks = {
    traverse:  { name: 'La Traverse',  bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a', accent2: '#e8a87c', headlineFont: "'Playfair Display', serif", bodyFont: "'Libre Baskerville', serif" },
    tech:      { name: 'Tech Purple',  bg: '#0e0b1a', text: '#e8e0f8', accent: '#8b5cf6', accent2: '#a78bfa', headlineFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif" },
    ocean:     { name: 'Ocean Blue',   bg: '#0a1628', text: '#e0f0ff', accent: '#38bdf8', accent2: '#7dd3fc', headlineFont: "'Poppins', sans-serif", bodyFont: "'Inter', sans-serif" },
    neonpop:   { name: 'Neon Pop',     bg: '#000000', text: '#ffffff', accent: '#22d3ee', accent2: '#f43f5e', headlineFont: "'Bebas Neue', sans-serif", bodyFont: "'Inter', sans-serif" },
    light:     { name: 'Minimal Light',bg: '#fafaf8', text: '#1a1a1a', accent: '#6b7280', accent2: '#9ca3af', headlineFont: "'Raleway', sans-serif", bodyFont: "'Inter', sans-serif" },
    sunset:    { name: 'Sunset',       bg: '#1a0a14', text: '#fde8ef', accent: '#f97316', accent2: '#ec4899', headlineFont: "'Montserrat', sans-serif", bodyFont: "'Poppins', sans-serif" },
    corporate: { name: 'Corporate',    bg: '#0f172a', text: '#e2e8f0', accent: '#3b82f6', accent2: '#60a5fa', headlineFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif" },
    creative:  { name: 'Creative',     bg: '#1a0a20', text: '#f5e6ff', accent: '#e879f9', accent2: '#f472b6', headlineFont: "'Poppins', sans-serif", bodyFont: "'Raleway', sans-serif" },
  };

  function applyStylePack(packKey) {
    const pack = stylePacks[packKey];
    if (!pack) return;
    state.stylePack = packKey;
    state.bgColor = pack.bg;
    state.textColor = pack.text;
    state.accentColor = pack.accent;
    state.accentColor2 = pack.accent2;
    state.typoHeadline.font = pack.headlineFont;
    state.typoBody.font = pack.bodyFont;

    // Update UI controls
    document.getElementById('color-bg').value = pack.bg;
    document.getElementById('color-text').value = pack.text;
    document.getElementById('color-accent').value = pack.accent;
    const accent2Input = document.getElementById('color-accent2');
    if (accent2Input) accent2Input.value = pack.accent2;
    clearPresetActive('bg');
    clearPresetActive('text');
    clearPresetActive('accent');
    if (typoHeadlineFont) typoHeadlineFont.value = pack.headlineFont;
    if (typoBodyFont) typoBodyFont.value = pack.bodyFont;

    // Update style pack buttons
    document.querySelectorAll('.style-pack-btn').forEach(b => b.classList.toggle('active', b.dataset.pack === packKey));

    pushHistory();
    updateCanvas();
  }

  // Style pack click handlers (setup after DOM ready)
  let stylePackHoverTimeout = null;
  let preHoverState = null;

  document.querySelectorAll('.style-pack-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      preHoverState = null; // Clear hover state on commit
      applyStylePack(btn.dataset.pack);
    });

    // Hover-to-preview: temporarily apply the pack on hover
    btn.addEventListener('mouseenter', () => {
      clearTimeout(stylePackHoverTimeout);
      stylePackHoverTimeout = setTimeout(() => {
        if (!preHoverState) {
          preHoverState = {
            bg: state.bgColor,
            text: state.textColor,
            accent: state.accentColor,
            accent2: state.accentColor2,
            hFont: state.typoHeadline.font,
            bFont: state.typoBody.font
          };
        }
        const pack = stylePacks[btn.dataset.pack];
        if (!pack) return;
        canvas.style.background = pack.bg;
        canvas.style.color = pack.text;
        canvas.style.setProperty('--accent-color', pack.accent);
        canvasHeadline.style.fontFamily = pack.headlineFont;
        canvasBody.style.fontFamily = pack.bodyFont;
      }, 120);
    });

    btn.addEventListener('mouseleave', () => {
      clearTimeout(stylePackHoverTimeout);
      if (preHoverState) {
        canvas.style.background = preHoverState.bg;
        canvas.style.color = preHoverState.text;
        canvas.style.setProperty('--accent-color', preHoverState.accent);
        canvasHeadline.style.fontFamily = preHoverState.hFont;
        canvasBody.style.fontFamily = preHoverState.bFont;
        preHoverState = null;
      }
    });
  });

  // ============ TEMPLATE DEFAULTS ============
  const templateDefaults = {
    minimal:    { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a', accent2: '#e8a87c' },
    bold:       { bg: '#0a0a0a', text: '#f0e8dc', accent: '#c4622a', accent2: '#e8a87c' },
    gradient:   { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a', accent2: '#e8a87c' },
    split:      { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a', accent2: '#e8a87c' },
    editorial:  { bg: '#faf6f1', text: '#1a1714', accent: '#c4622a', accent2: '#e8a87c' },
    glass:      { bg: '#0c1220', text: '#f0e8dc', accent: '#4a6fa5', accent2: '#7dd3fc' },
    neon:       { bg: '#0a0a0a', text: '#f0e8dc', accent: '#c4622a', accent2: '#e8a87c' },
    promo:      { bg: '#0a0a0a', text: '#f0e8dc', accent: '#c4622a', accent2: '#e8a87c' },
    quote:      { bg: '#f5f0e8', text: '#1a1a1a', accent: '#c4622a', accent2: '#e8a87c' },
    duotone:    { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a', accent2: '#e8a87c' },
    geometric:  { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a', accent2: '#e8a87c' },
    typewriter: { bg: '#f5f0e8', text: '#1a1714', accent: '#c4622a', accent2: '#e8a87c' },
    blobs:      { bg: '#0a0a14', text: '#f0e8dc', accent: '#8b5cf6', accent2: '#ec4899' },
    cards:      { bg: '#0c1220', text: '#f0e8dc', accent: '#38bdf8', accent2: '#818cf8' },
    'grid-pattern': { bg: '#111111', text: '#e8e8e8', accent: '#c4622a', accent2: '#e8a87c' },
    magazine:   { bg: '#0a0a0a', text: '#ffffff', accent: '#c4622a', accent2: '#e8a87c' },
    poster:     { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a', accent2: '#e8a87c' },
    layered:    { bg: '#0e0b1a', text: '#f0e8dc', accent: '#8b5cf6', accent2: '#a78bfa' },
  };

  // ============ TEMPLATES ============
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.template = btn.dataset.template;

      // Apply template default colors ONLY if no style pack is active
      if (!state.stylePack) {
        const defaults = templateDefaults[state.template];
        if (defaults) {
          state.bgColor = defaults.bg;
          state.textColor = defaults.text;
          state.accentColor = defaults.accent;
          state.accentColor2 = defaults.accent2 || '#e8a87c';
          document.getElementById('color-bg').value = defaults.bg;
          document.getElementById('color-text').value = defaults.text;
          document.getElementById('color-accent').value = defaults.accent;
          const accent2Input = document.getElementById('color-accent2');
          if (accent2Input) accent2Input.value = defaults.accent2 || '#e8a87c';
          clearPresetActive('bg');
          clearPresetActive('text');
          clearPresetActive('accent');
        }
      }

      // Reset glass panel visibility
      const glassPanel = document.getElementById('canvas-glass-panel');
      if (glassPanel) glassPanel.style.opacity = state.template === 'glass' ? '1' : '0';

      pushHistory();
      updateCanvas();
    });
  });

  // ============ TEMPLATE PREVIEW TOOLTIP ============
  (function() {
    var preview = document.getElementById('tmpl-preview');
    var previewThumb = document.getElementById('tmpl-preview-thumb');
    var previewLabel = document.getElementById('tmpl-preview-label');
    if (!preview || !previewThumb) return;

    var hideTimeout = null;

    document.querySelectorAll('.template-btn').forEach(function(btn) {
      btn.addEventListener('mouseenter', function(e) {
        clearTimeout(hideTimeout);
        var tmplName = btn.dataset.template;
        // Clone the thumbnail into the preview at bigger size
        var tmplEl = btn.querySelector('.tmpl');
        if (!tmplEl) return;
        var clone = tmplEl.cloneNode(true);
        clone.style.width = '160px';
        clone.style.height = '160px';
        previewThumb.innerHTML = '';
        previewThumb.appendChild(clone);
        if (previewLabel) previewLabel.textContent = tmplName;

        // Position to the right of the button
        var rect = btn.getBoundingClientRect();
        var left = rect.right + 12;
        var top = rect.top + rect.height / 2 - 90;
        // Keep within viewport
        if (left + 180 > window.innerWidth) left = rect.left - 180;
        if (top < 8) top = 8;
        if (top + 190 > window.innerHeight) top = window.innerHeight - 200;
        preview.style.left = left + 'px';
        preview.style.top = top + 'px';
        preview.classList.add('visible');
      });

      btn.addEventListener('mouseleave', function() {
        hideTimeout = setTimeout(function() {
          preview.classList.remove('visible');
        }, 100);
      });
    });
  })();

  // ============ TEXT INPUTS ============
  function setupTextInput(inputId, stateKey, canvasEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', () => {
      state[stateKey] = input.value;
      canvasEl.textContent = state[stateKey];
    });
    // Debounced history push
    let timeout;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => pushHistory(), 500);
    });
  }

  setupTextInput('input-headline', 'headline', canvasHeadline);
  setupTextInput('input-subline', 'subline', canvasSubline);
  setupTextInput('input-body', 'body', canvasBody);
  setupTextInput('input-cta', 'cta', canvasCta);

  // Sync contenteditable back to inputs
  function setupContentEditable(canvasEl, inputId, stateKey) {
    canvasEl.addEventListener('input', () => {
      state[stateKey] = canvasEl.textContent;
      const input = document.getElementById(inputId);
      if (input) {
        if (input.tagName === 'TEXTAREA') input.value = canvasEl.textContent;
        else input.value = canvasEl.textContent;
      }
    });
    let timeout;
    canvasEl.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => pushHistory(), 500);
    });
  }

  setupContentEditable(canvasHeadline, 'input-headline', 'headline');
  setupContentEditable(canvasSubline, 'input-subline', 'subline');
  setupContentEditable(canvasBody, 'input-body', 'body');
  setupContentEditable(canvasCta, 'input-cta', 'cta');

  // Toggle overflow visible on canvas when editing text so overflowing text is accessible
  [canvasHeadline, canvasSubline, canvasBody, canvasCta].forEach(function(el) {
    el.addEventListener('focus', function() { canvasWrapper.classList.add('editing-text'); });
    el.addEventListener('blur', function() { canvasWrapper.classList.remove('editing-text'); });
  });

  // ============ CTA STYLE ============
  document.querySelectorAll('.cta-style-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.cta-style-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.ctaStyle = btn.dataset.style;
      pushHistory();
      updateCanvas();
    });
  });

  function applyCtaStyle() {
    if (!canvasCta) return;
    canvasCta.setAttribute('data-cta-style', state.ctaStyle || 'text');
    var bgCol = state.ctaBgColor || state.accentColor;
    var txtCol = state.ctaTextColor || '#fff';
    if (state.ctaStyle === 'filled') {
      canvasCta.style.background = bgCol;
      canvasCta.style.color = txtCol;
      canvasCta.style.borderColor = '';
    } else if (state.ctaStyle === 'outline') {
      canvasCta.style.background = 'transparent';
      canvasCta.style.color = state.ctaBgColor || state.accentColor;
      canvasCta.style.borderColor = state.ctaBgColor || state.accentColor;
    } else if (state.ctaStyle === 'pill') {
      canvasCta.style.background = bgCol;
      canvasCta.style.color = txtCol;
      canvasCta.style.borderColor = '';
    } else {
      canvasCta.style.background = '';
      canvasCta.style.color = state.ctaTextColor || '';
      canvasCta.style.borderColor = '';
    }
  }

  // ============ ELEMENT VISIBILITY TOGGLES ============
  var toggleSubline = document.getElementById('toggle-subline');
  var toggleBody = document.getElementById('toggle-body');
  var toggleCta = document.getElementById('toggle-cta');

  if (toggleSubline) toggleSubline.addEventListener('change', function() {
    state.showSubline = toggleSubline.checked;
    canvasSubline.style.display = state.showSubline ? '' : 'none';
    var slineField = document.getElementById('subline-style-field');
    if (slineField) slineField.style.display = state.showSubline ? '' : 'none';
    pushHistory();
  });
  if (toggleBody) toggleBody.addEventListener('change', function() {
    state.showBody = toggleBody.checked;
    canvasBody.style.display = state.showBody ? '' : 'none';
    pushHistory();
  });
  if (toggleCta) toggleCta.addEventListener('change', function() {
    state.showCta = toggleCta.checked;
    canvasCta.style.display = state.showCta ? '' : 'none';
    pushHistory();
  });

  // ============ SUBLINE STYLE ============
  document.querySelectorAll('.sline-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.sline-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.sublineStyle = btn.dataset.sline;
      applySublineStyle();
      pushHistory();
    });
  });

  function applySublineStyle() {
    if (!canvasSubline) return;
    var s = state.sublineStyle || 'text';
    var accent = state.accentColor || '#c4622a';
    canvasSubline.setAttribute('data-subline-style', s);
    // Reset inline styles (except promo template overrides)
    if (state.template !== 'promo') {
      canvasSubline.style.background = '';
      canvasSubline.style.color = '';
    }
    canvasSubline.style.borderBottom = '';
    canvasSubline.style.paddingBottom = '';
    canvasSubline.style.borderRadius = '';
    canvasSubline.style.padding = '';
    switch (s) {
      case 'badge':
        canvasSubline.style.background = accent;
        canvasSubline.style.color = '#fff';
        canvasSubline.style.padding = '2px 10px';
        canvasSubline.style.borderRadius = '4px';
        break;
      case 'pill':
        canvasSubline.style.background = accent;
        canvasSubline.style.color = '#fff';
        canvasSubline.style.padding = '2px 14px';
        canvasSubline.style.borderRadius = '999px';
        break;
      case 'separator':
        canvasSubline.style.borderBottom = '2px solid ' + accent;
        canvasSubline.style.paddingBottom = '4px';
        break;
    }
    // Apply custom subline color if set (override for text/separator modes)
    if (state.sublineColor && s !== 'badge' && s !== 'pill') {
      canvasSubline.style.color = state.sublineColor;
    }
  }

  // ============ TYPO PRESETS ============
  var typoPresetDefs = {
    'elegant': { font: "'Playfair Display', serif", size: 48, weight: '700', case: 'none', lh: 110, ls: 0 },
    'bold-sans': { font: "'Montserrat', sans-serif", size: 56, weight: '900', case: 'uppercase', lh: 100, ls: 2 },
    'modern': { font: "'Inter', sans-serif", size: 42, weight: '600', case: 'none', lh: 115, ls: -1 },
    'display': { font: "'Bebas Neue', sans-serif", size: 64, weight: '400', case: 'uppercase', lh: 95, ls: 3 },
    'editorial': { font: "'DM Serif Display', serif", size: 50, weight: '400', case: 'none', lh: 108, ls: 0 },
    'minimal': { font: "'Raleway', sans-serif", size: 36, weight: '300', case: 'uppercase', lh: 120, ls: 4 },
    'mono': { font: "'Space Mono', monospace", size: 34, weight: '400', case: 'none', lh: 125, ls: 0 },
    'poster': { font: "'Oswald', sans-serif", size: 60, weight: '700', case: 'uppercase', lh: 95, ls: 1 }
  };

  document.querySelectorAll('.typo-preset').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var preset = typoPresetDefs[btn.dataset.preset];
      if (!preset) return;
      document.querySelectorAll('.typo-preset').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.typoHeadline.font = preset.font;
      state.typoHeadline.size = preset.size;
      state.typoHeadline.weight = preset.weight;
      state.typoHeadline.case = preset.case;
      state.typoHeadline.lh = preset.lh;
      state.typoHeadline.ls = preset.ls;
      // Update UI controls
      if (typoHeadlineFont) typoHeadlineFont.value = preset.font;
      if (typoHeadlineSize) { typoHeadlineSize.value = preset.size; if (typoHeadlineSizeVal) typoHeadlineSizeVal.textContent = preset.size; }
      if (typoHeadlineWeight) typoHeadlineWeight.value = preset.weight;
      if (typoHeadlineLh) { typoHeadlineLh.value = preset.lh; if (typoHeadlineLhVal) typoHeadlineLhVal.textContent = (preset.lh / 100).toFixed(1); }
      if (typoHeadlineLs) { typoHeadlineLs.value = preset.ls; if (typoHeadlineLsVal) typoHeadlineLsVal.textContent = preset.ls; }
      document.querySelectorAll('.case-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.case === preset.case); });
      pushHistory();
      updateCanvas();
    });
  });

  // ============ TYPOGRAPHY — HEADLINE ============
  const typoHeadlineFont = document.getElementById('typo-headline-font');
  const typoHeadlineSize = document.getElementById('typo-headline-size');
  const typoHeadlineSizeVal = document.getElementById('typo-headline-size-val');
  const typoHeadlineWeight = document.getElementById('typo-headline-weight');
  const typoHeadlineLh = document.getElementById('typo-headline-lh');
  const typoHeadlineLhVal = document.getElementById('typo-headline-lh-val');
  const typoHeadlineLs = document.getElementById('typo-headline-ls');
  const typoHeadlineLsVal = document.getElementById('typo-headline-ls-val');

  if (typoHeadlineFont) typoHeadlineFont.addEventListener('change', () => {
    state.typoHeadline.font = typoHeadlineFont.value;
    pushHistory();
    applyTypography();
  });

  if (typoHeadlineSize) typoHeadlineSize.addEventListener('input', () => {
    state.typoHeadline.size = parseInt(typoHeadlineSize.value);
    if (typoHeadlineSizeVal) typoHeadlineSizeVal.textContent = typoHeadlineSize.value;
    applyTypography();
  });
  if (typoHeadlineSize) typoHeadlineSize.addEventListener('change', () => pushHistory());

  if (typoHeadlineWeight) typoHeadlineWeight.addEventListener('change', () => {
    state.typoHeadline.weight = typoHeadlineWeight.value;
    pushHistory();
    applyTypography();
  });

  if (typoHeadlineLh) typoHeadlineLh.addEventListener('input', () => {
    state.typoHeadline.lh = parseInt(typoHeadlineLh.value);
    if (typoHeadlineLhVal) typoHeadlineLhVal.textContent = (parseInt(typoHeadlineLh.value) / 100).toFixed(1);
    applyTypography();
  });
  if (typoHeadlineLh) typoHeadlineLh.addEventListener('change', () => pushHistory());

  if (typoHeadlineLs) typoHeadlineLs.addEventListener('input', () => {
    state.typoHeadline.ls = parseInt(typoHeadlineLs.value);
    if (typoHeadlineLsVal) typoHeadlineLsVal.textContent = typoHeadlineLs.value;
    applyTypography();
  });
  if (typoHeadlineLs) typoHeadlineLs.addEventListener('change', () => pushHistory());

  // Alignment buttons
  document.querySelectorAll('.align-btn[data-target="headline"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.align-btn[data-target="headline"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.typoHeadline.align = btn.dataset.align;
      pushHistory();
      applyTypography();
    });
  });

  // Case buttons
  document.querySelectorAll('.case-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.case-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.typoHeadline.case = btn.dataset.case;
      pushHistory();
      applyTypography();
    });
  });

  // ============ TYPOGRAPHY — BODY ============
  const typoBodyFont = document.getElementById('typo-body-font');
  const typoBodySize = document.getElementById('typo-body-size');
  const typoBodySizeVal = document.getElementById('typo-body-size-val');
  const typoBodyWeight = document.getElementById('typo-body-weight');

  if (typoBodyFont) typoBodyFont.addEventListener('change', () => {
    state.typoBody.font = typoBodyFont.value;
    pushHistory();
    applyTypography();
  });

  if (typoBodySize) typoBodySize.addEventListener('input', () => {
    state.typoBody.size = parseInt(typoBodySize.value);
    if (typoBodySizeVal) typoBodySizeVal.textContent = typoBodySize.value;
    applyTypography();
  });
  if (typoBodySize) typoBodySize.addEventListener('change', () => pushHistory());

  if (typoBodyWeight) typoBodyWeight.addEventListener('change', () => {
    state.typoBody.weight = typoBodyWeight.value;
    pushHistory();
    applyTypography();
  });

  // ============ SUBLINE TYPOGRAPHY ============
  var typoSublineSize = document.getElementById('typo-subline-size');
  var typoSublineSizeVal = document.getElementById('typo-subline-size-val');
  var typoSublineWeight = document.getElementById('typo-subline-weight');
  var typoSublineLs = document.getElementById('typo-subline-ls');
  var typoSublineLsVal = document.getElementById('typo-subline-ls-val');

  if (typoSublineSize) typoSublineSize.addEventListener('input', function() {
    state.typoSubline.size = parseInt(typoSublineSize.value);
    if (typoSublineSizeVal) typoSublineSizeVal.textContent = typoSublineSize.value;
    applyTypography();
  });
  if (typoSublineSize) typoSublineSize.addEventListener('change', function() { pushHistory(); });

  if (typoSublineWeight) typoSublineWeight.addEventListener('change', function() {
    state.typoSubline.weight = typoSublineWeight.value;
    pushHistory();
    applyTypography();
  });

  if (typoSublineLs) typoSublineLs.addEventListener('input', function() {
    state.typoSubline.ls = parseInt(typoSublineLs.value);
    if (typoSublineLsVal) typoSublineLsVal.textContent = typoSublineLs.value;
    applyTypography();
  });
  if (typoSublineLs) typoSublineLs.addEventListener('change', function() { pushHistory(); });

  // Subline case buttons
  document.querySelectorAll('.subline-case-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.subline-case-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.typoSubline.case = btn.dataset.case;
      pushHistory();
      applyTypography();
    });
  });

  // ============ CTA TYPOGRAPHY ============
  var typoCtaSize = document.getElementById('typo-cta-size');
  var typoCtaSizeVal = document.getElementById('typo-cta-size-val');
  var typoCtaWeight = document.getElementById('typo-cta-weight');

  if (typoCtaSize) typoCtaSize.addEventListener('input', function() {
    state.typoCta.size = parseInt(typoCtaSize.value);
    if (typoCtaSizeVal) typoCtaSizeVal.textContent = typoCtaSize.value;
    applyTypography();
  });
  if (typoCtaSize) typoCtaSize.addEventListener('change', function() { pushHistory(); });

  if (typoCtaWeight) typoCtaWeight.addEventListener('change', function() {
    state.typoCta.weight = typoCtaWeight.value;
    pushHistory();
    applyTypography();
  });

  // ============ BODY ALIGNMENT & LINE HEIGHT ============
  document.querySelectorAll('.align-btn[data-target="body"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.align-btn[data-target="body"]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.typoBody.align = btn.dataset.align;
      pushHistory();
      applyTypography();
    });
  });

  var typoBodyLh = document.getElementById('typo-body-lh');
  var typoBodyLhVal = document.getElementById('typo-body-lh-val');
  if (typoBodyLh) typoBodyLh.addEventListener('input', function() {
    state.typoBody.lh = parseInt(typoBodyLh.value);
    if (typoBodyLhVal) typoBodyLhVal.textContent = (state.typoBody.lh / 100).toFixed(1);
    applyTypography();
  });
  if (typoBodyLh) typoBodyLh.addEventListener('change', function() { pushHistory(); });

  // ============ CUSTOM ELEMENT COLORS ============
  var sublineColorInput = document.getElementById('subline-color');
  var sublineColorReset = document.getElementById('subline-color-reset');
  if (sublineColorInput) sublineColorInput.addEventListener('input', function() {
    state.sublineColor = sublineColorInput.value;
    applySublineStyle();
  });
  if (sublineColorInput) sublineColorInput.addEventListener('change', function() { pushHistory(); });
  if (sublineColorReset) sublineColorReset.addEventListener('click', function() {
    state.sublineColor = '';
    if (sublineColorInput) sublineColorInput.value = state.textColor || '#ffffff';
    applySublineStyle();
    pushHistory();
  });

  var ctaBgColorInput = document.getElementById('cta-bg-color');
  var ctaBgColorReset = document.getElementById('cta-bg-color-reset');
  var ctaTextColorInput = document.getElementById('cta-text-color');
  var ctaTextColorReset = document.getElementById('cta-text-color-reset');
  if (ctaBgColorInput) ctaBgColorInput.addEventListener('input', function() {
    state.ctaBgColor = ctaBgColorInput.value;
    applyCtaStyle();
  });
  if (ctaBgColorInput) ctaBgColorInput.addEventListener('change', function() { pushHistory(); });
  if (ctaBgColorReset) ctaBgColorReset.addEventListener('click', function() {
    state.ctaBgColor = '';
    if (ctaBgColorInput) ctaBgColorInput.value = state.accentColor || '#c4622a';
    applyCtaStyle();
    pushHistory();
  });
  if (ctaTextColorInput) ctaTextColorInput.addEventListener('input', function() {
    state.ctaTextColor = ctaTextColorInput.value;
    applyCtaStyle();
  });
  if (ctaTextColorInput) ctaTextColorInput.addEventListener('change', function() { pushHistory(); });
  if (ctaTextColorReset) ctaTextColorReset.addEventListener('click', function() {
    state.ctaTextColor = '';
    if (ctaTextColorInput) ctaTextColorInput.value = '#ffffff';
    applyCtaStyle();
    pushHistory();
  });

  var headlineColorInput = document.getElementById('headline-color');
  var headlineColorReset = document.getElementById('headline-color-reset');
  if (headlineColorInput) headlineColorInput.addEventListener('input', function() {
    state.headlineColor = headlineColorInput.value;
    applyTypography();
  });
  if (headlineColorInput) headlineColorInput.addEventListener('change', function() { pushHistory(); });
  if (headlineColorReset) headlineColorReset.addEventListener('click', function() {
    state.headlineColor = '';
    if (headlineColorInput) headlineColorInput.value = state.textColor || '#ffffff';
    applyTypography();
    pushHistory();
  });

  var bodyColorInput = document.getElementById('body-color');
  var bodyColorReset = document.getElementById('body-color-reset');
  if (bodyColorInput) bodyColorInput.addEventListener('input', function() {
    state.bodyColor = bodyColorInput.value;
    applyTypography();
  });
  if (bodyColorInput) bodyColorInput.addEventListener('change', function() { pushHistory(); });
  if (bodyColorReset) bodyColorReset.addEventListener('click', function() {
    state.bodyColor = '';
    if (bodyColorInput) bodyColorInput.value = state.textColor || '#ffffff';
    applyTypography();
    pushHistory();
  });

  var typoCtaLs = document.getElementById('typo-cta-ls');
  var typoCtaLsVal = document.getElementById('typo-cta-ls-val');
  if (typoCtaLs) typoCtaLs.addEventListener('input', function() {
    state.typoCta.ls = parseInt(typoCtaLs.value);
    if (typoCtaLsVal) typoCtaLsVal.textContent = typoCtaLs.value;
    applyTypography();
  });
  if (typoCtaLs) typoCtaLs.addEventListener('change', function() { pushHistory(); });

  // ============ COLORS ============
  function setupColorPresets() {
    document.querySelectorAll('.color-presets').forEach(group => {
      const target = group.dataset.target;
      group.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          group.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          const color = dot.dataset.color;
          if (target === 'bg') {
            state.bgColor = color;
            document.getElementById('color-bg').value = color;
          } else if (target === 'text') {
            state.textColor = color;
            document.getElementById('color-text').value = color;
          } else if (target === 'accent') {
            state.accentColor = color;
            document.getElementById('color-accent').value = color;
          } else if (target === 'accent2') {
            state.accentColor2 = color;
            document.getElementById('color-accent2').value = color;
          }
          // Clear active style pack on manual color change
          state.stylePack = null;
          document.querySelectorAll('.style-pack-btn').forEach(b => b.classList.remove('active'));
          pushHistory();
          applyColors();
        });
      });
    });
  }
  setupColorPresets();

  document.getElementById('color-bg').addEventListener('input', e => {
    state.bgColor = e.target.value;
    state.stylePack = null;
    document.querySelectorAll('.style-pack-btn').forEach(b => b.classList.remove('active'));
    clearPresetActive('bg');
    applyColors();
  });
  document.getElementById('color-bg').addEventListener('change', () => pushHistory());

  document.getElementById('color-text').addEventListener('input', e => {
    state.textColor = e.target.value;
    state.stylePack = null;
    document.querySelectorAll('.style-pack-btn').forEach(b => b.classList.remove('active'));
    clearPresetActive('text');
    applyColors();
  });
  document.getElementById('color-text').addEventListener('change', () => pushHistory());

  document.getElementById('color-accent').addEventListener('input', e => {
    state.accentColor = e.target.value;
    state.stylePack = null;
    document.querySelectorAll('.style-pack-btn').forEach(b => b.classList.remove('active'));
    clearPresetActive('accent');
    applyColors();
  });
  document.getElementById('color-accent').addEventListener('change', () => pushHistory());

  // Accent 2 color
  const colorAccent2 = document.getElementById('color-accent2');
  if (colorAccent2) {
    colorAccent2.addEventListener('input', e => {
      state.accentColor2 = e.target.value;
      state.stylePack = null;
      document.querySelectorAll('.style-pack-btn').forEach(b => b.classList.remove('active'));
      applyColors();
    });
    colorAccent2.addEventListener('change', () => pushHistory());
  }

  function clearPresetActive(target) {
    document.querySelectorAll('.color-presets[data-target="' + target + '"] .color-dot').forEach(d => d.classList.remove('active'));
  }

  // ============ COLOR HISTORY ============
  var colorHistoryDots = document.getElementById('color-history-dots');
  var colorHistoryArr = JSON.parse(localStorage.getItem('branding_color_history') || '[]');
  var COLOR_HISTORY_MAX = 10;

  function addToColorHistory(color) {
    if (!color || color.length < 4) return;
    color = color.toLowerCase();
    // Remove if already exists
    colorHistoryArr = colorHistoryArr.filter(function(c) { return c !== color; });
    // Add to front
    colorHistoryArr.unshift(color);
    // Limit
    if (colorHistoryArr.length > COLOR_HISTORY_MAX) colorHistoryArr = colorHistoryArr.slice(0, COLOR_HISTORY_MAX);
    localStorage.setItem('branding_color_history', JSON.stringify(colorHistoryArr));
    renderColorHistory();
  }

  function renderColorHistory() {
    if (!colorHistoryDots) return;
    if (colorHistoryArr.length === 0) {
      colorHistoryDots.parentElement.style.display = 'none';
      return;
    }
    colorHistoryDots.parentElement.style.display = '';
    colorHistoryDots.innerHTML = colorHistoryArr.map(function(c) {
      return '<button class="color-history__dot" style="background:' + c + '" data-color="' + c + '" title="' + c + '"></button>';
    }).join('');
    colorHistoryDots.querySelectorAll('.color-history__dot').forEach(function(dot) {
      dot.addEventListener('click', function() {
        var c = dot.dataset.color;
        // Apply to whichever color input is "most likely" — use accent by default
        state.accentColor = c;
        document.getElementById('color-accent').value = c;
        clearPresetActive('accent');
        state.stylePack = null;
        document.querySelectorAll('.style-pack-btn').forEach(function(b) { b.classList.remove('active'); });
        pushHistory();
        applyColors();
      });
    });
  }
  renderColorHistory();

  // Hook into color changes to record history
  var _origPushHistory = pushHistory;
  var _colorHistoryTimer = null;
  function scheduleColorHistoryUpdate() {
    clearTimeout(_colorHistoryTimer);
    _colorHistoryTimer = setTimeout(function() {
      addToColorHistory(state.bgColor);
      addToColorHistory(state.accentColor);
      addToColorHistory(state.textColor);
      addToColorHistory(state.accentColor2);
    }, 1000);
  }

  // Override color input change handlers to track history
  ['color-bg', 'color-text', 'color-accent', 'color-accent2'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', scheduleColorHistoryUpdate);
  });

  // ============ RANDOM PALETTE ============
  var btnRandomPalette = document.getElementById('btn-random-palette');
  if (btnRandomPalette) btnRandomPalette.addEventListener('click', function() {
    // Generate harmonious palette using HSL
    var baseHue = Math.floor(Math.random() * 360);
    var isDark = Math.random() > 0.25; // 75% dark themes

    var bg, text, accent, accent2;
    if (isDark) {
      var bgL = 5 + Math.floor(Math.random() * 10);
      var bgS = 10 + Math.floor(Math.random() * 30);
      bg = hslToHex(baseHue + Math.floor(Math.random() * 40) - 20, bgS, bgL);
      text = hslToHex(baseHue + Math.floor(Math.random() * 30), 10 + Math.floor(Math.random() * 20), 88 + Math.floor(Math.random() * 10));
      accent = hslToHex((baseHue + 150 + Math.floor(Math.random() * 60)) % 360, 60 + Math.floor(Math.random() * 30), 50 + Math.floor(Math.random() * 15));
      accent2 = hslToHex((baseHue + 180 + Math.floor(Math.random() * 80)) % 360, 50 + Math.floor(Math.random() * 30), 55 + Math.floor(Math.random() * 20));
    } else {
      bg = hslToHex(baseHue + Math.floor(Math.random() * 20), 5 + Math.floor(Math.random() * 15), 95 + Math.floor(Math.random() * 4));
      text = hslToHex(baseHue, 15 + Math.floor(Math.random() * 20), 10 + Math.floor(Math.random() * 10));
      accent = hslToHex((baseHue + 150 + Math.floor(Math.random() * 60)) % 360, 60 + Math.floor(Math.random() * 30), 40 + Math.floor(Math.random() * 15));
      accent2 = hslToHex((baseHue + 180 + Math.floor(Math.random() * 80)) % 360, 50 + Math.floor(Math.random() * 25), 45 + Math.floor(Math.random() * 20));
    }

    state.bgColor = bg;
    state.textColor = text;
    state.accentColor = accent;
    state.accentColor2 = accent2;
    state.stylePack = null;

    document.getElementById('color-bg').value = bg;
    document.getElementById('color-text').value = text;
    document.getElementById('color-accent').value = accent;
    var a2Input = document.getElementById('color-accent2');
    if (a2Input) a2Input.value = accent2;

    clearPresetActive('bg');
    clearPresetActive('text');
    clearPresetActive('accent');
    clearPresetActive('accent2');

    // Deselect style pack buttons
    document.querySelectorAll('.style-pack-btn').forEach(function(b) { b.classList.remove('active'); });

    pushHistory();
    updateCanvas();
    scheduleColorHistoryUpdate();
  });

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ============ COLOR SWAP ============
  var btnColorSwap = document.getElementById('btn-color-swap');
  if (btnColorSwap) btnColorSwap.addEventListener('click', function() {
    var tmpBg = state.bgColor;
    state.bgColor = state.textColor;
    state.textColor = tmpBg;
    document.getElementById('color-bg').value = state.bgColor;
    document.getElementById('color-text').value = state.textColor;
    clearPresetActive('bg');
    clearPresetActive('text');
    document.querySelectorAll('.style-pack-btn').forEach(function(b) { b.classList.remove('active'); });
    state.stylePack = null;
    pushHistory();
    updateCanvas();
    scheduleColorHistoryUpdate();
  });

  // ============ BACKGROUND PATTERN ============
  var canvasPattern = document.getElementById('canvas-pattern');
  var patternOpacity = document.getElementById('pattern-opacity');
  var patternOpacityVal = document.getElementById('pattern-opacity-val');
  var patternScale = document.getElementById('pattern-scale');
  var patternScaleVal = document.getElementById('pattern-scale-val');
  var patternOpacityField = document.getElementById('pattern-opacity-field');
  var patternScaleField = document.getElementById('pattern-scale-field');

  document.querySelectorAll('.pattern-opt').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.pattern-opt').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.bgPattern = btn.dataset.pattern;
      var show = state.bgPattern !== 'none';
      if (patternOpacityField) patternOpacityField.style.display = show ? '' : 'none';
      if (patternScaleField) patternScaleField.style.display = show ? '' : 'none';
      if (patternColorField) patternColorField.style.display = show ? '' : 'none';
      pushHistory();
      applyPattern();
    });
  });

  if (patternOpacity) patternOpacity.addEventListener('input', function() {
    state.bgPatternOpacity = parseInt(patternOpacity.value);
    if (patternOpacityVal) patternOpacityVal.textContent = patternOpacity.value;
    applyPattern();
  });
  if (patternOpacity) patternOpacity.addEventListener('change', function() { pushHistory(); });

  if (patternScale) patternScale.addEventListener('input', function() {
    state.bgPatternScale = parseInt(patternScale.value);
    if (patternScaleVal) patternScaleVal.textContent = patternScale.value;
    applyPattern();
  });
  if (patternScale) patternScale.addEventListener('change', function() { pushHistory(); });

  var patternColorField = document.getElementById('pattern-color-field');
  var patternColorInput = document.getElementById('pattern-color');
  if (patternColorInput) patternColorInput.addEventListener('input', function() {
    state.bgPatternColor = patternColorInput.value;
    applyPattern();
  });
  if (patternColorInput) patternColorInput.addEventListener('change', function() { pushHistory(); });

  function applyPattern() {
    if (!canvasPattern) return;
    if (state.bgPattern === 'none' || !state.bgPattern) {
      canvasPattern.style.backgroundImage = '';
      canvasPattern.style.opacity = '';
      return;
    }
    var opacity = (state.bgPatternOpacity || 15) / 100;
    var scale = state.bgPatternScale || 20;
    var textCol = state.bgPatternColor || state.textColor || '#ffffff';
    canvasPattern.style.opacity = opacity;

    switch (state.bgPattern) {
      case 'dots':
        canvasPattern.style.backgroundImage = 'radial-gradient(circle, ' + textCol + ' 1px, transparent 1px)';
        canvasPattern.style.backgroundSize = scale + 'px ' + scale + 'px';
        break;
      case 'lines':
        canvasPattern.style.backgroundImage = 'repeating-linear-gradient(0deg, ' + textCol + ' 0px, ' + textCol + ' 1px, transparent 1px, transparent ' + scale + 'px)';
        canvasPattern.style.backgroundSize = '';
        break;
      case 'cross':
        canvasPattern.style.backgroundImage =
          'linear-gradient(0deg, ' + textCol + ' 1px, transparent 1px),' +
          'linear-gradient(90deg, ' + textCol + ' 1px, transparent 1px)';
        canvasPattern.style.backgroundSize = scale + 'px ' + scale + 'px';
        break;
      case 'diagonal':
        canvasPattern.style.backgroundImage = 'repeating-linear-gradient(45deg, ' + textCol + ' 0px, ' + textCol + ' 1px, transparent 1px, transparent ' + scale + 'px)';
        canvasPattern.style.backgroundSize = '';
        break;
    }
  }

  // ============ GRADIENT ============
  const optGradient = document.getElementById('opt-gradient');
  const gradientControls = document.getElementById('gradient-controls');
  const gradientAngle = document.getElementById('gradient-angle');
  const gradientAngleVal = document.getElementById('gradient-angle-val');
  const gradientStart = document.getElementById('gradient-start');
  const gradientEnd = document.getElementById('gradient-end');

  if (optGradient) optGradient.addEventListener('change', () => {
    state.gradient.enabled = optGradient.checked;
    gradientControls.style.display = state.gradient.enabled ? '' : 'none';
    pushHistory();
    applyColors();
  });

  if (gradientAngle) gradientAngle.addEventListener('input', () => {
    state.gradient.angle = parseInt(gradientAngle.value);
    if (gradientAngleVal) gradientAngleVal.textContent = gradientAngle.value;
    applyColors();
  });
  if (gradientAngle) gradientAngle.addEventListener('change', () => pushHistory());

  if (gradientStart) gradientStart.addEventListener('input', () => {
    state.gradient.start = gradientStart.value;
    applyColors();
  });
  if (gradientStart) gradientStart.addEventListener('change', () => pushHistory());

  if (gradientEnd) gradientEnd.addEventListener('input', () => {
    state.gradient.end = gradientEnd.value;
    applyColors();
  });
  if (gradientEnd) gradientEnd.addEventListener('change', () => pushHistory());

  // Gradient presets
  document.querySelectorAll('.gradient-presets:not(.gradient-presets--text) .gradient-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      state.gradient.start = btn.dataset.start;
      state.gradient.end = btn.dataset.end;
      state.gradient.angle = parseInt(btn.dataset.angle);
      state.gradient.enabled = true;
      optGradient.checked = true;
      gradientControls.style.display = '';
      gradientStart.value = state.gradient.start;
      gradientEnd.value = state.gradient.end;
      gradientAngle.value = state.gradient.angle;
      if (gradientAngleVal) gradientAngleVal.textContent = state.gradient.angle;
      pushHistory();
      applyColors();
    });
  });

  // ============ TEXT EFFECTS ============
  const fxShadow = document.getElementById('fx-shadow');
  const fxShadowVal = document.getElementById('fx-shadow-val');
  const fxGlow = document.getElementById('fx-glow');
  const fxGlowVal = document.getElementById('fx-glow-val');
  const fxOutline = document.getElementById('fx-outline');

  if (fxShadow) fxShadow.addEventListener('input', () => {
    state.fxShadow = parseInt(fxShadow.value);
    if (fxShadowVal) fxShadowVal.textContent = fxShadow.value;
    var sfCtrl = document.getElementById('shadow-fine-controls');
    if (sfCtrl) sfCtrl.style.display = state.fxShadow > 0 ? '' : 'none';
    applyEffects();
  });
  if (fxShadow) fxShadow.addEventListener('change', () => pushHistory());

  // Shadow fine controls (X, Y, color)
  var shadowXSlider = document.getElementById('shadow-x');
  var shadowYSlider = document.getElementById('shadow-y');
  var shadowXVal = document.getElementById('shadow-x-val');
  var shadowYVal = document.getElementById('shadow-y-val');
  var shadowColorInput = document.getElementById('shadow-color');

  if (shadowXSlider) shadowXSlider.addEventListener('input', function() {
    state.textShadowX = parseInt(shadowXSlider.value);
    if (shadowXVal) shadowXVal.textContent = shadowXSlider.value;
    applyEffects();
  });
  if (shadowXSlider) shadowXSlider.addEventListener('change', function() { pushHistory(); });

  if (shadowYSlider) shadowYSlider.addEventListener('input', function() {
    state.textShadowY = parseInt(shadowYSlider.value);
    if (shadowYVal) shadowYVal.textContent = shadowYSlider.value;
    applyEffects();
  });
  if (shadowYSlider) shadowYSlider.addEventListener('change', function() { pushHistory(); });

  if (shadowColorInput) shadowColorInput.addEventListener('input', function() {
    state.textShadowColor = shadowColorInput.value;
    applyEffects();
  });
  if (shadowColorInput) shadowColorInput.addEventListener('change', function() { pushHistory(); });

  if (fxGlow) fxGlow.addEventListener('input', () => {
    state.fxGlow = parseInt(fxGlow.value);
    if (fxGlowVal) fxGlowVal.textContent = fxGlow.value;
    applyEffects();
  });
  if (fxGlow) fxGlow.addEventListener('change', () => pushHistory());

  if (fxOutline) fxOutline.addEventListener('change', () => {
    state.fxOutline = fxOutline.checked;
    pushHistory();
    applyEffects();
  });

  // ============ GRADIENT TEXT ============
  var fxGradientText = document.getElementById('fx-gradient-text');
  var gradientTextControls = document.getElementById('gradient-text-controls');
  var fxGradientStart = document.getElementById('fx-gradient-start');
  var fxGradientEnd = document.getElementById('fx-gradient-end');
  var fxGradientAngle = document.getElementById('fx-gradient-angle');
  var fxGradientAngleVal = document.getElementById('fx-gradient-angle-val');

  if (fxGradientText) fxGradientText.addEventListener('change', function() {
    state.fxGradientText = fxGradientText.checked;
    if (gradientTextControls) gradientTextControls.style.display = state.fxGradientText ? '' : 'none';
    pushHistory();
    applyEffects();
  });

  if (fxGradientStart) fxGradientStart.addEventListener('input', function() {
    state.fxGradientStart = fxGradientStart.value;
    applyEffects();
  });
  if (fxGradientStart) fxGradientStart.addEventListener('change', function() { pushHistory(); });

  if (fxGradientEnd) fxGradientEnd.addEventListener('input', function() {
    state.fxGradientEnd = fxGradientEnd.value;
    applyEffects();
  });
  if (fxGradientEnd) fxGradientEnd.addEventListener('change', function() { pushHistory(); });

  if (fxGradientAngle) fxGradientAngle.addEventListener('input', function() {
    state.fxGradientAngle = parseInt(fxGradientAngle.value);
    if (fxGradientAngleVal) fxGradientAngleVal.textContent = fxGradientAngle.value;
    applyEffects();
  });
  if (fxGradientAngle) fxGradientAngle.addEventListener('change', function() { pushHistory(); });

  // Gradient text presets
  document.querySelectorAll('.gradient-presets--text .gradient-preset').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var gs = btn.getAttribute('data-gstart');
      var ge = btn.getAttribute('data-gend');
      if (gs && ge) {
        state.fxGradientStart = gs;
        state.fxGradientEnd = ge;
        if (fxGradientStart) fxGradientStart.value = gs;
        if (fxGradientEnd) fxGradientEnd.value = ge;
        pushHistory();
        applyEffects();
      }
    });
  });

  // ============ OPTIONS ============
  document.getElementById('opt-logo').addEventListener('change', e => {
    state.showLogo = e.target.checked;
    canvasLogo.style.display = state.showLogo ? '' : 'none';
    pushHistory();
  });

  document.getElementById('opt-border').addEventListener('change', e => {
    state.showBorder = e.target.checked;
    canvasBorder.classList.toggle('visible', state.showBorder);
    var bsf = document.getElementById('border-style-field');
    if (bsf) bsf.style.display = state.showBorder ? '' : 'none';
    pushHistory();
  });

  // Border style variants
  document.querySelectorAll('.border-style-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.border-style-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.borderStyle = btn.dataset.bstyle;
      applyBorderStyle();
      pushHistory();
    });
  });

  function applyBorderStyle() {
    if (!canvasBorder) return;
    var s = state.borderStyle || 'classic';
    canvasBorder.setAttribute('data-border-style', s);
    // Reset inline border styles
    canvasBorder.style.border = '';
    canvasBorder.style.outline = '';
    canvasBorder.style.outlineOffset = '';
    canvasBorder.style.boxShadow = '';
    var col = state.accentColor || '#c4622a';
    switch (s) {
      case 'thin':
        canvasBorder.style.border = '1px solid ' + col;
        break;
      case 'classic':
        canvasBorder.style.border = '2px solid ' + col;
        break;
      case 'thick':
        canvasBorder.style.border = '4px solid ' + col;
        break;
      case 'double':
        canvasBorder.style.border = '3px double ' + col;
        canvasBorder.style.outline = '1px solid ' + col;
        canvasBorder.style.outlineOffset = '4px';
        break;
      case 'dashed':
        canvasBorder.style.border = '2px dashed ' + col;
        break;
      case 'inset':
        canvasBorder.style.border = '1px solid ' + col;
        canvasBorder.style.boxShadow = 'inset 0 0 0 3px ' + state.bgColor + ', inset 0 0 0 4px ' + col;
        break;
    }
  }

  // Logo scale
  var logoScaleSlider = document.getElementById('logo-scale');
  var logoScaleVal = document.getElementById('logo-scale-val');
  if (logoScaleSlider) logoScaleSlider.addEventListener('input', function() {
    state.logoScale = parseInt(logoScaleSlider.value);
    if (logoScaleVal) logoScaleVal.textContent = logoScaleSlider.value;
    applyLogoScale();
  });
  if (logoScaleSlider) logoScaleSlider.addEventListener('change', function() { pushHistory(); });

  function applyLogoScale() {
    if (!canvasLogo) return;
    var scale = (state.logoScale || 100) / 100;
    canvasLogo.style.transform = scale !== 1 ? 'scale(' + scale + ')' : '';
    canvasLogo.style.transformOrigin = 'top left';
  }

  // Canvas padding
  var canvasPaddingSlider = document.getElementById('canvas-padding');
  var canvasPaddingVal = document.getElementById('canvas-padding-val');
  var canvasContent = document.querySelector('.canvas__content');

  document.querySelectorAll('.padding-preset').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.padding-preset').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var val = parseInt(btn.dataset.pad);
      state.canvasPadding = val;
      if (canvasPaddingSlider) canvasPaddingSlider.value = val;
      if (canvasPaddingVal) canvasPaddingVal.textContent = val + '%';
      applyCanvasPadding();
      pushHistory();
    });
  });

  if (canvasPaddingSlider) canvasPaddingSlider.addEventListener('input', function() {
    state.canvasPadding = parseInt(canvasPaddingSlider.value);
    if (canvasPaddingVal) canvasPaddingVal.textContent = canvasPaddingSlider.value + '%';
    // Update preset active state
    document.querySelectorAll('.padding-preset').forEach(function(b) {
      b.classList.toggle('active', parseInt(b.dataset.pad) === state.canvasPadding);
    });
    applyCanvasPadding();
  });
  if (canvasPaddingSlider) canvasPaddingSlider.addEventListener('change', function() { pushHistory(); });

  function applyCanvasPadding() {
    if (!canvasContent) return;
    canvasContent.style.padding = (state.canvasPadding || 10) + '%';
  }

  function applyContentAlign() {
    if (!canvasContent) return;
    var align = state.contentAlign || 'start';
    canvasContent.style.justifyContent = align === 'start' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end';
  }

  // Element opacity controls
  var opSliders = [
    { id: 'opacity-subline', valId: 'opacity-subline-val', key: 'opacitySubline', el: canvasSubline },
    { id: 'opacity-body',    valId: 'opacity-body-val',    key: 'opacityBody',    el: canvasBody },
    { id: 'opacity-cta',     valId: 'opacity-cta-val',     key: 'opacityCta',     el: canvasCta }
  ];
  opSliders.forEach(function(cfg) {
    var slider = document.getElementById(cfg.id);
    var valEl = document.getElementById(cfg.valId);
    if (!slider) return;
    slider.addEventListener('input', function() {
      state[cfg.key] = parseInt(slider.value);
      if (valEl) valEl.textContent = slider.value + '%';
      applyElementOpacities();
    });
    slider.addEventListener('change', function() { pushHistory(); });
  });

  function applyElementOpacities() {
    if (canvasSubline) canvasSubline.style.opacity = (state.opacitySubline != null ? state.opacitySubline : 100) / 100;
    if (canvasBody) canvasBody.style.opacity = (state.opacityBody != null ? state.opacityBody : 100) / 100;
    // CTA opacity: only override if not already styled by template (some set opacity)
    if (canvasCta) {
      var ctaOp = (state.opacityCta != null ? state.opacityCta : 100) / 100;
      canvasCta.style.opacity = ctaOp;
    }
  }

  // Headline rotation
  var headlineRotSlider = document.getElementById('headline-rotation');
  var headlineRotVal = document.getElementById('headline-rotation-val');
  if (headlineRotSlider) headlineRotSlider.addEventListener('input', function() {
    state.headlineRotation = parseInt(headlineRotSlider.value);
    if (headlineRotVal) headlineRotVal.textContent = headlineRotSlider.value + '\u00b0';
    applyHeadlineRotation();
  });
  if (headlineRotSlider) headlineRotSlider.addEventListener('change', function() { pushHistory(); });

  function applyHeadlineRotation() {
    if (!canvasHeadline) return;
    var deg = state.headlineRotation || 0;
    canvasHeadline.style.transform = deg !== 0 ? 'rotate(' + deg + 'deg)' : '';
    canvasHeadline.style.transformOrigin = 'center center';
  }

  // Headline decoration
  document.querySelectorAll('.hdeco-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.hdeco-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.headlineDecoration = btn.dataset.deco;
      applyHeadlineDecoration();
      pushHistory();
    });
  });

  function applyHeadlineDecoration() {
    if (!canvasHeadline) return;
    var deco = state.headlineDecoration || 'none';
    var accent = state.accentColor || '#c4622a';
    canvasHeadline.style.textDecoration = '';
    canvasHeadline.style.textDecorationColor = '';
    canvasHeadline.style.textDecorationStyle = '';
    canvasHeadline.style.textUnderlineOffset = '';
    canvasHeadline.style.borderBottom = '';
    canvasHeadline.style.paddingBottom = '';
    canvasHeadline.setAttribute('data-headline-deco', deco);
    switch (deco) {
      case 'underline':
        canvasHeadline.style.textDecoration = 'underline';
        canvasHeadline.style.textDecorationColor = accent;
        canvasHeadline.style.textUnderlineOffset = '6px';
        break;
      case 'bar':
        canvasHeadline.style.borderBottom = '4px solid ' + accent;
        canvasHeadline.style.paddingBottom = '8px';
        break;
      case 'double':
        canvasHeadline.style.textDecoration = 'underline';
        canvasHeadline.style.textDecorationColor = accent;
        canvasHeadline.style.textDecorationStyle = 'double';
        canvasHeadline.style.textUnderlineOffset = '6px';
        break;
      case 'highlight':
        canvasHeadline.style.setProperty('--deco-accent', accent);
        break;
    }
  }

  document.getElementById('opt-grain').addEventListener('change', e => {
    state.showGrain = e.target.checked;
    canvasGrain.classList.toggle('visible', state.showGrain);
    pushHistory();
  });

  document.getElementById('opt-vignette').addEventListener('change', e => {
    state.showVignette = e.target.checked;
    canvasVignette.classList.toggle('visible', state.showVignette);
    pushHistory();
  });

  // ============ VERTICAL CONTENT ALIGNMENT ============
  document.querySelectorAll('.valign-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.valign-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.contentAlign = btn.dataset.valign;
      applyContentAlign();
      pushHistory();
    });
  });

  // ============ BACKGROUND IMAGE ============
  const bgInput = document.getElementById('input-bgimage');
  const bgClearBtn = document.getElementById('btn-clear-bg');
  const bgImageControls = document.getElementById('bg-image-controls');
  const uploadZone = document.getElementById('upload-zone-bg');
  const inputOpacity = document.getElementById('input-opacity');
  const opacityVal = document.getElementById('opacity-val');
  const inputBlur = document.getElementById('input-blur');
  const blurVal = document.getElementById('blur-val');
  const inputBrightness = document.getElementById('input-brightness');
  const brightnessVal = document.getElementById('brightness-val');
  const inputContrast = document.getElementById('input-contrast');
  const contrastVal = document.getElementById('contrast-val');
  const inputSaturation = document.getElementById('input-saturation');
  const saturationVal = document.getElementById('saturation-val');

  // Click on upload zone triggers file input
  if (uploadZone) {
    uploadZone.addEventListener('click', (e) => {
      if (e.target === bgInput) return;
      bgInput.click();
    });

    // Drag & drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleBgImageFile(file);
      }
    });
  }

  if (bgInput) bgInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleBgImageFile(file);
  });

  function handleBgImageFile(file) {
    const reader = new FileReader();
    reader.onload = ev => {
      state.bgImage = ev.target.result;
      canvasBgImage.style.backgroundImage = 'url(' + state.bgImage + ')';
      canvasBgImage.classList.add('has-image');
      if (bgClearBtn) bgClearBtn.style.display = '';
      if (bgImageControls) bgImageControls.style.display = '';
      applyBgImage();
      pushHistory();
    };
    reader.readAsDataURL(file);
  }

  if (bgClearBtn) bgClearBtn.addEventListener('click', () => {
    state.bgImage = null;
    state.bgBrightness = 100;
    state.bgContrast = 100;
    state.bgSaturation = 100;
    state.bgBlur = 0;
    state.bgOpacity = 70;
    canvasBgImage.style.backgroundImage = '';
    canvasBgImage.style.filter = '';
    canvasBgImage.style.transform = '';
    canvasBgImage.classList.remove('has-image');
    if (bgInput) bgInput.value = '';
    if (bgClearBtn) bgClearBtn.style.display = 'none';
    if (inputBrightness) { inputBrightness.value = 100; if (brightnessVal) brightnessVal.textContent = '100'; }
    if (inputContrast) { inputContrast.value = 100; if (contrastVal) contrastVal.textContent = '100'; }
    if (inputSaturation) { inputSaturation.value = 100; if (saturationVal) saturationVal.textContent = '100'; }
    if (inputBlur) { inputBlur.value = 0; if (blurVal) blurVal.textContent = '0'; }
    if (inputOpacity) { inputOpacity.value = 70; if (opacityVal) opacityVal.textContent = '70'; }
    if (bgImageControls) bgImageControls.style.display = 'none';
    pushHistory();
  });

  if (inputOpacity) inputOpacity.addEventListener('input', () => {
    state.bgOpacity = parseInt(inputOpacity.value);
    if (opacityVal) opacityVal.textContent = state.bgOpacity;
    applyBgImage();
  });
  if (inputOpacity) inputOpacity.addEventListener('change', () => pushHistory());

  if (inputBlur) inputBlur.addEventListener('input', () => {
    state.bgBlur = parseInt(inputBlur.value);
    if (blurVal) blurVal.textContent = state.bgBlur;
    applyBgImage();
  });
  if (inputBlur) inputBlur.addEventListener('change', () => pushHistory());

  if (inputBrightness) inputBrightness.addEventListener('input', () => {
    state.bgBrightness = parseInt(inputBrightness.value);
    if (brightnessVal) brightnessVal.textContent = state.bgBrightness;
    applyBgImage();
  });
  if (inputBrightness) inputBrightness.addEventListener('change', () => pushHistory());

  if (inputContrast) inputContrast.addEventListener('input', () => {
    state.bgContrast = parseInt(inputContrast.value);
    if (contrastVal) contrastVal.textContent = state.bgContrast;
    applyBgImage();
  });
  if (inputContrast) inputContrast.addEventListener('change', () => pushHistory());

  if (inputSaturation) inputSaturation.addEventListener('input', () => {
    state.bgSaturation = parseInt(inputSaturation.value);
    if (saturationVal) saturationVal.textContent = state.bgSaturation;
    applyBgImage();
  });
  if (inputSaturation) inputSaturation.addEventListener('change', () => pushHistory());

  // BG Overlay controls
  var bgOverlayColorInput = document.getElementById('bg-overlay-color');
  var bgOverlayOpacityInput = document.getElementById('bg-overlay-opacity');
  var bgOverlayOpacityVal = document.getElementById('bg-overlay-opacity-val');
  var canvasBgOverlay = document.getElementById('canvas-bg-overlay');

  if (bgOverlayColorInput) bgOverlayColorInput.addEventListener('input', function() {
    state.bgOverlayColor = bgOverlayColorInput.value;
    applyBgOverlay();
  });
  if (bgOverlayColorInput) bgOverlayColorInput.addEventListener('change', function() { pushHistory(); });

  if (bgOverlayOpacityInput) bgOverlayOpacityInput.addEventListener('input', function() {
    state.bgOverlayOpacity = parseInt(bgOverlayOpacityInput.value);
    if (bgOverlayOpacityVal) bgOverlayOpacityVal.textContent = state.bgOverlayOpacity;
    applyBgOverlay();
  });
  if (bgOverlayOpacityInput) bgOverlayOpacityInput.addEventListener('change', function() { pushHistory(); });

  function applyBgOverlay() {
    if (!canvasBgOverlay) return;
    var op = (state.bgOverlayOpacity || 0) / 100;
    if (op > 0) {
      canvasBgOverlay.style.background = state.bgOverlayColor || '#000000';
      canvasBgOverlay.style.opacity = op;
    } else {
      canvasBgOverlay.style.opacity = '0';
    }
  }

  // BG size buttons
  document.querySelectorAll('.bgsize-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.bgsize-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.bgSize = btn.dataset.bgsize;
      applyBgImage();
      pushHistory();
    });
  });

  // BG position grid
  document.querySelectorAll('.bgpos-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.bgpos-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.bgPosition = btn.dataset.bgpos;
      applyBgImage();
      pushHistory();
    });
  });

  function applyBgImage() {
    canvasBgImage.style.setProperty('--overlay-opacity', state.bgOpacity / 100);
    var filters = [];
    if (state.bgBlur > 0) filters.push('blur(' + state.bgBlur + 'px)');
    if (state.bgBrightness !== 100) filters.push('brightness(' + (state.bgBrightness / 100) + ')');
    if (state.bgContrast !== 100) filters.push('contrast(' + (state.bgContrast / 100) + ')');
    if (state.bgSaturation !== 100) filters.push('saturate(' + (state.bgSaturation / 100) + ')');
    canvasBgImage.style.filter = filters.length ? filters.join(' ') : '';
    canvasBgImage.style.transform = state.bgBlur > 0 ? 'scale(1.05)' : '';
    canvasBgImage.style.backgroundSize = state.bgSize || 'cover';
    canvasBgImage.style.backgroundPosition = state.bgPosition || 'center';
  }

  // ============ ZOOM ============
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomFit = document.getElementById('btn-zoom-fit');

  // applyZoom is now handled by fitCanvasToViewport() which combines
  // viewport fit scale + user zoom into a single transform.
  function applyZoom() { fitCanvasToViewport(); }

  if (btnZoomIn) btnZoomIn.addEventListener('click', () => {
    state.zoom = Math.min(200, state.zoom + 10);
    fitCanvasToViewport();
  });

  if (btnZoomOut) btnZoomOut.addEventListener('click', () => {
    state.zoom = Math.max(30, state.zoom - 10);
    fitCanvasToViewport();
  });

  if (btnZoomFit) btnZoomFit.addEventListener('click', () => {
    state.zoom = 100;
    fitCanvasToViewport();
  });

  // Mouse wheel zoom
  if (canvasArea) canvasArea.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        state.zoom = Math.min(200, state.zoom + 5);
      } else {
        state.zoom = Math.max(30, state.zoom - 5);
      }
      applyZoom();
    }
  }, { passive: false });

  // ============ GRID ============
  const btnGrid = document.getElementById('btn-grid');
  if (btnGrid) btnGrid.addEventListener('click', () => {
    state.gridVisible = !state.gridVisible;
    btnGrid.classList.toggle('active', state.gridVisible);
    if (canvasGrid) canvasGrid.classList.toggle('visible', state.gridVisible);
  });

  // ============ UNDO / REDO BUTTONS ============
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.addEventListener('click', undo);
  if (btnRedo) btnRedo.addEventListener('click', redo);

  // ============ RESET ============
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Reinitialiser le design ? Les modifications seront perdues.')) return;
    state = getDefaultState();
    historyPaused = true;
    restoreFromState();
    historyPaused = false;
    pushHistory();
  });

  // ============ EXPORT ============
  var exportFormat = 'png';
  var exportQuality = 92;
  var exportScaleMultiplier = 1;

  var exportDropdown = document.getElementById('export-dropdown');
  var btnExportToggle = document.getElementById('btn-export-toggle');
  var exportFormatToggle = document.getElementById('export-format-toggle');
  var exportScaleToggle = document.getElementById('export-scale-toggle');
  var exportQualityRow = document.getElementById('export-quality-row');
  var exportQualitySlider = document.getElementById('export-quality');
  var exportQualityVal = document.getElementById('export-quality-val');
  var exportSizeInfo = document.getElementById('export-size-info');

  function updateExportSizeInfo() {
    if (!exportSizeInfo) return;
    var w = state.format.w * exportScaleMultiplier;
    var h = state.format.h * exportScaleMultiplier;
    exportSizeInfo.textContent = w + ' x ' + h + ' px';
  }

  if (btnExportToggle) btnExportToggle.addEventListener('click', function() {
    var open = exportDropdown.style.display !== 'none';
    exportDropdown.style.display = open ? 'none' : 'flex';
    if (!open) updateExportSizeInfo();
  });

  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    if (exportDropdown && exportDropdown.style.display !== 'none') {
      var wrap = document.getElementById('export-wrap');
      if (wrap && !wrap.contains(e.target)) {
        exportDropdown.style.display = 'none';
      }
    }
  });

  var exportDurationRow = document.getElementById('export-duration-row');
  var exportFpsRow = document.getElementById('export-fps-row');
  var exportDurationSlider = document.getElementById('export-duration');
  var exportFpsSlider = document.getElementById('export-fps');
  var exportDurationVal = document.getElementById('export-duration-val');
  var exportFpsVal = document.getElementById('export-fps-val');

  if (exportDurationSlider) exportDurationSlider.addEventListener('input', function() {
    if (exportDurationVal) exportDurationVal.textContent = this.value;
  });
  if (exportFpsSlider) exportFpsSlider.addEventListener('input', function() {
    if (exportFpsVal) exportFpsVal.textContent = this.value;
  });

  if (exportFormatToggle) exportFormatToggle.addEventListener('click', function(e) {
    var btn = e.target.closest('.export-dropdown__opt');
    if (!btn) return;
    exportFormatToggle.querySelectorAll('.export-dropdown__opt').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    exportFormat = btn.dataset.val;
    var isAnimated = exportFormat === 'gif' || exportFormat === 'webm';
    if (exportQualityRow) exportQualityRow.style.display = exportFormat === 'jpeg' ? 'flex' : 'none';
    if (exportDurationRow) exportDurationRow.style.display = isAnimated ? 'flex' : 'none';
    if (exportFpsRow) exportFpsRow.style.display = isAnimated ? 'flex' : 'none';
    if (btnCopyClipboard) {
      btnCopyClipboard.disabled = isAnimated;
      btnCopyClipboard.style.opacity = isAnimated ? '0.4' : '1';
      btnCopyClipboard.title = isAnimated ? 'Non disponible pour les formats animes' : '';
    }
  });

  if (exportScaleToggle) exportScaleToggle.addEventListener('click', function(e) {
    var btn = e.target.closest('.export-dropdown__opt');
    if (!btn) return;
    exportScaleToggle.querySelectorAll('.export-dropdown__opt').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    exportScaleMultiplier = parseInt(btn.dataset.val);
    updateExportSizeInfo();
  });

  if (exportQualitySlider) exportQualitySlider.addEventListener('input', function() {
    exportQuality = parseInt(this.value);
    if (exportQualityVal) exportQualityVal.textContent = exportQuality;
  });

  /** Temporarily resize canvas to native resolution for crisp export.
   *  Instead of capturing at ~500px and upscaling (blurry), we blow the
   *  canvas up to the real target size so html2canvas renders text, SVG
   *  and CSS effects at full resolution. */
  function prepareCanvasForExport(targetW) {
    canvasWrapper.style.transform = '';
    canvas.classList.add('exporting');
    canvasWrapper.style.overflow = 'hidden';
    deselectStickers();

    // Save reference dimensions
    var refW = state._refW || REF_BASE;
    var refH = state._refH || REF_BASE;

    // Resize canvas to native export resolution
    var nativeW = targetW;
    var nativeH = Math.round(nativeW * (state.format.h / state.format.w));
    canvas.style.width = nativeW + 'px';
    canvas.style.height = nativeH + 'px';
    canvasWrapper.style.width = nativeW + 'px';
    canvasWrapper.style.height = nativeH + 'px';

    // Re-apply typography at native scale so fonts are crisp
    var exportFontScale = Math.max(nativeW, nativeH) / REF_BASE;
    applyTypography(exportFontScale);

    return {
      restore: function() {
        // Restore to fixed reference dimensions
        canvas.style.width = refW + 'px';
        canvas.style.height = refH + 'px';
        canvasWrapper.style.width = refW + 'px';
        canvasWrapper.style.height = refH + 'px';
        canvasWrapper.style.overflow = '';
        canvas.classList.remove('exporting');
        applyTypography(Math.max(refW, refH) / REF_BASE);
        fitCanvasToViewport();
      }
    };
  }

  function exportCanvas() {
    var exportW = state.format.w * exportScaleMultiplier;

    exportOverlay.classList.add('visible');
    if (exportDropdown) exportDropdown.style.display = 'none';

    // Resize canvas to native export resolution for crisp rendering
    var snapshot = prepareCanvasForExport(exportW);

    setTimeout(() => {
      html2canvas(canvas, {
        scale: 1,
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      }).then(result => {
        const link = document.createElement('a');
        var ext = exportFormat === 'jpeg' ? 'jpg' : 'png';
        var scaleLabel = exportScaleMultiplier > 1 ? '@' + exportScaleMultiplier + 'x' : '';
        link.download = 'latraverse-' + state.template + '-' + state.format.label.toLowerCase() + scaleLabel + '-' + Date.now() + '.' + ext;
        if (exportFormat === 'jpeg') {
          link.href = result.toDataURL('image/jpeg', exportQuality / 100);
        } else {
          link.href = result.toDataURL('image/png');
        }
        link.click();
        exportOverlay.classList.remove('visible');
        snapshot.restore();
      }).catch(err => {
        console.error('Export error:', err);
        alert('Erreur lors de l\'export.');
        exportOverlay.classList.remove('visible');
        snapshot.restore();
      });
    }, 200);
  }

  document.getElementById('btn-export').addEventListener('click', function() {
    if (exportFormat === 'gif' || exportFormat === 'webm') {
      exportAnimated();
    } else {
      exportCanvas();
    }
  });

  // Copy to clipboard
  var btnCopyClipboard = document.getElementById('btn-copy-clipboard');
  if (btnCopyClipboard) btnCopyClipboard.addEventListener('click', function() {
    var exportW = state.format.w * exportScaleMultiplier;

    var btn = btnCopyClipboard;
    var origText = btn.innerHTML;
    btn.disabled = true;

    // Resize canvas to native resolution for crisp copy
    var snapshot = prepareCanvasForExport(exportW);

    setTimeout(function() {
      html2canvas(canvas, {
        scale: 1,
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      }).then(function(result) {
        result.toBlob(function(blob) {
          if (blob && navigator.clipboard && navigator.clipboard.write) {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]).then(function() {
              btn.classList.add('btn--copied');
              btn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7l3 3 5-5"/></svg> Copie !';
              setTimeout(function() {
                btn.classList.remove('btn--copied');
                btn.innerHTML = origText;
                btn.disabled = false;
              }, 1500);
            }).catch(function() {
              alert('Impossible de copier dans le presse-papier.');
              btn.disabled = false;
            });
          } else {
            alert('Votre navigateur ne supporte pas la copie d\'images.');
            btn.disabled = false;
          }
        }, 'image/png');
        snapshot.restore();
      }).catch(function(err) {
        console.error('Copy error:', err);
        snapshot.restore();
        btn.disabled = false;
      });
    }, 200);
  });

  // ============ AI IMAGE GENERATION ============
  const aiPrompt = document.getElementById('ai-prompt');
  const btnGenerate = document.getElementById('btn-generate-ai');
  const aiResult = document.getElementById('ai-result');
  const aiResultImg = document.getElementById('ai-result-img');
  const aiError = document.getElementById('ai-error');

  if (btnGenerate) btnGenerate.addEventListener('click', async () => {
    if (!aiPrompt || !aiPrompt.value.trim()) {
      if (aiPrompt) aiPrompt.focus();
      return;
    }

    btnGenerate.disabled = true;
    btnGenerate.classList.add('loading');
    const btnText = btnGenerate.querySelector('.btn-ai-text');
    if (btnText) btnText.textContent = 'Generation en cours...';
    if (aiResult) aiResult.style.display = 'none';
    if (aiError) aiError.style.display = 'none';

    try {
      const res = await fetch('/api/branding/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.value.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      if (aiResultImg) aiResultImg.src = data.url;
      if (aiResult) aiResult.style.display = '';
      loadGallery();
    } catch (err) {
      if (aiError) {
        aiError.textContent = err.message;
        aiError.style.display = '';
      }
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.classList.remove('loading');
      if (btnText) btnText.textContent = 'Generer l\'image';
    }
  });

  // Use AI image as background
  const btnAiBg = document.getElementById('btn-ai-bg');
  if (btnAiBg) btnAiBg.addEventListener('click', () => {
    if (!aiResultImg || !aiResultImg.src) return;
    state.bgImage = aiResultImg.src;
    canvasBgImage.style.backgroundImage = 'url(' + aiResultImg.src + ')';
    canvasBgImage.classList.add('has-image');
    if (bgClearBtn) bgClearBtn.style.display = '';
    if (bgImageControls) bgImageControls.style.display = '';
    applyBgImage();
    pushHistory();
  });

  // Save AI image confirmation
  const btnAiSave = document.getElementById('btn-ai-save');
  if (btnAiSave) btnAiSave.addEventListener('click', () => {
    btnAiSave.textContent = 'Sauvegardee !';
    btnAiSave.disabled = true;
    setTimeout(() => {
      btnAiSave.textContent = 'Sauvegarder';
      btnAiSave.disabled = false;
    }, 2000);
  });

  // ============ IMAGE GALLERY ============
  function loadGallery() {
    fetch('/api/branding/images')
      .then(r => r.json())
      .then(data => {
        const gallery = document.getElementById('image-gallery');
        const hint = document.getElementById('gallery-hint');
        if (!gallery) return;

        if (!data.images || data.images.length === 0) {
          gallery.innerHTML = '';
          if (hint) hint.style.display = '';
          return;
        }

        if (hint) hint.style.display = 'none';
        gallery.innerHTML = data.images.map(img =>
          '<div class="gallery-thumb" data-url="' + img.url + '" title="' + img.filename + '">' +
            '<img src="' + img.url + '" alt="' + img.filename + '" loading="lazy">' +
            '<button class="gallery-thumb__delete" data-filename="' + img.filename + '">&times;</button>' +
          '</div>'
        ).join('');

        gallery.querySelectorAll('.gallery-thumb').forEach(thumb => {
          thumb.addEventListener('click', (e) => {
            if (e.target.closest('.gallery-thumb__delete')) return;
            const url = thumb.dataset.url;
            state.bgImage = url;
            canvasBgImage.style.backgroundImage = 'url(' + url + ')';
            canvasBgImage.classList.add('has-image');
            if (bgClearBtn) bgClearBtn.style.display = '';
            if (bgImageControls) bgImageControls.style.display = '';
            applyBgImage();
            pushHistory();
          });
        });

        gallery.querySelectorAll('.gallery-thumb__delete').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await fetch('/api/branding/images/' + encodeURIComponent(btn.dataset.filename), { method: 'DELETE' });
            loadGallery();
          });
        });
      })
      .catch(() => {});
  }

  // Add image to gallery via upload
  const inputAddImage = document.getElementById('input-add-image');
  if (inputAddImage) inputAddImage.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/branding/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) loadGallery();
    } catch (err) {
      console.error('Upload error:', err);
    }

    inputAddImage.value = '';
  });

  loadGallery();

  // ============ MAIN UPDATE ============

  // Fixed reference base — canvas is always authored at this width.
  // Viewport fitting uses CSS transform so content never changes on resize.
  var REF_BASE = 540;

  /** Recalculate ONLY the viewport-fit transform (resize / zoom safe).
   *  Never touches fonts, text, or layout — just the visual scale. */
  function fitCanvasToViewport() {
    var refW = state._refW || REF_BASE;
    var refH = state._refH || REF_BASE;
    var maxW = canvasArea.clientWidth - 80;
    var maxH = canvasArea.clientHeight - 100;
    var fitScale = Math.min(maxW / refW, maxH / refH, 1.4);
    state._fitScale = fitScale;
    var totalScale = fitScale * (state.zoom / 100);
    canvasWrapper.style.transform = 'scale(' + totalScale + ')';
    canvasWrapper.style.transformOrigin = 'center center';
    var zv = document.getElementById('zoom-val');
    if (zv) zv.textContent = state.zoom + '%';
  }

  function updateCanvas() {
    // Template
    canvas.dataset.template = state.template;
    if (infoTemplate) infoTemplate.textContent = state.template.charAt(0).toUpperCase() + state.template.slice(1);

    // Fixed reference canvas size — depends ONLY on format, never on viewport
    var refW = REF_BASE;
    var refH = Math.round(REF_BASE * (state.format.h / state.format.w));
    state._refW = refW;
    state._refH = refH;

    canvas.style.width = refW + 'px';
    canvas.style.height = refH + 'px';
    canvasWrapper.style.width = refW + 'px';
    canvasWrapper.style.height = refH + 'px';

    if (infoFormat) infoFormat.textContent = state.format.label + ' \u2014 ' + state.format.w + ' \u00d7 ' + state.format.h;

    // Font scale is FIXED per format — never changes on viewport resize
    var fontScale = Math.max(refW, refH) / REF_BASE;

    // Update text
    canvasHeadline.textContent = state.headline;
    canvasSubline.textContent = state.subline;
    canvasBody.textContent = state.body;
    canvasCta.textContent = state.cta;

    // Options
    canvasLogo.style.display = state.showLogo ? '' : 'none';
    canvasBorder.classList.toggle('visible', state.showBorder);
    canvasGrain.classList.toggle('visible', state.showGrain);
    canvasVignette.classList.toggle('visible', state.showVignette);

    // BG image
    if (state.bgImage) {
      canvasBgImage.style.backgroundImage = 'url(' + state.bgImage + ')';
      canvasBgImage.classList.add('has-image');
    } else {
      canvasBgImage.style.backgroundImage = '';
      canvasBgImage.classList.remove('has-image');
    }

    applyColors();
    applyTypography(fontScale);
    applyEffects();
    applyCtaStyle();
    applySublineStyle();
    // Element visibility
    if (canvasSubline) canvasSubline.style.display = state.showSubline === false ? 'none' : '';
    if (canvasBody) canvasBody.style.display = state.showBody === false ? 'none' : '';
    if (canvasCta) canvasCta.style.display = state.showCta === false ? 'none' : '';
    applyBgImage();
    applyPattern();
    applyBorderStyle();
    applyLogoScale();
    applyCanvasPadding();
    applyContentAlign();
    applyBgOverlay();
    applyElementOpacities();
    applyHeadlineRotation();
    applyHeadlineDecoration();
    applyDecorations();
    renderStickers();
    fitCanvasToViewport();
  }

  // ============ APPLY COLORS ============
  function applyColors() {
    // Background
    if (state.gradient.enabled) {
      canvas.style.background = 'linear-gradient(' + state.gradient.angle + 'deg, ' + state.gradient.start + ', ' + state.gradient.end + ')';
    } else {
      // Template-specific gradient for gradient template
      if (state.template === 'gradient') {
        canvas.style.background = 'linear-gradient(160deg, ' + state.accentColor + ' 0%, ' + state.bgColor + ' 60%)';
      } else {
        canvas.style.background = state.bgColor;
      }
    }

    // Text color
    canvas.style.color = state.textColor;

    // Accent on border — handled by applyBorderStyle()

    // Split template: right panel via box-shadow
    if (state.template === 'split') {
      canvas.style.boxShadow = 'inset -' + (canvas.offsetWidth * 0.4) + 'px 0 0 0 ' + state.accentColor;
    } else {
      canvas.style.boxShadow = 'none';
    }

    // Promo template: subline badge
    if (state.template === 'promo') {
      canvasSubline.style.background = state.accentColor;
      canvasSubline.style.color = '#fff';
    } else {
      canvasSubline.style.background = '';
      canvasSubline.style.color = '';
    }

    // Glass panel
    const glassPanel = document.getElementById('canvas-glass-panel');
    if (glassPanel) {
      if (state.template === 'glass' || state.template === 'cards') {
        glassPanel.style.opacity = '1';
      } else {
        glassPanel.style.opacity = '0';
      }
    }

    // BG image overlay color
    canvasBgImage.style.setProperty('--overlay-color', state.bgColor);

    // Dynamic template thumbnail colors
    var tmplGrid = document.querySelector('.template-grid') || document.querySelector('.template-scroll');
    if (tmplGrid) {
      tmplGrid.style.setProperty('--tmpl-accent', state.accentColor);
      tmplGrid.style.setProperty('--tmpl-accent2', state.accentColor2 || '#e8a87c');
      tmplGrid.style.setProperty('--tmpl-bg', state.bgColor);
    }
  }

  // ============ APPLY TYPOGRAPHY ============
  function applyTypography(fontScale) {
    const s = fontScale || (Math.max(state._refW || REF_BASE, state._refH || REF_BASE) / REF_BASE);
    const fs = Math.max(0.5, Math.min(s, 2.0));

    // Content alignment for some templates (set BEFORE measuring)
    const content = canvas.querySelector('.canvas__content');
    const centeredTemplates = ['bold', 'promo', 'quote', 'glass', 'neon', 'blobs', 'cards'];
    if (centeredTemplates.includes(state.template)) {
      if (content) content.style.alignItems = 'center';
      if (content) content.style.textAlign = 'center';
      canvasBody.style.textAlign = 'center';
      if (content) content.style.width = '';
    } else if (state.template === 'split') {
      if (content) content.style.alignItems = '';
      if (content) content.style.textAlign = '';
      if (content) content.style.width = '60%';
      canvasBody.style.textAlign = '';
    } else {
      if (content) content.style.alignItems = '';
      if (content) content.style.textAlign = '';
      if (content) content.style.width = '';
      canvasBody.style.textAlign = '';
    }

    // Headline — auto-fit: reduce size if text overflows container
    canvasHeadline.style.fontFamily = state.typoHeadline.font;
    canvasHeadline.style.fontWeight = state.typoHeadline.weight;
    canvasHeadline.style.textAlign = state.typoHeadline.align;
    canvasHeadline.style.textTransform = state.typoHeadline.case === 'none' ? '' : state.typoHeadline.case;
    canvasHeadline.style.lineHeight = (state.typoHeadline.lh / 100);
    canvasHeadline.style.letterSpacing = state.typoHeadline.ls + 'px';
    if (state.headlineColor) canvasHeadline.style.color = state.headlineColor;
    else canvasHeadline.style.color = '';

    // Auto-fit headline: limit to max 2 lines by shrinking font if needed
    const desiredHeadlinePx = state.typoHeadline.size * fs;
    let headlinePx = desiredHeadlinePx;
    canvasHeadline.style.fontSize = headlinePx + 'px';
    const canvasW = canvas.offsetWidth;
    if (canvasW > 0 && canvasHeadline.scrollHeight > 0) {
      let tries = 0;
      while (tries < 20 && headlinePx > 6) {
        const lh = headlinePx * (state.typoHeadline.lh / 100 || 1.1);
        const maxH = lh * 2.2;
        if (canvasHeadline.scrollHeight <= maxH + 1) break;
        headlinePx *= 0.9;
        canvasHeadline.style.fontSize = headlinePx + 'px';
        tries++;
      }
    }

    // Calculate shrink ratio so body/subline/cta scale proportionally
    const shrinkRatio = desiredHeadlinePx > 0 ? headlinePx / desiredHeadlinePx : 1;

    // Body — scale proportionally if headline was shrunk
    canvasBody.style.fontFamily = state.typoBody.font;
    canvasBody.style.fontSize = (state.typoBody.size * fs * shrinkRatio) + 'px';
    canvasBody.style.fontWeight = state.typoBody.weight;
    canvasBody.style.lineHeight = (state.typoBody.lh || 160) / 100;
    if (state.bodyColor) canvasBody.style.color = state.bodyColor;
    else canvasBody.style.color = '';
    if (state.typoBody.align && !centeredTemplates.includes(state.template)) {
      canvasBody.style.textAlign = state.typoBody.align;
    }

    // Subline — customizable size, weight, letter-spacing
    var subSize = (state.typoSubline && state.typoSubline.size) || 14;
    canvasSubline.style.fontSize = (subSize * fs * shrinkRatio) + 'px';
    canvasSubline.style.fontWeight = (state.typoSubline && state.typoSubline.weight) || '400';
    canvasSubline.style.letterSpacing = ((state.typoSubline && state.typoSubline.ls) || 0) + 'px';
    var subCase = (state.typoSubline && state.typoSubline.case) || 'none';
    canvasSubline.style.textTransform = subCase === 'none' ? '' : subCase;

    // CTA — customizable size, weight, letter-spacing
    var ctaSize = (state.typoCta && state.typoCta.size) || 12;
    canvasCta.style.fontSize = (ctaSize * fs * shrinkRatio) + 'px';
    canvasCta.style.fontWeight = (state.typoCta && state.typoCta.weight) || '500';
    canvasCta.style.letterSpacing = ((state.typoCta && state.typoCta.ls) || 0) + 'px';

    // Logo scale
    const logoSpan = canvasLogo.querySelector('span');
    if (logoSpan) logoSpan.style.fontSize = (14 * fs) + 'px';
    const logoSvg = canvasLogo.querySelector('svg');
    if (logoSvg) {
      logoSvg.style.width = (28 * fs) + 'px';
      logoSvg.style.height = (28 * fs) + 'px';
    }
  }

  // ============ APPLY EFFECTS ============
  function applyEffects() {
    let shadows = [];

    // Template-specific effects reset
    if (state.template !== 'neon') {
      // Only apply manual shadow if not neon
      if (state.fxShadow > 0) {
        var sx = state.textShadowX || 0;
        var sy = state.textShadowY != null ? state.textShadowY : 2;
        var scolor = state.textShadowColor || '#000000';
        shadows.push(sx + 'px ' + sy + 'px ' + state.fxShadow + 'px ' + scolor + '80');
      }
      if (state.fxGlow > 0) {
        shadows.push('0 0 ' + state.fxGlow + 'px ' + state.accentColor);
      }
    } else {
      // Neon: always glow
      shadows.push('0 0 20px ' + state.accentColor);
      shadows.push('0 0 40px ' + state.accentColor + '60');
      shadows.push('0 0 80px ' + state.accentColor + '30');
      if (state.fxGlow > 0) {
        shadows.push('0 0 ' + (state.fxGlow + 20) + 'px ' + state.accentColor);
      }
    }

    canvasHeadline.style.textShadow = shadows.length > 0 ? shadows.join(', ') : '';

    // Outline
    if (state.fxOutline) {
      canvasHeadline.style.webkitTextStroke = '1px ' + state.accentColor;
    } else {
      canvasHeadline.style.webkitTextStroke = '';
    }

    // Gradient text
    if (state.fxGradientText) {
      canvasHeadline.style.background = 'linear-gradient(' + state.fxGradientAngle + 'deg, ' + state.fxGradientStart + ', ' + state.fxGradientEnd + ')';
      canvasHeadline.style.webkitBackgroundClip = 'text';
      canvasHeadline.style.webkitTextFillColor = 'transparent';
      canvasHeadline.style.backgroundClip = 'text';
    } else {
      canvasHeadline.style.background = '';
      canvasHeadline.style.webkitBackgroundClip = '';
      canvasHeadline.style.webkitTextFillColor = '';
      canvasHeadline.style.backgroundClip = '';
    }

    // Re-apply free layout (handles get stripped by textContent assignment above)
    reapplyFreeLayout();
  }

  // ============ APPLY DECORATIONS (per template) ============
  function applyDecorations() {
    if (!canvasDecorations) return;
    canvasDecorations.innerHTML = '';

    var w = canvas.offsetWidth;
    var h = canvas.offsetHeight;
    var accent = state.accentColor;
    var accent2 = state.accentColor2 || '#e8a87c';
    var accentRgb = hexToRgb(accent);
    var accent2Rgb = hexToRgb(accent2);
    var s = w / 540; // scale factor

    // ---- COMPONENT HELPERS (SuperDuper-style floating UI elements) ----

    // Gradient pill badge (looks like a floating button)
    function pill(x, y, pw, ph, bg, op, rot) {
      return '<div style="position:absolute;top:'+y+';left:'+x+';width:'+pw+'px;height:'+ph+'px;border-radius:'+ph+'px;background:'+bg+';opacity:'+op+';transform:rotate('+(rot||0)+'deg);box-shadow:0 '+(4*s)+'px '+(16*s)+'px rgba(0,0,0,0.25)"></div>';
    }

    // Glass card mockup (frosted card with inner mock content lines)
    function glassCard(x, y, cw, ch, op, rot) {
      var r = Math.round(10 * s);
      return '<div style="position:absolute;top:'+y+';left:'+x+';width:'+cw+'px;height:'+ch+'px;border-radius:'+r+'px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);opacity:'+op+';transform:rotate('+(rot||0)+'deg);box-shadow:0 '+(8*s)+'px '+(32*s)+'px rgba(0,0,0,0.3);overflow:hidden">' +
        '<div style="position:absolute;top:15%;left:12%;right:35%;height:3px;background:rgba(255,255,255,0.2);border-radius:2px"></div>' +
        '<div style="position:absolute;top:30%;left:12%;right:15%;height:2px;background:rgba(255,255,255,0.08);border-radius:1px"></div>' +
        '<div style="position:absolute;top:42%;left:12%;right:25%;height:2px;background:rgba(255,255,255,0.06);border-radius:1px"></div>' +
        '<div style="position:absolute;bottom:15%;left:12%;width:40%;height:'+Math.max(6,ch*0.1)+'px;border-radius:999px;background:linear-gradient(90deg,rgba('+accentRgb+',0.35),rgba('+accent2Rgb+',0.25))"></div>' +
      '</div>';
    }

    // App icon circle (rounded square, looks like an app badge)
    function appIcon(x, y, sz, bg, op) {
      var r = Math.round(sz * 0.28);
      return '<div style="position:absolute;top:'+y+';left:'+x+';width:'+sz+'px;height:'+sz+'px;border-radius:'+r+'px;background:'+bg+';opacity:'+op+';box-shadow:0 '+(4*s)+'px '+(20*s)+'px rgba(0,0,0,0.3)"></div>';
    }

    // Rounded square grid pattern (background of outlined rounded squares)
    function roundedGrid(cellSz, gap, color, op) {
      var html = '';
      var cols = Math.ceil(w / (cellSz + gap)) + 1;
      var rows = Math.ceil(h / (cellSz + gap)) + 1;
      var r = Math.round(cellSz * 0.25);
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          var lx = col * (cellSz + gap);
          var ly = row * (cellSz + gap);
          html += '<div style="position:absolute;top:'+ly+'px;left:'+lx+'px;width:'+cellSz+'px;height:'+cellSz+'px;border-radius:'+r+'px;border:1px solid '+color+';opacity:'+op+'"></div>';
        }
      }
      return '<div style="position:absolute;inset:0;overflow:hidden">' + html + '</div>';
    }

    // Floating tag badge (outlined pill with optional inner dot)
    function tag(x, y, tw, th, color, op, rot) {
      return '<div style="position:absolute;top:'+y+';left:'+x+';width:'+tw+'px;height:'+th+'px;border-radius:'+th+'px;border:1.5px solid '+color+';opacity:'+op+';transform:rotate('+(rot||0)+'deg)">' +
        '<div style="position:absolute;top:50%;left:20%;width:'+(th*0.3)+'px;height:'+(th*0.3)+'px;border-radius:50%;background:'+color+';transform:translateY(-50%);opacity:0.5"></div>' +
        '<div style="position:absolute;top:50%;left:40%;right:15%;height:2px;background:'+color+';transform:translateY(-50%);opacity:0.3;border-radius:1px"></div>' +
      '</div>';
    }

    // Screen / phone mockup frame
    function screenFrame(x, y, sw, sh, color, op, rot) {
      var r = Math.round(12 * s);
      return '<div style="position:absolute;top:'+y+';left:'+x+';width:'+sw+'px;height:'+sh+'px;border-radius:'+r+'px;border:2px solid '+color+';opacity:'+op+';transform:rotate('+(rot||0)+'deg);box-shadow:0 '+(6*s)+'px '+(24*s)+'px rgba(0,0,0,0.2)">' +
        '<div style="position:absolute;top:8%;left:50%;transform:translateX(-50%);width:25%;height:3px;border-radius:2px;background:'+color+';opacity:0.3"></div>' +
        '<div style="position:absolute;bottom:5%;left:50%;transform:translateX(-50%);width:20%;height:20%;border-radius:50%;border:1.5px solid '+color+';opacity:0.2"></div>' +
      '</div>';
    }

    // Blob (gradient circle with blur)
    function blob(x, y, sz, color, op, blur) {
      return '<div style="position:absolute;top:'+y+';left:'+x+';width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+color+';opacity:'+op+';filter:blur('+blur+'px)"></div>';
    }

    // Micro dots
    function microDots(count, color, opBase) {
      var dots = '';
      for (var i = 0; i < count; i++) {
        var dx = 5 + (i * 73 + 17) % 90;
        var dy = 8 + (i * 47 + 31) % 84;
        var dsz = 2 + (i % 3);
        dots += '<div style="position:absolute;top:'+dy+'%;left:'+dx+'%;width:'+dsz+'px;height:'+dsz+'px;border-radius:50%;background:'+color+';opacity:'+(opBase - i*0.012).toFixed(3)+'"></div>';
      }
      return dots;
    }

    switch (state.template) {

      case 'minimal': {
        canvasDecorations.innerHTML =
          // vertical accent bar
          '<div style="position:absolute;left:7%;top:12%;bottom:12%;width:3px;background:linear-gradient(180deg,transparent,'+accent+','+accent2+',transparent);opacity:0.3;border-radius:2px"></div>' +
          // floating glass card top-right
          glassCard('65%', '8%', w*0.28, h*0.18, 0.4, 3) +
          // pill badge bottom-right
          pill('70%', '78%', w*0.22, 12*s, 'linear-gradient(90deg,'+accent+','+accent2+')', 0.25, -5) +
          // small app icon
          appIcon('82%', '55%', 22*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.2) +
          // tag outline
          tag('60%', '50%', w*0.15, 10*s, accent, 0.15, 2) +
          // L-bracket top-right
          '<div style="position:absolute;top:6%;right:6%;width:'+30*s+'px;height:1px;background:'+accent+';opacity:0.25"></div>' +
          '<div style="position:absolute;top:6%;right:6%;width:1px;height:'+30*s+'px;background:'+accent+';opacity:0.25"></div>' +
          // L-bracket bottom-left
          '<div style="position:absolute;bottom:6%;left:6%;width:'+30*s+'px;height:1px;background:'+accent2+';opacity:0.2"></div>' +
          '<div style="position:absolute;bottom:6%;left:6%;width:1px;height:'+30*s+'px;background:'+accent2+';opacity:0.2"></div>' +
          // subtle glow
          blob('75%', '15%', w*0.3, accent, 0.05, w*0.08) +
          microDots(6, accent, 0.1);
        break;
      }

      case 'bold': {
        var letter = (state.headline || 'B').charAt(0).toUpperCase();
        canvasDecorations.innerHTML =
          // giant letter
          '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'+state.typoHeadline.font+';font-size:'+(w*0.85)+'px;font-weight:900;color:'+accent+';opacity:0.05;line-height:1;pointer-events:none">'+letter+'</div>' +
          // floating glass card (top-right, tilted)
          glassCard('62%', '5%', w*0.3, h*0.2, 0.35, 5) +
          // floating glass card (bottom-left, tilted)
          glassCard('2%', '68%', w*0.25, h*0.16, 0.25, -4) +
          // gradient pills
          pill('8%', '12%', w*0.2, 14*s, 'linear-gradient(90deg,'+accent+','+accent2+')', 0.3, -8) +
          pill('65%', '82%', w*0.18, 12*s, 'linear-gradient(90deg,'+accent2+','+accent+')', 0.2, 5) +
          // app icon badges
          appIcon('5%', '5%', 28*s, accent, 0.35) +
          appIcon('88%', '5%', 20*s, accent2, 0.25) +
          appIcon('90%', '88%', 24*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.3) +
          appIcon('5%', '90%', 18*s, accent2, 0.2) +
          // glow orbs
          blob('-5%', '-5%', w*0.4, accent, 0.08, w*0.1) +
          blob('70%', '70%', w*0.35, accent2, 0.06, w*0.09) +
          microDots(8, accent, 0.1);
        break;
      }

      case 'gradient': {
        canvasDecorations.innerHTML =
          // large blobs
          blob('-10%', '-15%', w*0.7, accent, 0.2, w*0.15) +
          blob('60%', '60%', w*0.6, accent2, 0.16, w*0.13) +
          blob('-5%', '40%', w*0.35, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.1, w*0.08) +
          // floating glass cards
          glassCard('60%', '5%', w*0.32, h*0.22, 0.35, 6) +
          glassCard('3%', '70%', w*0.28, h*0.18, 0.25, -5) +
          // gradient pills
          pill('5%', '8%', w*0.24, 14*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.5),rgba('+accent2Rgb+',0.4))', 0.5, -6) +
          pill('55%', '85%', w*0.2, 12*s, 'linear-gradient(90deg,rgba('+accent2Rgb+',0.4),rgba('+accentRgb+',0.3))', 0.4, 4) +
          // app icons
          appIcon('85%', '35%', 26*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.3) +
          appIcon('8%', '55%', 20*s, accent2, 0.2) +
          // tag
          tag('70%', '55%', w*0.18, 10*s, accent, 0.2, -3) +
          // mesh overlay
          '<div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba('+accentRgb+',0.06),transparent 40%,transparent 60%,rgba('+accent2Rgb+',0.04))"></div>' +
          microDots(10, accent2, 0.08);
        break;
      }

      case 'split': {
        canvasDecorations.innerHTML =
          // divider
          '<div style="position:absolute;top:0;bottom:0;left:58%;width:3px;background:linear-gradient(180deg,transparent 5%,'+accent+' 30%,'+accent2+' 70%,transparent 95%);opacity:0.5"></div>' +
          // right panel gradient
          '<div style="position:absolute;top:0;bottom:0;left:58%;right:0;background:linear-gradient(90deg,rgba('+accentRgb+',0.04),rgba('+accent2Rgb+',0.08))"></div>' +
          // glass card on right side
          glassCard('62%', '12%', w*0.32, h*0.25, 0.35, 2) +
          // second glass card on right (smaller)
          glassCard('65%', '55%', w*0.26, h*0.18, 0.25, -3) +
          // pill badge on right
          pill('64%', '82%', w*0.22, 12*s, 'linear-gradient(90deg,'+accent+','+accent2+')', 0.3, 0) +
          // app icon on right
          appIcon('88%', '42%', 22*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.3) +
          // divider junction dots
          '<div style="position:absolute;top:25%;left:58%;transform:translateX(-50%);width:8px;height:8px;border-radius:50%;background:'+accent+';opacity:0.35"></div>' +
          '<div style="position:absolute;top:50%;left:58%;transform:translateX(-50%);width:6px;height:6px;border-radius:50%;background:'+accent2+';opacity:0.3"></div>' +
          '<div style="position:absolute;top:75%;left:58%;transform:translateX(-50%);width:8px;height:8px;border-radius:50%;background:'+accent+';opacity:0.35"></div>' +
          // left side glow
          blob('10%', '20%', w*0.35, accent, 0.04, w*0.08) +
          microDots(5, accent, 0.08);
        break;
      }

      case 'editorial': {
        canvasDecorations.innerHTML =
          // double lines top
          '<div style="position:absolute;top:6%;left:10%;right:10%;height:1px;background:'+accent+';opacity:0.35"></div>' +
          '<div style="position:absolute;top:calc(6% + 4px);left:10%;right:10%;height:1px;background:'+accent+';opacity:0.15"></div>' +
          // double lines bottom
          '<div style="position:absolute;bottom:6%;left:10%;right:10%;height:1px;background:'+accent+';opacity:0.35"></div>' +
          '<div style="position:absolute;bottom:calc(6% + 4px);left:10%;right:10%;height:1px;background:'+accent+';opacity:0.15"></div>' +
          // diamonds
          '<div style="position:absolute;top:6%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:10px;height:10px;background:'+accent+';opacity:0.5"></div>' +
          '<div style="position:absolute;bottom:6%;left:50%;transform:translate(-50%,50%) rotate(45deg);width:8px;height:8px;border:1px solid '+accent+';opacity:0.35"></div>' +
          // side accents
          '<div style="position:absolute;top:50%;left:6%;width:1px;height:50px;background:'+accent+';opacity:0.2;transform:translateY(-50%)"></div>' +
          '<div style="position:absolute;top:50%;right:6%;width:1px;height:50px;background:'+accent+';opacity:0.2;transform:translateY(-50%)"></div>' +
          // corner flourishes
          '<div style="position:absolute;top:6%;left:10%;width:20px;height:1px;background:'+accent2+';opacity:0.4;transform:rotate(-45deg);transform-origin:left"></div>' +
          '<div style="position:absolute;top:6%;right:10%;width:20px;height:1px;background:'+accent2+';opacity:0.4;transform:rotate(45deg);transform-origin:right"></div>' +
          // dot cluster top-right
          (function(){ var d=''; for(var r=0;r<3;r++) for(var c=0;c<3;c++) d+='<div style="position:absolute;top:'+(11+r*2)+'%;right:'+(13+c*2)+'%;width:3px;height:3px;border-radius:50%;background:'+accent+';opacity:0.12"></div>'; return d; })() +
          // dot cluster bottom-left
          (function(){ var d=''; for(var r=0;r<3;r++) for(var c=0;c<3;c++) d+='<div style="position:absolute;bottom:'+(11+r*2)+'%;left:'+(13+c*2)+'%;width:3px;height:3px;border-radius:50%;background:'+accent2+';opacity:0.1"></div>'; return d; })();
        break;
      }

      case 'glass': {
        canvasDecorations.innerHTML =
          // large orbs behind glass
          blob('5%', '0%', w*0.5, accent, 0.25, w*0.12) +
          blob('55%', '55%', w*0.45, accent2, 0.2, w*0.1) +
          blob('60%', '10%', w*0.25, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.12, w*0.06) +
          // floating glass card (top-left corner, behind main panel)
          glassCard('-5%', '-3%', w*0.35, h*0.22, 0.3, -8) +
          // floating glass card (bottom-right, behind main panel)
          glassCard('72%', '75%', w*0.3, h*0.2, 0.25, 6) +
          // gradient pills floating around
          pill('2%', '60%', w*0.2, 12*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.4),rgba('+accent2Rgb+',0.3))', 0.4, -12) +
          pill('72%', '10%', w*0.18, 10*s, 'linear-gradient(90deg,rgba('+accent2Rgb+',0.35),rgba('+accentRgb+',0.25))', 0.35, 8) +
          // app icon badges
          appIcon('-2%', '28%', 26*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.35) +
          appIcon('90%', '45%', 20*s, accent, 0.25) +
          appIcon('85%', '8%', 18*s, accent2, 0.2) +
          // small floating tag
          tag('5%', '88%', w*0.15, 10*s, accent2, 0.2, -5) +
          microDots(7, accent, 0.08);
        break;
      }

      case 'neon': {
        var ringSize = w * 0.45;
        canvasDecorations.innerHTML =
          // neon ring with glow
          '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:'+ringSize+'px;height:'+ringSize+'px;border-radius:50%;border:2px solid '+accent+';opacity:0.2;box-shadow:0 0 '+40*s+'px rgba('+accentRgb+',0.3),0 0 '+80*s+'px rgba('+accentRgb+',0.12),inset 0 0 '+40*s+'px rgba('+accentRgb+',0.1)"></div>' +
          // ring ripples
          '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:'+(ringSize*1.35)+'px;height:'+(ringSize*1.35)+'px;border-radius:50%;border:1px solid '+accent+';opacity:0.07"></div>' +
          '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:'+(ringSize*0.65)+'px;height:'+(ringSize*0.65)+'px;border-radius:50%;border:1px solid '+accent2+';opacity:0.1"></div>' +
          // crossed glow lines
          '<div style="position:absolute;top:50%;left:5%;right:5%;height:1px;background:linear-gradient(90deg,transparent,'+accent+',transparent);opacity:0.1;transform:translateY(-50%)"></div>' +
          '<div style="position:absolute;top:5%;bottom:5%;left:50%;width:1px;background:linear-gradient(180deg,transparent,'+accent+',transparent);opacity:0.1;transform:translateX(-50%)"></div>' +
          // floating pills
          pill('5%', '8%', w*0.22, 12*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.3),rgba('+accent2Rgb+',0.2))', 0.45, -10) +
          pill('65%', '85%', w*0.2, 10*s, 'linear-gradient(90deg,rgba('+accent2Rgb+',0.25),rgba('+accentRgb+',0.2))', 0.35, 6) +
          // app icons with neon glow
          '<div style="position:absolute;top:5%;left:5%;width:'+24*s+'px;height:'+24*s+'px;border-radius:'+6*s+'px;background:'+accent+';opacity:0.3;box-shadow:0 0 '+16*s+'px rgba('+accentRgb+',0.4)"></div>' +
          '<div style="position:absolute;bottom:6%;right:6%;width:'+20*s+'px;height:'+20*s+'px;border-radius:'+5*s+'px;background:'+accent2+';opacity:0.25;box-shadow:0 0 '+12*s+'px rgba('+accent2Rgb+',0.35)"></div>' +
          // corner glow blobs
          blob('0%', '0%', w*0.15, accent, 0.08, w*0.05) +
          blob('82%', '82%', w*0.15, accent2, 0.08, w*0.05) +
          // floating tag
          tag('70%', '12%', w*0.18, 10*s, accent, 0.2, -4) +
          microDots(8, accent, 0.12);
        break;
      }

      case 'promo': {
        canvasDecorations.innerHTML =
          // gradient bars top/bottom
          '<div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,'+accent+','+accent2+');opacity:0.9"></div>' +
          '<div style="position:absolute;bottom:0;left:0;right:0;height:5px;background:linear-gradient(90deg,'+accent2+','+accent+');opacity:0.9"></div>' +
          // floating glass cards
          glassCard('62%', '6%', w*0.32, h*0.2, 0.3, 5) +
          glassCard('2%', '72%', w*0.28, h*0.16, 0.25, -4) +
          // gradient pills
          pill('5%', '10%', w*0.22, 14*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.4),rgba('+accent2Rgb+',0.3))', 0.45, -6) +
          pill('60%', '82%', w*0.2, 12*s, 'linear-gradient(90deg,rgba('+accent2Rgb+',0.35),rgba('+accentRgb+',0.25))', 0.35, 5) +
          // app icon badges
          appIcon('88%', '35%', 26*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.35) +
          appIcon('3%', '45%', 20*s, accent, 0.25) +
          appIcon('5%', '5%', 18*s, accent2, 0.2) +
          appIcon('88%', '88%', 22*s, accent, 0.25) +
          // floating circles
          '<div style="position:absolute;top:18%;right:8%;width:'+(w*0.08)+'px;height:'+(w*0.08)+'px;border-radius:50%;border:2px solid '+accent+';opacity:0.2"></div>' +
          '<div style="position:absolute;bottom:20%;left:10%;width:'+(w*0.06)+'px;height:'+(w*0.06)+'px;border-radius:50%;border:2px solid '+accent2+';opacity:0.15"></div>' +
          // spotlight
          '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:'+(w*0.5)+'px;height:'+(w*0.5)+'px;border-radius:50%;background:radial-gradient(circle,rgba('+accentRgb+',0.06),transparent 70%)"></div>' +
          microDots(6, accent, 0.08);
        break;
      }

      case 'quote': {
        canvasDecorations.innerHTML =
          // large quotes
          '<div style="position:absolute;top:6%;left:50%;transform:translateX(-50%);font-family:'+state.typoHeadline.font+';font-size:'+(w*0.4)+'px;color:'+accent+';opacity:0.12;line-height:1;pointer-events:none">\u201C</div>' +
          '<div style="position:absolute;bottom:8%;right:18%;font-family:'+state.typoHeadline.font+';font-size:'+(w*0.2)+'px;color:'+accent2+';opacity:0.08;line-height:1;pointer-events:none">\u201D</div>' +
          // thin frame
          '<div style="position:absolute;top:5%;left:5%;right:5%;bottom:5%;border:1px solid '+accent+';opacity:0.08;border-radius:6px"></div>' +
          // diamonds
          '<div style="position:absolute;top:5%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:10px;height:10px;background:'+accent+';opacity:0.35"></div>' +
          '<div style="position:absolute;bottom:5%;left:50%;transform:translate(-50%,50%) rotate(45deg);width:8px;height:8px;border:1px solid '+accent+';opacity:0.3"></div>' +
          // side gradient lines
          '<div style="position:absolute;top:25%;left:5%;width:1px;height:50%;background:linear-gradient(180deg,transparent,'+accent+',transparent);opacity:0.15"></div>' +
          '<div style="position:absolute;top:25%;right:5%;width:1px;height:50%;background:linear-gradient(180deg,transparent,'+accent2+',transparent);opacity:0.15"></div>' +
          // floating pills for richness
          pill('65%', '82%', w*0.2, 10*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.2),rgba('+accent2Rgb+',0.15))', 0.3, 4) +
          pill('8%', '12%', w*0.16, 8*s, 'linear-gradient(90deg,rgba('+accent2Rgb+',0.15),rgba('+accentRgb+',0.1))', 0.25, -3) +
          // app icons
          appIcon('85%', '10%', 18*s, accent, 0.2) +
          appIcon('5%', '85%', 16*s, accent2, 0.18) +
          '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:'+(w*0.4)+'px;height:'+(w*0.4)+'px;border-radius:50%;background:radial-gradient(circle,rgba('+accentRgb+',0.04),transparent 70%)"></div>';
        break;
      }

      case 'duotone': {
        canvasDecorations.innerHTML =
          // gradient mesh layers
          '<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba('+accentRgb+',0.15),transparent 35%,transparent 65%,rgba('+accent2Rgb+',0.12))"></div>' +
          '<div style="position:absolute;inset:0;background:linear-gradient(225deg,rgba('+accent2Rgb+',0.07),transparent 40%,transparent 60%,rgba('+accentRgb+',0.05))"></div>' +
          // blobs
          blob('-15%', '-20%', w*0.7, accent, 0.08, w*0.14) +
          blob('60%', '60%', w*0.5, accent2, 0.07, w*0.12) +
          // floating cards
          glassCard('60%', '5%', w*0.3, h*0.2, 0.3, 5) +
          glassCard('3%', '72%', w*0.26, h*0.16, 0.2, -4) +
          // pills
          pill('5%', '10%', w*0.2, 12*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.35),rgba('+accent2Rgb+',0.25))', 0.4, -5) +
          pill('68%', '82%', w*0.18, 10*s, 'linear-gradient(90deg,rgba('+accent2Rgb+',0.3),rgba('+accentRgb+',0.2))', 0.3, 3) +
          // app icons
          appIcon('88%', '35%', 22*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.25) +
          appIcon('3%', '48%', 18*s, accent2, 0.2) +
          microDots(8, accent2, 0.06);
        break;
      }

      case 'geometric': {
        canvasDecorations.innerHTML =
          // rounded square grid background
          roundedGrid(Math.round(28*s), Math.round(8*s), accent, 0.07) +
          // center fade for readability
          '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(26,23,20,0.8) 15%,transparent 65%)"></div>' +
          // large rotated square
          '<div style="position:absolute;top:6%;right:5%;width:'+(w*0.22)+'px;height:'+(w*0.22)+'px;border:2px solid '+accent+';opacity:0.2;transform:rotate(45deg)"></div>' +
          // medium circle
          '<div style="position:absolute;bottom:10%;left:5%;width:'+(w*0.15)+'px;height:'+(w*0.15)+'px;border-radius:50%;border:2px solid '+accent2+';opacity:0.15"></div>' +
          // floating glass card
          glassCard('60%', '55%', w*0.3, h*0.2, 0.3, 4) +
          // gradient pills
          pill('5%', '15%', w*0.2, 12*s, 'linear-gradient(90deg,'+accent+','+accent2+')', 0.25, -6) +
          pill('65%', '82%', w*0.18, 10*s, 'linear-gradient(90deg,'+accent2+','+accent+')', 0.2, 5) +
          // app icon
          appIcon('85%', '10%', 24*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.3) +
          appIcon('3%', '80%', 18*s, accent, 0.2) +
          // small filled shapes
          '<div style="position:absolute;top:40%;left:3%;width:'+(w*0.06)+'px;height:'+(w*0.06)+'px;background:'+accent+';opacity:0.08;transform:rotate(30deg)"></div>' +
          '<div style="position:absolute;top:30%;right:3%;width:0;height:0;border-left:'+(w*0.04)+'px solid transparent;border-right:'+(w*0.04)+'px solid transparent;border-bottom:'+(w*0.06)+'px solid '+accent2+';opacity:0.08"></div>' +
          // glow blobs
          blob('70%', '0%', w*0.3, accent, 0.05, w*0.08) +
          blob('0%', '70%', w*0.25, accent2, 0.04, w*0.06) +
          microDots(6, accent2, 0.07);
        break;
      }

      case 'typewriter': {
        var lines = '';
        for (var i = 0; i < 8; i++) {
          var ltop = 15 + (i * (70 / 8));
          lines += '<div style="position:absolute;top:'+ltop+'%;left:12%;right:8%;height:1px;background:'+accent+';opacity:0.06"></div>';
        }
        canvasDecorations.innerHTML = lines +
          // margin line
          '<div style="position:absolute;top:8%;bottom:8%;left:10%;width:2px;background:'+accent+';opacity:0.12"></div>' +
          // cursor bar
          '<div style="position:absolute;top:38%;left:14%;width:2px;height:'+(w*0.06)+'px;background:'+accent+';opacity:0.3"></div>' +
          // margin dots
          '<div style="position:absolute;top:20%;left:10%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:'+accent+';opacity:0.18"></div>' +
          '<div style="position:absolute;top:50%;left:10%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:'+accent+';opacity:0.18"></div>' +
          '<div style="position:absolute;top:80%;left:10%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:'+accent2+';opacity:0.15"></div>' +
          // floating card (right side)
          glassCard('65%', '15%', w*0.28, h*0.18, 0.25, 3) +
          // pill tag
          pill('60%', '75%', w*0.2, 10*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.2),rgba('+accent2Rgb+',0.15))', 0.3, -3) +
          // corner brackets
          '<div style="position:absolute;top:5%;right:5%;width:'+25*s+'px;height:1px;background:'+accent+';opacity:0.2"></div>' +
          '<div style="position:absolute;top:5%;right:5%;width:1px;height:'+25*s+'px;background:'+accent+';opacity:0.2"></div>' +
          '<div style="position:absolute;bottom:5%;right:5%;width:'+25*s+'px;height:1px;background:'+accent2+';opacity:0.15"></div>' +
          '<div style="position:absolute;bottom:5%;right:5%;width:1px;height:'+25*s+'px;background:'+accent2+';opacity:0.15"></div>' +
          // small app icon
          appIcon('85%', '50%', 18*s, accent, 0.2);
        break;
      }

      case 'blobs': {
        canvasDecorations.innerHTML =
          // rich blobs
          blob('0%', '-10%', w*0.6, accent, 0.25, w*0.14) +
          blob('50%', '55%', w*0.55, accent2, 0.22, w*0.12) +
          blob('40%', '25%', w*0.4, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.14, w*0.09) +
          blob('70%', '5%', w*0.25, accent, 0.1, w*0.06) +
          blob('10%', '70%', w*0.2, accent2, 0.12, w*0.05) +
          // floating glass cards
          glassCard('58%', '3%', w*0.35, h*0.22, 0.4, 6) +
          glassCard('0%', '72%', w*0.3, h*0.18, 0.3, -5) +
          // pills
          pill('3%', '10%', w*0.22, 14*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.45),rgba('+accent2Rgb+',0.35))', 0.5, -8) +
          pill('62%', '85%', w*0.2, 12*s, 'linear-gradient(90deg,rgba('+accent2Rgb+',0.4),rgba('+accentRgb+',0.3))', 0.4, 5) +
          // app icon badges
          appIcon('88%', '38%', 28*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.35) +
          appIcon('3%', '45%', 22*s, accent2, 0.25) +
          appIcon('85%', '82%', 18*s, accent, 0.2) +
          // tags
          tag('5%', '88%', w*0.16, 10*s, accent, 0.2, -4) +
          tag('72%', '55%', w*0.14, 8*s, accent2, 0.15, 3) +
          microDots(10, accent, 0.08);
        break;
      }

      case 'cards': {
        canvasDecorations.innerHTML =
          // orbs behind card
          blob('5%', '10%', w*0.45, accent, 0.2, w*0.1) +
          blob('50%', '50%', w*0.4, accent2, 0.18, w*0.09) +
          blob('60%', '5%', w*0.2, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.1, w*0.05) +
          // main glass card panel (from CSS)
          // additional floating cards around
          glassCard('-5%', '-3%', w*0.3, h*0.2, 0.3, -8) +
          glassCard('75%', '78%', w*0.28, h*0.18, 0.25, 6) +
          // gradient pills
          pill('3%', '65%', w*0.2, 12*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.4),rgba('+accent2Rgb+',0.3))', 0.4, -10) +
          pill('72%', '10%', w*0.18, 10*s, 'linear-gradient(90deg,rgba('+accent2Rgb+',0.35),rgba('+accentRgb+',0.25))', 0.35, 6) +
          // app icons
          appIcon('-3%', '30%', 24*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.35) +
          appIcon('90%', '48%', 20*s, accent, 0.25) +
          appIcon('88%', '5%', 18*s, accent2, 0.2) +
          appIcon('5%', '88%', 16*s, accent, 0.18) +
          // tags
          tag('5%', '10%', w*0.16, 10*s, accent2, 0.2, -4) +
          microDots(6, accent, 0.07);
        break;
      }

      case 'grid-pattern': {
        var dotSz = Math.max(2, w * 0.004);
        var gapSz = Math.max(16, w * 0.04);
        canvasDecorations.innerHTML =
          // rounded square grid
          roundedGrid(Math.round(30*s), Math.round(8*s), accent, 0.08) +
          // center fade
          '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(17,17,17,0.75) 15%,transparent 60%)"></div>' +
          // glow circles
          blob('65%', '65%', w*0.35, accent, 0.12, w*0.08) +
          blob('5%', '5%', w*0.25, accent2, 0.08, w*0.06) +
          // floating glass cards
          glassCard('60%', '5%', w*0.32, h*0.22, 0.35, 5) +
          glassCard('2%', '72%', w*0.28, h*0.16, 0.25, -4) +
          // pills
          pill('5%', '12%', w*0.2, 12*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.3),rgba('+accent2Rgb+',0.2))', 0.35, -5) +
          pill('65%', '82%', w*0.18, 10*s, 'linear-gradient(90deg,rgba('+accent2Rgb+',0.25),rgba('+accentRgb+',0.2))', 0.3, 4) +
          // app icons
          appIcon('88%', '40%', 24*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.3) +
          appIcon('3%', '50%', 18*s, accent, 0.2) +
          // corner frames
          '<div style="position:absolute;top:3%;left:3%;width:'+20*s+'px;height:1px;background:'+accent+';opacity:0.25"></div>' +
          '<div style="position:absolute;top:3%;left:3%;width:1px;height:'+20*s+'px;background:'+accent+';opacity:0.25"></div>' +
          '<div style="position:absolute;bottom:3%;right:3%;width:'+20*s+'px;height:1px;background:'+accent2+';opacity:0.2"></div>' +
          '<div style="position:absolute;bottom:3%;right:3%;width:1px;height:'+20*s+'px;background:'+accent2+';opacity:0.2"></div>' +
          microDots(6, accent, 0.07);
        break;
      }

      case 'magazine': {
        canvasDecorations.innerHTML =
          // thick accent bar
          '<div style="position:absolute;top:9%;left:7%;width:'+(w*0.2)+'px;height:7px;background:linear-gradient(90deg,'+accent+','+accent2+');border-radius:3px;opacity:0.85"></div>' +
          '<div style="position:absolute;top:calc(9% + 14px);left:7%;width:'+(w*0.1)+'px;height:2px;background:'+accent2+';opacity:0.35;border-radius:1px"></div>' +
          // vertical rule right
          '<div style="position:absolute;top:8%;right:11%;bottom:8%;width:1px;background:linear-gradient(180deg,transparent 5%,'+accent2+' 30%,'+accent+' 70%,transparent 95%);opacity:0.3"></div>' +
          // bottom rule
          '<div style="position:absolute;bottom:9%;left:7%;right:50%;height:1px;background:'+accent+';opacity:0.3"></div>' +
          // floating glass card
          glassCard('60%', '10%', w*0.32, h*0.25, 0.35, 4) +
          // screen frame mockup
          screenFrame('65%', '55%', w*0.22, h*0.28, accent, 0.2, -5) +
          // pills
          pill('5%', '78%', w*0.22, 12*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.35),rgba('+accent2Rgb+',0.25))', 0.4, -4) +
          // app icon
          appIcon('88%', '8%', 22*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.3) +
          appIcon('5%', '60%', 18*s, accent2, 0.2) +
          // glow
          blob('65%', '25%', w*0.25, accent, 0.05, w*0.06) +
          // tag
          tag('58%', '88%', w*0.18, 10*s, accent2, 0.2, 3) +
          microDots(5, accent, 0.06);
        break;
      }

      case 'poster': {
        var ch = (state.headline || 'A').charAt(0).toUpperCase();
        canvasDecorations.innerHTML =
          // giant letter
          '<div style="position:absolute;bottom:-12%;right:-8%;font-family:'+state.typoHeadline.font+';font-size:'+(w*1.2)+'px;font-weight:900;color:'+accent+';opacity:0.05;line-height:0.8;pointer-events:none;overflow:hidden">'+ch+'</div>' +
          // glow behind letter
          blob('50%', '50%', w*0.6, accent, 0.05, w*0.12) +
          // accent bars
          '<div style="position:absolute;top:6%;left:8%;width:'+(w*0.3)+'px;height:5px;background:linear-gradient(90deg,'+accent+','+accent2+');border-radius:3px;opacity:0.65"></div>' +
          '<div style="position:absolute;top:calc(6% + 10px);left:8%;width:'+(w*0.15)+'px;height:2px;background:'+accent+';opacity:0.25;border-radius:1px"></div>' +
          // floating glass cards
          glassCard('58%', '5%', w*0.35, h*0.22, 0.3, 5) +
          glassCard('60%', '65%', w*0.28, h*0.18, 0.25, -4) +
          // pills
          pill('5%', '80%', w*0.22, 12*s, 'linear-gradient(90deg,rgba('+accentRgb+',0.35),rgba('+accent2Rgb+',0.25))', 0.35, -5) +
          // app icons
          appIcon('88%', '40%', 24*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.3) +
          appIcon('5%', '5%', 20*s, accent, 0.25) +
          // corner frames
          '<div style="position:absolute;top:5%;right:5%;width:'+35*s+'px;height:1px;background:'+accent+';opacity:0.25"></div>' +
          '<div style="position:absolute;top:5%;right:5%;width:1px;height:'+35*s+'px;background:'+accent+';opacity:0.25"></div>' +
          '<div style="position:absolute;bottom:5%;left:5%;width:'+35*s+'px;height:1px;background:'+accent2+';opacity:0.2"></div>' +
          '<div style="position:absolute;bottom:5%;left:5%;width:1px;height:'+35*s+'px;background:'+accent2+';opacity:0.2"></div>' +
          microDots(6, accent, 0.06);
        break;
      }

      case 'layered': {
        canvasDecorations.innerHTML =
          // overlapping rectangles
          '<div style="position:absolute;top:10%;left:6%;width:'+(w*0.55)+'px;height:'+(h*0.45)+'px;border:2px solid '+accent+';opacity:0.12;transform:rotate(-6deg);border-radius:12px"></div>' +
          '<div style="position:absolute;top:16%;left:12%;width:'+(w*0.55)+'px;height:'+(h*0.45)+'px;border:2px solid '+accent2+';opacity:0.1;transform:rotate(4deg);border-radius:12px"></div>' +
          '<div style="position:absolute;top:20%;left:16%;width:'+(w*0.52)+'px;height:'+(h*0.4)+'px;background:linear-gradient(135deg,rgba('+accentRgb+',0.06),rgba('+accent2Rgb+',0.06));transform:rotate(-1deg);border-radius:12px"></div>' +
          // floating glass cards
          glassCard('58%', '5%', w*0.35, h*0.22, 0.35, 6) +
          glassCard('3%', '72%', w*0.28, h*0.16, 0.25, -5) +
          // pills
          pill('5%', '10%', w*0.2, 12*s, 'linear-gradient(90deg,'+accent+','+accent2+')', 0.3, -7) +
          pill('65%', '85%', w*0.18, 10*s, 'linear-gradient(90deg,'+accent2+','+accent+')', 0.25, 4) +
          // app icons
          appIcon('88%', '35%', 24*s, 'linear-gradient(135deg,'+accent+','+accent2+')', 0.3) +
          appIcon('3%', '48%', 20*s, accent, 0.25) +
          appIcon('85%', '82%', 16*s, accent2, 0.18) +
          // blobs
          blob('65%', '0%', w*0.3, accent, 0.06, w*0.08) +
          blob('0%', '65%', w*0.25, accent2, 0.05, w*0.06) +
          microDots(7, accent, 0.07);
        break;
      }

      default:
        break;
    }
  }

  // ============ RESTORE FROM STATE ============
  function restoreFromState() {
    // Format
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.classList.toggle('active',
        parseInt(btn.dataset.w) === state.format.w && parseInt(btn.dataset.h) === state.format.h);
    });

    // Template
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.template === state.template);
    });

    // Text inputs
    const ih = document.getElementById('input-headline');
    const is = document.getElementById('input-subline');
    const ib = document.getElementById('input-body');
    const ic = document.getElementById('input-cta');
    if (ih) ih.value = state.headline;
    if (is) is.value = state.subline;
    if (ib) ib.value = state.body;
    if (ic) ic.value = state.cta;

    // Typography headline
    if (typoHeadlineFont) typoHeadlineFont.value = state.typoHeadline.font;
    if (typoHeadlineSize) { typoHeadlineSize.value = state.typoHeadline.size; if (typoHeadlineSizeVal) typoHeadlineSizeVal.textContent = state.typoHeadline.size; }
    if (typoHeadlineWeight) typoHeadlineWeight.value = state.typoHeadline.weight;
    if (typoHeadlineLh) { typoHeadlineLh.value = state.typoHeadline.lh; if (typoHeadlineLhVal) typoHeadlineLhVal.textContent = (state.typoHeadline.lh / 100).toFixed(1); }
    if (typoHeadlineLs) { typoHeadlineLs.value = state.typoHeadline.ls; if (typoHeadlineLsVal) typoHeadlineLsVal.textContent = state.typoHeadline.ls; }

    // Alignment buttons
    document.querySelectorAll('.align-btn[data-target="headline"]').forEach(b => b.classList.toggle('active', b.dataset.align === state.typoHeadline.align));

    // Case buttons
    document.querySelectorAll('.case-btn').forEach(b => b.classList.toggle('active', b.dataset.case === state.typoHeadline.case));

    // Typography body
    if (typoBodyFont) typoBodyFont.value = state.typoBody.font;
    if (typoBodySize) { typoBodySize.value = state.typoBody.size; if (typoBodySizeVal) typoBodySizeVal.textContent = state.typoBody.size; }
    if (typoBodyWeight) typoBodyWeight.value = state.typoBody.weight;

    // Body alignment & line height
    document.querySelectorAll('.align-btn[data-target="body"]').forEach(function(b) { b.classList.toggle('active', b.dataset.align === (state.typoBody.align || 'left')); });
    if (typoBodyLh) { typoBodyLh.value = state.typoBody.lh || 160; if (typoBodyLhVal) typoBodyLhVal.textContent = ((state.typoBody.lh || 160) / 100).toFixed(1); }

    // Typography subline
    var ss = state.typoSubline || { size: 14, weight: '400', ls: 0 };
    if (typoSublineSize) { typoSublineSize.value = ss.size; if (typoSublineSizeVal) typoSublineSizeVal.textContent = ss.size; }
    if (typoSublineWeight) typoSublineWeight.value = ss.weight;
    if (typoSublineLs) { typoSublineLs.value = ss.ls || 0; if (typoSublineLsVal) typoSublineLsVal.textContent = ss.ls || 0; }

    // Typography CTA
    var cs = state.typoCta || { size: 12, weight: '500' };
    if (typoCtaSize) { typoCtaSize.value = cs.size; if (typoCtaSizeVal) typoCtaSizeVal.textContent = cs.size; }
    if (typoCtaWeight) typoCtaWeight.value = cs.weight;

    // CTA style
    document.querySelectorAll('.cta-style-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.style === (state.ctaStyle || 'text')); });

    // Custom element colors
    if (headlineColorInput) headlineColorInput.value = state.headlineColor || state.textColor || '#ffffff';
    if (sublineColorInput) sublineColorInput.value = state.sublineColor || state.textColor || '#ffffff';
    if (bodyColorInput) bodyColorInput.value = state.bodyColor || state.textColor || '#ffffff';
    if (ctaBgColorInput) ctaBgColorInput.value = state.ctaBgColor || state.accentColor || '#c4622a';
    if (ctaTextColorInput) ctaTextColorInput.value = state.ctaTextColor || '#ffffff';

    // CTA letter spacing
    var ctaLs = (state.typoCta && state.typoCta.ls) || 0;
    if (typoCtaLs) { typoCtaLs.value = ctaLs; if (typoCtaLsVal) typoCtaLsVal.textContent = ctaLs; }

    // Colors
    document.getElementById('color-bg').value = state.bgColor;
    document.getElementById('color-text').value = state.textColor;
    document.getElementById('color-accent').value = state.accentColor;
    const accent2El = document.getElementById('color-accent2');
    if (accent2El) accent2El.value = state.accentColor2 || '#e8a87c';

    // Style pack
    document.querySelectorAll('.style-pack-btn').forEach(b => b.classList.toggle('active', b.dataset.pack === state.stylePack));

    // Gradient
    if (optGradient) optGradient.checked = state.gradient.enabled;
    if (gradientControls) gradientControls.style.display = state.gradient.enabled ? '' : 'none';
    if (gradientAngle) { gradientAngle.value = state.gradient.angle; if (gradientAngleVal) gradientAngleVal.textContent = state.gradient.angle; }
    if (gradientStart) gradientStart.value = state.gradient.start;
    if (gradientEnd) gradientEnd.value = state.gradient.end;

    // Effects
    if (fxShadow) { fxShadow.value = state.fxShadow; if (fxShadowVal) fxShadowVal.textContent = state.fxShadow; }
    if (fxGlow) { fxGlow.value = state.fxGlow; if (fxGlowVal) fxGlowVal.textContent = state.fxGlow; }
    if (fxOutline) fxOutline.checked = state.fxOutline;

    // Gradient text
    if (fxGradientText) {
      fxGradientText.checked = state.fxGradientText;
      if (gradientTextControls) gradientTextControls.style.display = state.fxGradientText ? '' : 'none';
    }
    if (fxGradientStart) fxGradientStart.value = state.fxGradientStart;
    if (fxGradientEnd) fxGradientEnd.value = state.fxGradientEnd;
    if (fxGradientAngle) { fxGradientAngle.value = state.fxGradientAngle; if (fxGradientAngleVal) fxGradientAngleVal.textContent = state.fxGradientAngle; }

    // Background pattern
    document.querySelectorAll('.pattern-opt').forEach(function(b) { b.classList.toggle('active', b.dataset.pattern === (state.bgPattern || 'none')); });
    var showPatternControls = state.bgPattern && state.bgPattern !== 'none';
    if (patternOpacityField) patternOpacityField.style.display = showPatternControls ? '' : 'none';
    if (patternScaleField) patternScaleField.style.display = showPatternControls ? '' : 'none';
    if (patternColorField) patternColorField.style.display = showPatternControls ? '' : 'none';
    if (patternOpacity) { patternOpacity.value = state.bgPatternOpacity || 15; if (patternOpacityVal) patternOpacityVal.textContent = state.bgPatternOpacity || 15; }
    if (patternScale) { patternScale.value = state.bgPatternScale || 20; if (patternScaleVal) patternScaleVal.textContent = state.bgPatternScale || 20; }
    if (patternColorInput) patternColorInput.value = state.bgPatternColor || state.textColor || '#ffffff';

    // Options
    document.getElementById('opt-logo').checked = state.showLogo;
    document.getElementById('opt-border').checked = state.showBorder;
    document.getElementById('opt-grain').checked = state.showGrain;
    document.getElementById('opt-vignette').checked = state.showVignette;

    // Border style
    document.querySelectorAll('.border-style-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.bstyle === (state.borderStyle || 'classic')); });
    var bsf = document.getElementById('border-style-field');
    if (bsf) bsf.style.display = state.showBorder ? '' : 'none';

    // Logo scale
    if (logoScaleSlider) { logoScaleSlider.value = state.logoScale || 100; if (logoScaleVal) logoScaleVal.textContent = state.logoScale || 100; }

    // Canvas padding
    var padVal = state.canvasPadding || 10;
    if (canvasPaddingSlider) { canvasPaddingSlider.value = padVal; if (canvasPaddingVal) canvasPaddingVal.textContent = padVal + '%'; }
    document.querySelectorAll('.padding-preset').forEach(function(b) { b.classList.toggle('active', parseInt(b.dataset.pad) === padVal); });

    // Element opacities
    opSliders.forEach(function(cfg) {
      var slider = document.getElementById(cfg.id);
      var valEl = document.getElementById(cfg.valId);
      var v = state[cfg.key] != null ? state[cfg.key] : 100;
      if (slider) slider.value = v;
      if (valEl) valEl.textContent = v + '%';
    });

    // Headline rotation
    if (headlineRotSlider) { headlineRotSlider.value = state.headlineRotation || 0; if (headlineRotVal) headlineRotVal.textContent = (state.headlineRotation || 0) + '\u00b0'; }

    // Headline decoration
    document.querySelectorAll('.hdeco-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.deco === (state.headlineDecoration || 'none')); });

    // Shadow fine controls
    var sfCtrl = document.getElementById('shadow-fine-controls');
    if (sfCtrl) sfCtrl.style.display = state.fxShadow > 0 ? '' : 'none';
    if (shadowXSlider) { shadowXSlider.value = state.textShadowX || 0; if (shadowXVal) shadowXVal.textContent = state.textShadowX || 0; }
    if (shadowYSlider) { shadowYSlider.value = state.textShadowY != null ? state.textShadowY : 2; if (shadowYVal) shadowYVal.textContent = state.textShadowY != null ? state.textShadowY : 2; }
    if (shadowColorInput) shadowColorInput.value = state.textShadowColor || '#000000';

    // Vertical content alignment
    document.querySelectorAll('.valign-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.valign === (state.contentAlign || 'start')); });

    // BG overlay
    if (bgOverlayColorInput) bgOverlayColorInput.value = state.bgOverlayColor || '#000000';
    if (bgOverlayOpacityInput) { bgOverlayOpacityInput.value = state.bgOverlayOpacity || 0; if (bgOverlayOpacityVal) bgOverlayOpacityVal.textContent = state.bgOverlayOpacity || 0; }

    // Element visibility toggles
    if (toggleSubline) toggleSubline.checked = state.showSubline !== false;
    if (toggleBody) toggleBody.checked = state.showBody !== false;
    if (toggleCta) toggleCta.checked = state.showCta !== false;
    var slineField = document.getElementById('subline-style-field');
    if (slineField) slineField.style.display = state.showSubline !== false ? '' : 'none';

    // Subline style
    document.querySelectorAll('.sline-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.sline === (state.sublineStyle || 'text')); });

    // BG position/size
    document.querySelectorAll('.bgsize-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.bgsize === (state.bgSize || 'cover')); });
    document.querySelectorAll('.bgpos-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.bgpos === (state.bgPosition || 'center')); });

    // Stickers — restore counter to avoid ID conflicts
    if (state.stickers && state.stickers.length > 0) {
      var maxId = 0;
      state.stickers.forEach(function(s) {
        var num = parseInt((s.id || '').replace('stk-', ''), 10);
        if (num > maxId) maxId = num;
      });
      stickerIdCounter = maxId;
      selectedStickerId = null;
    }

    // BG image
    if (state.bgImage) {
      if (bgClearBtn) bgClearBtn.style.display = '';
      if (bgImageControls) bgImageControls.style.display = '';
      if (inputOpacity) { inputOpacity.value = state.bgOpacity; if (opacityVal) opacityVal.textContent = state.bgOpacity; }
      if (inputBlur) { inputBlur.value = state.bgBlur; if (blurVal) blurVal.textContent = state.bgBlur; }
      if (inputBrightness) { inputBrightness.value = state.bgBrightness; if (brightnessVal) brightnessVal.textContent = state.bgBrightness; }
      if (inputContrast) { inputContrast.value = state.bgContrast; if (contrastVal) contrastVal.textContent = state.bgContrast; }
      if (inputSaturation) { inputSaturation.value = state.bgSaturation; if (saturationVal) saturationVal.textContent = state.bgSaturation; }
    } else {
      if (bgClearBtn) bgClearBtn.style.display = 'none';
      if (bgImageControls) bgImageControls.style.display = 'none';
      if (bgInput) bgInput.value = '';
    }

    // Free layout
    if (optFreeLayout) optFreeLayout.checked = !!state.freeLayout;

    updateCanvas();
  }

  // ============ KEYBOARD SHORTCUTS ============
  document.addEventListener('keydown', e => {
    // Don't capture when typing in inputs
    const tag = e.target.tagName.toLowerCase();
    const isEditable = e.target.contentEditable === 'true';
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';

    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      redo();
    }
    if (e.ctrlKey && e.key === 'e' && !isInput && !isEditable) {
      e.preventDefault();
      if (exportFormat === 'gif' || exportFormat === 'webm') {
        exportAnimated();
      } else {
        exportCanvas();
      }
    }
    // ? key opens shortcuts modal
    if (e.key === '?' && !isInput && !isEditable) {
      e.preventDefault();
      var overlay = document.getElementById('shortcuts-overlay');
      if (overlay) overlay.classList.toggle('visible');
    }
  });

  // Shortcuts modal close
  var shortcutsOverlay = document.getElementById('shortcuts-overlay');
  var shortcutsClose = document.getElementById('shortcuts-close');
  if (shortcutsClose) shortcutsClose.addEventListener('click', function() {
    if (shortcutsOverlay) shortcutsOverlay.classList.remove('visible');
  });
  if (shortcutsOverlay) shortcutsOverlay.addEventListener('click', function(e) {
    if (e.target === shortcutsOverlay) shortcutsOverlay.classList.remove('visible');
  });

  // Shortcuts help button in canvas info bar
  var btnShortcutsHelp = document.getElementById('btn-shortcuts-help');
  if (btnShortcutsHelp) btnShortcutsHelp.addEventListener('click', function() {
    if (shortcutsOverlay) shortcutsOverlay.classList.toggle('visible');
  });

  // ============ HELPER ============
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r + ',' + g + ',' + b;
  }

  // ============ STICKER SYSTEM ============
  let selectedStickerId = null;
  let stickerIdCounter = 0;

  // Sticker library definitions — each generates html2canvas-compatible HTML
  const stickerDefs = {
    // ---- BADGES ----
    'pill-gradient': {
      name: 'Pill Gradient',
      cat: 'badges',
      w: 120, h: 32,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:999px;background:linear-gradient(90deg,'+accent+','+accent2+');box-shadow:0 4px 16px rgba(0,0,0,0.25)"></div>';
      }
    },
    'pill-outline': {
      name: 'Pill Outline',
      cat: 'badges',
      w: 110, h: 28,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:999px;border:2px solid '+accent+';display:flex;align-items:center;padding:0 12px;gap:6px"><div style="width:8px;height:8px;border-radius:50%;background:'+accent+'"></div><div style="flex:1;height:2px;background:'+accent+';opacity:0.4;border-radius:1px"></div></div>';
      }
    },
    'tag-label': {
      name: 'Tag',
      cat: 'badges',
      w: 80, h: 26,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:6px;background:'+accent+';display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2)"><div style="width:50%;height:2px;background:rgba(255,255,255,0.5);border-radius:1px"></div></div>';
      }
    },
    'badge-circle': {
      name: 'Badge',
      cat: 'badges',
      w: 48, h: 48,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,'+accent+','+accent2+');box-shadow:0 4px 16px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><div style="width:40%;height:2px;background:rgba(255,255,255,0.5);border-radius:1px"></div></div>';
      }
    },
    'chip-duo': {
      name: 'Chip Duo',
      cat: 'badges',
      w: 100, h: 28,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:999px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;gap:4px;padding:0 6px"><div style="width:16px;height:16px;border-radius:50%;background:'+accent+'"></div><div style="flex:1;height:2px;background:rgba(255,255,255,0.2);border-radius:1px"></div></div>';
      }
    },

    // ---- CARDS ----
    'glass-card-sm': {
      name: 'Glass Card',
      cat: 'cards',
      w: 140, h: 100,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);box-shadow:0 8px 32px rgba(0,0,0,0.3);overflow:hidden;padding:12%">' +
          '<div style="width:60%;height:3px;background:rgba(255,255,255,0.2);border-radius:2px;margin-bottom:10%"></div>' +
          '<div style="width:85%;height:2px;background:rgba(255,255,255,0.08);border-radius:1px;margin-bottom:6%"></div>' +
          '<div style="width:70%;height:2px;background:rgba(255,255,255,0.06);border-radius:1px;margin-bottom:12%"></div>' +
          '<div style="width:40%;height:18%;border-radius:999px;background:linear-gradient(90deg,rgba('+hexToRgb(accent)+',0.35),rgba('+hexToRgb(accent2)+',0.25))"></div>' +
        '</div>';
      }
    },
    'glass-card-lg': {
      name: 'Card Large',
      cat: 'cards',
      w: 180, h: 130,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);box-shadow:0 10px 40px rgba(0,0,0,0.3);overflow:hidden">' +
          '<div style="width:100%;height:35%;background:linear-gradient(135deg,rgba('+hexToRgb(accent)+',0.15),rgba('+hexToRgb(accent2)+',0.1))"></div>' +
          '<div style="padding:10% 12%">' +
            '<div style="width:55%;height:3px;background:rgba(255,255,255,0.18);border-radius:2px;margin-bottom:8%"></div>' +
            '<div style="width:80%;height:2px;background:rgba(255,255,255,0.07);border-radius:1px;margin-bottom:5%"></div>' +
            '<div style="width:65%;height:2px;background:rgba(255,255,255,0.05);border-radius:1px"></div>' +
          '</div>' +
        '</div>';
      }
    },
    'stat-card': {
      name: 'Stat Card',
      cat: 'cards',
      w: 100, h: 70,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);box-shadow:0 4px 16px rgba(0,0,0,0.2);padding:12%">' +
          '<div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,'+accent+','+accent2+');margin-bottom:8%;opacity:0.6"></div>' +
          '<div style="width:45%;height:3px;background:rgba(255,255,255,0.2);border-radius:2px;margin-bottom:6%"></div>' +
          '<div style="width:70%;height:2px;background:rgba(255,255,255,0.06);border-radius:1px"></div>' +
        '</div>';
      }
    },

    // ---- SHAPES ----
    'blob-accent': {
      name: 'Blob',
      cat: 'shapes',
      w: 120, h: 120,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:50%;background:'+accent+';opacity:0.5;filter:blur(20px)"></div>';
      }
    },
    'blob-gradient': {
      name: 'Blob Grad',
      cat: 'shapes',
      w: 140, h: 140,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,'+accent+','+accent2+');opacity:0.4;filter:blur(25px)"></div>';
      }
    },
    'circle-outline': {
      name: 'Cercle',
      cat: 'shapes',
      w: 80, h: 80,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:50%;border:2px solid '+accent+';opacity:0.4"></div>';
      }
    },
    'square-rotated': {
      name: 'Losange',
      cat: 'shapes',
      w: 60, h: 60,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border:2px solid '+accent+';opacity:0.3;border-radius:4px;transform:rotate(45deg)"></div>';
      }
    },
    'line-h': {
      name: 'Ligne H',
      cat: 'shapes',
      w: 120, h: 4,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;background:linear-gradient(90deg,'+accent+','+accent2+');border-radius:2px;opacity:0.6"></div>';
      }
    },
    'line-v': {
      name: 'Ligne V',
      cat: 'shapes',
      w: 4, h: 120,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;background:linear-gradient(180deg,'+accent+','+accent2+');border-radius:2px;opacity:0.6"></div>';
      }
    },
    'dots-grid': {
      name: 'Dots Grid',
      cat: 'shapes',
      w: 80, h: 80,
      render: function(s, accent, accent2) {
        var html = '';
        for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
          html += '<div style="position:absolute;top:'+(r*33)+'%;left:'+(c*33)+'%;width:4px;height:4px;border-radius:50%;background:'+accent+';opacity:0.3"></div>';
        }
        return '<div style="width:100%;height:100%;position:relative">' + html + '</div>';
      }
    },

    // ---- ICONS ----
    'app-icon': {
      name: 'App Icon',
      cat: 'icons',
      w: 50, h: 50,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:28%;background:linear-gradient(135deg,'+accent+','+accent2+');box-shadow:0 4px 20px rgba(0,0,0,0.3)"></div>';
      }
    },
    'app-icon-glass': {
      name: 'Icon Glass',
      cat: 'icons',
      w: 50, h: 50,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:28%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);box-shadow:0 4px 20px rgba(0,0,0,0.3)"><div style="position:absolute;top:30%;left:30%;width:40%;height:40%;border-radius:50%;background:linear-gradient(135deg,'+accent+','+accent2+');opacity:0.5"></div></div>';
      }
    },
    'diamond': {
      name: 'Diamant',
      cat: 'icons',
      w: 30, h: 30,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;background:'+accent+';transform:rotate(45deg);border-radius:3px;opacity:0.6;box-shadow:0 2px 8px rgba(0,0,0,0.2)"></div>';
      }
    },
    'star-4': {
      name: 'Etoile',
      cat: 'icons',
      w: 40, h: 40,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;position:relative"><div style="position:absolute;top:35%;left:0;right:0;height:30%;background:'+accent+';border-radius:999px;opacity:0.5"></div><div style="position:absolute;left:35%;top:0;bottom:0;width:30%;background:'+accent+';border-radius:999px;opacity:0.5"></div></div>';
      }
    },

    // ---- FRAMES ----
    'phone-frame': {
      name: 'Phone',
      cat: 'frames',
      w: 80, h: 140,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:14px;border:2px solid '+accent+';opacity:0.35;box-shadow:0 6px 24px rgba(0,0,0,0.2)">' +
          '<div style="position:absolute;top:5%;left:50%;transform:translateX(-50%);width:30%;height:3px;border-radius:2px;background:'+accent+';opacity:0.3"></div>' +
          '<div style="position:absolute;bottom:4%;left:50%;transform:translateX(-50%);width:22%;height:22%;border-radius:50%;border:1.5px solid '+accent+';opacity:0.2"></div>' +
        '</div>';
      }
    },
    'browser-frame': {
      name: 'Browser',
      cat: 'frames',
      w: 160, h: 110,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%;border-radius:10px;border:2px solid rgba(255,255,255,0.12);box-shadow:0 6px 24px rgba(0,0,0,0.2);overflow:hidden">' +
          '<div style="height:18%;background:rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;padding:0 8%">' +
            '<div style="width:6px;height:6px;border-radius:50%;background:#e53e3e;margin-right:3px;opacity:0.6"></div>' +
            '<div style="width:6px;height:6px;border-radius:50%;background:#f6ad55;margin-right:3px;opacity:0.6"></div>' +
            '<div style="width:6px;height:6px;border-radius:50%;background:#48bb78;opacity:0.6"></div>' +
          '</div>' +
          '<div style="padding:8%;display:flex;flex-direction:column;gap:6%">' +
            '<div style="width:60%;height:3px;background:rgba(255,255,255,0.1);border-radius:1px"></div>' +
            '<div style="width:85%;height:2px;background:rgba(255,255,255,0.06);border-radius:1px"></div>' +
            '<div style="width:40%;height:12%;border-radius:999px;background:linear-gradient(90deg,rgba('+hexToRgb(accent)+',0.2),rgba('+hexToRgb(accent2)+',0.15))"></div>' +
          '</div>' +
        '</div>';
      }
    },
    'bracket-tl': {
      name: 'Bracket',
      cat: 'frames',
      w: 40, h: 40,
      render: function(s, accent, accent2) {
        return '<div style="width:100%;height:100%">' +
          '<div style="position:absolute;top:0;left:0;width:100%;height:2px;background:'+accent+';opacity:0.5"></div>' +
          '<div style="position:absolute;top:0;left:0;width:2px;height:100%;background:'+accent+';opacity:0.5"></div>' +
        '</div>';
      }
    },
    'rounded-grid': {
      name: 'Grid BG',
      cat: 'frames',
      w: 150, h: 150,
      render: function(s, accent, accent2) {
        var html = '';
        for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) {
          html += '<div style="position:absolute;top:'+(r*22)+'%;left:'+(c*22)+'%;width:18%;height:18%;border-radius:25%;border:1px solid '+accent+';opacity:0.1"></div>';
        }
        return '<div style="width:100%;height:100%;position:relative">' + html + '</div>';
      }
    },
  };

  // Populate sticker library in sidebar
  const stickerLibrary = document.getElementById('sticker-library');
  const placedList = document.getElementById('placed-stickers-list');
  const stickerEmpty = document.getElementById('sticker-empty');
  const btnClearStickers = document.getElementById('btn-clear-stickers');

  function populateStickerLibrary(filter) {
    if (!stickerLibrary) return;
    stickerLibrary.innerHTML = '';
    Object.keys(stickerDefs).forEach(function(key) {
      var def = stickerDefs[key];
      if (filter && filter !== 'all' && def.cat !== filter) return;
      var item = document.createElement('div');
      item.className = 'sticker-lib-item';
      item.dataset.sticker = key;
      // Mini preview using the render function
      var previewHtml = def.render(1, state.accentColor, state.accentColor2 || '#e8a87c');
      item.innerHTML = '<div class="sticker-lib-item__preview" style="position:relative">' + previewHtml + '</div>' +
        '<span class="sticker-lib-item__name">' + def.name + '</span>';
      item.addEventListener('click', function() { addSticker(key); });
      stickerLibrary.appendChild(item);
    });
  }

  // Category filter buttons
  document.querySelectorAll('.sticker-cat-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.sticker-cat-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      populateStickerLibrary(btn.dataset.cat);
    });
  });

  populateStickerLibrary('all');

  function addSticker(defKey) {
    var def = stickerDefs[defKey];
    if (!def) return;
    var cw = canvas.offsetWidth;
    var ch = canvas.offsetHeight;
    var sScale = cw / 540;
    var sw = def.w * sScale;
    var sh = def.h * sScale;
    // Place near center with slight randomization
    var x = ((cw - sw) / 2 + (Math.random() - 0.5) * cw * 0.2) / cw * 100;
    var y = ((ch - sh) / 2 + (Math.random() - 0.5) * ch * 0.2) / ch * 100;
    var sticker = {
      id: 'stk-' + (++stickerIdCounter),
      type: defKey,
      x: Math.max(0, Math.min(90, x)),
      y: Math.max(0, Math.min(90, y)),
      w: sw,
      h: sh,
      rotation: 0,
      opacity: 1,
      layer: 'above',
    };
    state.stickers.push(sticker);
    renderStickers();
    selectSticker(sticker.id);
    pushHistory();
    scheduleAutoSave();
  }

  function renderStickers() {
    if (!canvasStickers) return;
    canvasStickers.innerHTML = '';
    if (canvasStickersBelow) canvasStickersBelow.innerHTML = '';
    var accent = state.accentColor;
    var accent2 = state.accentColor2 || '#e8a87c';
    var cw = canvas.offsetWidth;
    var sScale = cw / 540;

    state.stickers.forEach(function(stk) {
      // Migration: default layer to 'above'
      if (!stk.layer) stk.layer = 'above';

      var def = stickerDefs[stk.type];
      var isAiImage = stk.type === 'ai-image';
      var isSvgAnim = stk.type === 'svg-animation';
      var isSvgUpload = stk.type === 'svg-upload';
      if (!def && !isAiImage && !isSvgAnim && !isSvgUpload) return;

      var el = document.createElement('div');
      el.className = 'sticker-item' + (stk.id === selectedStickerId ? ' selected' : '');
      el.dataset.stickerId = stk.id;
      el.style.left = stk.x + '%';
      el.style.top = stk.y + '%';
      el.style.width = stk.w + 'px';
      el.style.height = stk.h + 'px';
      var flipScale = stk.flipH ? ' scaleX(-1)' : '';
      el.style.transform = 'rotate(' + (stk.rotation || 0) + 'deg)' + flipScale;
      el.style.opacity = stk.opacity;

      // Render content — AI images use <img>, SVG animations/uploads use inline SVG, others use CSS-only render
      var contentHtml;
      if (isSvgAnim || isSvgUpload) {
        contentHtml = '<div class="svg-anim-wrapper" style="width:100%;height:100%;pointer-events:none;overflow:hidden">' + (stk.svgCode || '') + '</div>';
      } else if (isAiImage) {
        contentHtml = '<img src="' + stk.imageUrl + '" style="width:100%;height:100%;object-fit:contain;pointer-events:none" crossorigin="anonymous">';
      } else {
        contentHtml = def.render(sScale, accent, accent2);
      }

      el.innerHTML = contentHtml +
        '<div class="sticker-handle sticker-handle--tl" data-handle="tl"></div>' +
        '<div class="sticker-handle sticker-handle--tr" data-handle="tr"></div>' +
        '<div class="sticker-handle sticker-handle--bl" data-handle="bl"></div>' +
        '<div class="sticker-handle sticker-handle--br" data-handle="br"></div>' +
        '<div class="sticker-handle--rotate" data-handle="rotate"></div>' +
        '<div class="sticker-delete" data-action="delete">&times;</div>';

      // Drag
      el.addEventListener('mousedown', function(e) {
        if (e.target.dataset.handle || e.target.dataset.action) return;
        e.preventDefault();
        selectSticker(stk.id);
        startDrag(stk, e);
      });

      // Resize handles
      el.querySelectorAll('.sticker-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          startResize(stk, e, handle.dataset.handle);
        });
      });

      // Rotate handle
      var rotHandle = el.querySelector('.sticker-handle--rotate');
      if (rotHandle) {
        rotHandle.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          startRotate(stk, e);
        });
      }

      // Delete
      var delBtn = el.querySelector('.sticker-delete');
      if (delBtn) {
        delBtn.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          removeSticker(stk.id);
        });
      }

      // Append to correct container based on layer
      if (stk.layer === 'below' && canvasStickersBelow) {
        canvasStickersBelow.appendChild(el);
      } else {
        canvasStickers.appendChild(el);
      }
    });

    updatePlacedList();
    updateLayersPanel();
  }

  function selectSticker(id) {
    selectedStickerId = id;
    // Update classes in both containers
    [canvasStickers, canvasStickersBelow].forEach(function(container) {
      if (!container) return;
      container.querySelectorAll('.sticker-item').forEach(function(el) {
        el.classList.toggle('selected', el.dataset.stickerId === id);
      });
    });
    // Elevate below-stickers container if selected sticker is below
    var stk = id ? state.stickers.find(function(s) { return s.id === id; }) : null;
    if (canvasStickersBelow) {
      canvasStickersBelow.classList.toggle('elevated', !!(stk && stk.layer === 'below'));
    }
    // Update placed list
    document.querySelectorAll('.placed-sticker-row').forEach(function(row) {
      row.classList.toggle('active', row.dataset.stickerId === id);
    });
    // Update layers panel
    document.querySelectorAll('.layer-row').forEach(function(row) {
      row.classList.toggle('active', row.dataset.stickerId === id);
    });
  }

  function deselectStickers() {
    selectedStickerId = null;
    [canvasStickers, canvasStickersBelow].forEach(function(container) {
      if (!container) return;
      container.querySelectorAll('.sticker-item').forEach(function(el) {
        el.classList.remove('selected');
      });
    });
    if (canvasStickersBelow) canvasStickersBelow.classList.remove('elevated');
    document.querySelectorAll('.placed-sticker-row').forEach(function(row) {
      row.classList.remove('active');
    });
    document.querySelectorAll('.layer-row').forEach(function(row) {
      row.classList.remove('active');
    });
  }

  function removeSticker(id) {
    state.stickers = state.stickers.filter(function(s) { return s.id !== id; });
    if (selectedStickerId === id) selectedStickerId = null;
    renderStickers();
    pushHistory();
    scheduleAutoSave();
  }

  // Find sticker element across both containers
  function findStickerEl(id) {
    var el = canvasStickers ? canvasStickers.querySelector('[data-sticker-id="' + id + '"]') : null;
    if (!el && canvasStickersBelow) el = canvasStickersBelow.querySelector('[data-sticker-id="' + id + '"]');
    return el;
  }

  // Drag sticker
  function startDrag(stk, startEvt) {
    var el = findStickerEl(stk.id);
    if (!el) return;
    el.classList.add('dragging');

    var cRect = canvas.getBoundingClientRect();
    var startX = startEvt.clientX;
    var startY = startEvt.clientY;
    var origX = stk.x;
    var origY = stk.y;

    function onMove(e) {
      var dx = (e.clientX - startX) / cRect.width * 100;
      var dy = (e.clientY - startY) / cRect.height * 100;
      stk.x = Math.max(-20, Math.min(120, origX + dx));
      stk.y = Math.max(-20, Math.min(120, origY + dy));
      el.style.left = stk.x + '%';
      el.style.top = stk.y + '%';
    }
    function onUp() {
      el.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      pushHistory();
      scheduleAutoSave();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // Resize sticker
  function startResize(stk, startEvt, handle) {
    var el = findStickerEl(stk.id);
    if (!el) return;

    var startX = startEvt.clientX;
    var startY = startEvt.clientY;
    var origW = stk.w;
    var origH = stk.h;
    var aspect = origW / origH;

    function onMove(e) {
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var delta;
      if (handle === 'br') delta = Math.max(dx, dy);
      else if (handle === 'bl') delta = Math.max(-dx, dy);
      else if (handle === 'tr') delta = Math.max(dx, -dy);
      else delta = Math.max(-dx, -dy);

      var newW = Math.max(20, origW + delta);
      var newH = newW / aspect;
      stk.w = newW;
      stk.h = newH;
      el.style.width = newW + 'px';
      el.style.height = newH + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      pushHistory();
      scheduleAutoSave();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // Rotate sticker
  function startRotate(stk, startEvt) {
    var el = findStickerEl(stk.id);
    if (!el) return;

    var rect = el.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var startAngle = Math.atan2(startEvt.clientY - cy, startEvt.clientX - cx) * 180 / Math.PI;
    var origRot = stk.rotation || 0;

    function onMove(e) {
      var angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
      var diff = angle - startAngle;
      stk.rotation = Math.round(origRot + diff);
      el.style.transform = 'rotate(' + stk.rotation + 'deg)';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      pushHistory();
      scheduleAutoSave();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // Update placed stickers list in sidebar
  function updatePlacedList() {
    if (!placedList) return;
    var stickers = state.stickers;
    if (stickers.length === 0) {
      placedList.innerHTML = '<p class="sticker-empty">Aucun sticker place</p>';
      if (btnClearStickers) btnClearStickers.style.display = 'none';
      return;
    }
    if (btnClearStickers) btnClearStickers.style.display = '';
    placedList.innerHTML = '';
    stickers.forEach(function(stk) {
      var def = stickerDefs[stk.type];
      var stickerName = stk.type === 'ai-image' ? 'AI Image' : stk.type === 'svg-upload' ? 'SVG Import' : stk.type === 'svg-animation' ? 'SVG Anim' : (def ? def.name : stk.type);
      var row = document.createElement('div');
      row.className = 'placed-sticker-row' + (stk.id === selectedStickerId ? ' active' : '');
      row.dataset.stickerId = stk.id;
      row.innerHTML = '<span class="placed-sticker-row__name">' + stickerName + '</span>' +
        '<span style="font-size:9px;color:var(--text-muted)">' + Math.round(stk.rotation || 0) + '°</span>' +
        '<button class="placed-sticker-row__delete" data-del="' + stk.id + '">&times;</button>';
      row.addEventListener('click', function(e) {
        if (e.target.dataset.del) return;
        selectSticker(stk.id);
      });
      row.querySelector('.placed-sticker-row__delete').addEventListener('click', function(e) {
        e.stopPropagation();
        removeSticker(stk.id);
      });
      placedList.appendChild(row);
    });
  }

  // ---- LAYERS PANEL ----
  function getStickerName(stk) {
    if (stk.type === 'ai-image') return 'AI Image';
    if (stk.type === 'svg-animation') return 'SVG Anim';
    if (stk.type === 'svg-upload') return 'SVG Import';
    var def = stickerDefs[stk.type];
    return def ? def.name : stk.type;
  }

  function updateLayersPanel() {
    if (!layersPanelBody) return;
    var stickers = state.stickers;
    if (stickers.length === 0) {
      layersPanelBody.innerHTML = '<div class="layers-panel__empty">Aucun element</div>';
      return;
    }

    var aboveStickers = [];
    var belowStickers = [];
    stickers.forEach(function(stk, idx) {
      if (!stk.layer) stk.layer = 'above';
      var obj = { stk: stk, idx: idx };
      if (stk.layer === 'below') belowStickers.push(obj);
      else aboveStickers.push(obj);
    });

    layersPanelBody.innerHTML = '';

    // Section: Above text
    var labelAbove = document.createElement('div');
    labelAbove.className = 'layers-panel__section-label';
    labelAbove.textContent = 'Devant le texte';
    layersPanelBody.appendChild(labelAbove);

    if (aboveStickers.length === 0) {
      var emptyAbove = document.createElement('div');
      emptyAbove.className = 'layers-panel__empty';
      emptyAbove.textContent = '\u2014';
      emptyAbove.style.padding = '4px 12px';
      layersPanelBody.appendChild(emptyAbove);
    } else {
      aboveStickers.forEach(function(item) { buildLayerRow(item.stk, item.idx, 'above'); });
    }

    // Separator: text content
    var sep = document.createElement('div');
    sep.className = 'layers-panel__separator';
    sep.textContent = 'Contenu texte';
    layersPanelBody.appendChild(sep);

    // Section: Below text
    var labelBelow = document.createElement('div');
    labelBelow.className = 'layers-panel__section-label';
    labelBelow.textContent = 'Derriere le texte';
    layersPanelBody.appendChild(labelBelow);

    if (belowStickers.length === 0) {
      var emptyBelow = document.createElement('div');
      emptyBelow.className = 'layers-panel__empty';
      emptyBelow.textContent = '\u2014';
      emptyBelow.style.padding = '4px 12px';
      layersPanelBody.appendChild(emptyBelow);
    } else {
      belowStickers.forEach(function(item) { buildLayerRow(item.stk, item.idx, 'below'); });
    }
  }

  function buildLayerRow(stk, globalIdx, group) {
    var row = document.createElement('div');
    row.className = 'layer-row' + (stk.id === selectedStickerId ? ' active' : '');
    row.dataset.stickerId = stk.id;

    // Up button
    var btnUp = document.createElement('button');
    btnUp.className = 'layer-row__btn';
    btnUp.title = 'Monter';
    btnUp.innerHTML = '<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 2v6M2.5 4.5L5 2l2.5 2.5"/></svg>';
    btnUp.addEventListener('click', function(e) { e.stopPropagation(); moveLayerInGroup(stk.id, -1); });

    // Down button
    var btnDown = document.createElement('button');
    btnDown.className = 'layer-row__btn';
    btnDown.title = 'Descendre';
    btnDown.innerHTML = '<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 8V2M2.5 5.5L5 8l2.5-2.5"/></svg>';
    btnDown.addEventListener('click', function(e) { e.stopPropagation(); moveLayerInGroup(stk.id, 1); });

    // Name
    var name = document.createElement('span');
    name.className = 'layer-row__name';
    name.textContent = getStickerName(stk);

    // Swap layer button (above<->below)
    var btnSwap = document.createElement('button');
    btnSwap.className = 'layer-row__btn layer-row__btn--swap';
    btnSwap.title = group === 'above' ? 'Passer derriere le texte' : 'Passer devant le texte';
    btnSwap.innerHTML = group === 'above'
      ? '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 2v8M3 7l3 3 3-3"/></svg>'
      : '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 10V2M3 5l3-3 3 3"/></svg>';
    btnSwap.addEventListener('click', function(e) { e.stopPropagation(); toggleStickerLayer(stk.id); });

    // Delete button
    var btnDel = document.createElement('button');
    btnDel.className = 'layer-row__btn layer-row__btn--del';
    btnDel.title = 'Supprimer';
    btnDel.innerHTML = '&times;';
    btnDel.addEventListener('click', function(e) { e.stopPropagation(); removeSticker(stk.id); });

    row.appendChild(btnUp);
    row.appendChild(btnDown);
    row.appendChild(name);
    row.appendChild(btnSwap);
    row.appendChild(btnDel);

    row.addEventListener('click', function() { selectSticker(stk.id); });

    layersPanelBody.appendChild(row);
  }

  function moveLayerInGroup(id, direction) {
    var stk = state.stickers.find(function(s) { return s.id === id; });
    if (!stk) return;
    var layer = stk.layer || 'above';

    // Get indices of stickers in same layer group (in global array order)
    var groupIndices = [];
    state.stickers.forEach(function(s, i) {
      if ((s.layer || 'above') === layer) groupIndices.push(i);
    });

    var posInGroup = -1;
    for (var g = 0; g < groupIndices.length; g++) {
      if (state.stickers[groupIndices[g]].id === id) { posInGroup = g; break; }
    }
    if (posInGroup < 0) return;

    var targetPosInGroup = posInGroup + direction;
    if (targetPosInGroup < 0 || targetPosInGroup >= groupIndices.length) return;

    // Swap in global array
    var fromIdx = groupIndices[posInGroup];
    var toIdx = groupIndices[targetPosInGroup];
    var tmp = state.stickers[fromIdx];
    state.stickers[fromIdx] = state.stickers[toIdx];
    state.stickers[toIdx] = tmp;

    renderStickers();
    selectSticker(id);
    pushHistory();
    scheduleAutoSave();
  }

  function toggleStickerLayer(id) {
    var stk = state.stickers.find(function(s) { return s.id === id; });
    if (!stk) return;
    stk.layer = (stk.layer === 'below') ? 'above' : 'below';
    renderStickers();
    selectSticker(id);
    pushHistory();
    scheduleAutoSave();
  }

  // Layers panel toggle
  if (btnLayers) btnLayers.addEventListener('click', function() {
    if (layersPanel) layersPanel.classList.toggle('open');
  });
  if (layersPanelClose) layersPanelClose.addEventListener('click', function() {
    if (layersPanel) layersPanel.classList.remove('open');
  });

  // Clear all stickers
  if (btnClearStickers) btnClearStickers.addEventListener('click', function() {
    state.stickers = [];
    selectedStickerId = null;
    renderStickers();
    pushHistory();
    scheduleAutoSave();
  });

  // Click on canvas area or outside (not on sticker) deselects
  canvasArea.addEventListener('mousedown', function(e) {
    if (!e.target.closest('.sticker-item') && !e.target.closest('.sticker-inline-toolbar')) {
      deselectStickers();
    }
  });

  // Delete key removes selected sticker
  document.addEventListener('keydown', function(e) {
    if (selectedStickerId && (e.key === 'Delete' || e.key === 'Backspace')) {
      var tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.contentEditable === 'true') return;
      e.preventDefault();
      removeSticker(selectedStickerId);
    }
    // Ctrl+D duplicates selected sticker
    if (selectedStickerId && (e.ctrlKey || e.metaKey) && e.key === 'd') {
      var tag2 = e.target.tagName.toLowerCase();
      if (tag2 === 'input' || tag2 === 'textarea' || e.target.contentEditable === 'true') return;
      e.preventDefault();
      duplicateSticker(selectedStickerId);
    }
  });

  // ---- DUPLICATE STICKER ----
  function duplicateSticker(id) {
    var src = state.stickers.find(function(s) { return s.id === id; });
    if (!src) return;
    var dup = JSON.parse(JSON.stringify(src));
    dup.id = 'stk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    dup.x = Math.min(90, src.x + 3);
    dup.y = Math.min(90, src.y + 3);
    state.stickers.push(dup);
    renderStickers();
    selectSticker(dup.id);
    pushHistory();
    scheduleAutoSave();
  }

  // ---- FLIP STICKER ----
  function flipSticker(id) {
    var stk = state.stickers.find(function(s) { return s.id === id; });
    if (!stk) return;
    stk.flipH = !stk.flipH;
    var el = findStickerEl(id);
    if (el) {
      var rot = stk.rotation || 0;
      var scaleX = stk.flipH ? -1 : 1;
      el.style.transform = 'rotate(' + rot + 'deg) scaleX(' + scaleX + ')';
    }
    pushHistory();
    scheduleAutoSave();
  }

  // ---- INLINE TOOLBAR ----
  var inlineToolbar = document.getElementById('inline-toolbar');
  var itbDuplicate = document.getElementById('itb-duplicate');
  var itbFlip = document.getElementById('itb-flip');
  var itbLayer = document.getElementById('itb-layer');
  var itbForward = document.getElementById('itb-forward');
  var itbBackward = document.getElementById('itb-backward');
  var itbOpacity = document.getElementById('itb-opacity');
  var itbDelete = document.getElementById('itb-delete');

  function positionInlineToolbar() {
    if (!inlineToolbar || !selectedStickerId) {
      if (inlineToolbar) inlineToolbar.style.display = 'none';
      return;
    }
    var el = findStickerEl(selectedStickerId);
    if (!el) { inlineToolbar.style.display = 'none'; return; }

    var canvasRect = canvasArea.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();

    // Position above the sticker, centered
    var centerX = elRect.left + elRect.width / 2 - canvasRect.left;
    var topY = elRect.top - canvasRect.top - 44;

    // If toolbar would go above canvas area, put it below the sticker
    if (topY < 0) {
      topY = elRect.bottom - canvasRect.top + 8;
    }

    inlineToolbar.style.display = 'flex';
    inlineToolbar.style.left = centerX + 'px';
    inlineToolbar.style.top = topY + 'px';

    // Update opacity slider value
    var stk = state.stickers.find(function(s) { return s.id === selectedStickerId; });
    if (stk && itbOpacity) {
      itbOpacity.value = stk.opacity != null ? stk.opacity : 1;
    }
  }

  function hideInlineToolbar() {
    if (inlineToolbar) inlineToolbar.style.display = 'none';
  }

  // Patch selectSticker to show toolbar
  var _origSelectSticker = selectSticker;
  selectSticker = function(id) {
    _origSelectSticker(id);
    setTimeout(positionInlineToolbar, 10);
  };

  // Patch deselectStickers to hide toolbar
  var _origDeselectStickers = deselectStickers;
  deselectStickers = function() {
    _origDeselectStickers();
    hideInlineToolbar();
  };

  // Re-position toolbar during drag (on mousemove when dragging)
  var _origStartDrag = startDrag;
  startDrag = function(stk, startEvt) {
    hideInlineToolbar();
    _origStartDrag(stk, startEvt);
    // Show toolbar again after drag ends
    var onDragEnd = function() {
      document.removeEventListener('mouseup', onDragEnd);
      setTimeout(positionInlineToolbar, 50);
    };
    document.addEventListener('mouseup', onDragEnd);
  };

  // Hide toolbar during resize
  var _origStartResize = startResize;
  startResize = function(stk, startEvt, handle) {
    hideInlineToolbar();
    _origStartResize(stk, startEvt, handle);
    var onResizeEnd = function() {
      document.removeEventListener('mouseup', onResizeEnd);
      setTimeout(positionInlineToolbar, 50);
    };
    document.addEventListener('mouseup', onResizeEnd);
  };

  // Hide toolbar during rotate
  var _origStartRotate = startRotate;
  startRotate = function(stk, startEvt) {
    hideInlineToolbar();
    _origStartRotate(stk, startEvt);
    var onRotateEnd = function() {
      document.removeEventListener('mouseup', onRotateEnd);
      setTimeout(positionInlineToolbar, 50);
    };
    document.addEventListener('mouseup', onRotateEnd);
  };

  // Toolbar button handlers
  if (itbDuplicate) itbDuplicate.addEventListener('click', function(e) {
    e.stopPropagation();
    if (selectedStickerId) duplicateSticker(selectedStickerId);
  });
  if (itbFlip) itbFlip.addEventListener('click', function(e) {
    e.stopPropagation();
    if (selectedStickerId) flipSticker(selectedStickerId);
  });
  if (itbLayer) itbLayer.addEventListener('click', function(e) {
    e.stopPropagation();
    if (selectedStickerId) toggleStickerLayer(selectedStickerId);
    setTimeout(positionInlineToolbar, 50);
  });
  if (itbForward) itbForward.addEventListener('click', function(e) {
    e.stopPropagation();
    if (selectedStickerId) moveLayerInGroup(selectedStickerId, -1);
    setTimeout(positionInlineToolbar, 50);
  });
  if (itbBackward) itbBackward.addEventListener('click', function(e) {
    e.stopPropagation();
    if (selectedStickerId) moveLayerInGroup(selectedStickerId, 1);
    setTimeout(positionInlineToolbar, 50);
  });
  if (itbOpacity) itbOpacity.addEventListener('input', function(e) {
    e.stopPropagation();
    if (!selectedStickerId) return;
    var stk = state.stickers.find(function(s) { return s.id === selectedStickerId; });
    if (!stk) return;
    stk.opacity = parseFloat(this.value);
    var el = findStickerEl(selectedStickerId);
    if (el) el.style.opacity = stk.opacity;
  });
  if (itbOpacity) itbOpacity.addEventListener('change', function() {
    pushHistory();
    scheduleAutoSave();
  });
  if (itbDelete) itbDelete.addEventListener('click', function(e) {
    e.stopPropagation();
    if (selectedStickerId) removeSticker(selectedStickerId);
    hideInlineToolbar();
  });

  // Hide toolbar on scroll/zoom changes
  if (canvasArea) {
    canvasArea.addEventListener('scroll', hideInlineToolbar);
  }

  // ============ AI STICKER GENERATION ============
  let aiStickerCat = 'icon';
  let aiStickerTone = 'flat';
  const aiStickerPromptInput = document.getElementById('ai-sticker-prompt');
  const btnAiStickerGen = document.getElementById('btn-ai-sticker-gen');
  const aiStickerStatus = document.getElementById('ai-sticker-status');
  const aiStickerError = document.getElementById('ai-sticker-error');
  const aiStickerResults = document.getElementById('ai-sticker-results');
  const aiColor1 = document.getElementById('ai-sticker-color1');
  const aiColor2 = document.getElementById('ai-sticker-color2');
  const aiColorSync = document.getElementById('ai-color-sync');

  // Sync colors from style pack
  function syncAiColors() {
    if (aiColor1) aiColor1.value = state.accentColor;
    if (aiColor2) aiColor2.value = state.accentColor2 || '#e8a87c';
  }
  syncAiColors();
  if (aiColorSync) aiColorSync.addEventListener('click', syncAiColors);

  // Category buttons
  document.querySelectorAll('.ai-sticker-cat').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ai-sticker-cat').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      aiStickerCat = btn.dataset.aiCat;
    });
  });

  // Tone buttons
  document.querySelectorAll('.ai-tone-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ai-tone-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      aiStickerTone = btn.dataset.tone;
    });
  });

  // Preset chips
  document.querySelectorAll('.ai-preset-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      if (aiStickerPromptInput) {
        aiStickerPromptInput.value = chip.dataset.prompt;
        aiStickerPromptInput.focus();
      }
    });
  });

  // Generate AI sticker
  async function generateAiSticker() {
    if (!aiStickerPromptInput || !aiStickerPromptInput.value.trim()) {
      if (aiStickerPromptInput) aiStickerPromptInput.focus();
      return;
    }

    if (btnAiStickerGen) btnAiStickerGen.disabled = true;
    if (aiStickerStatus) aiStickerStatus.style.display = 'flex';
    if (aiStickerError) aiStickerError.style.display = 'none';

    try {
      const res = await fetch('/api/branding/generate-sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiStickerPromptInput.value.trim(),
          category: aiStickerCat,
          tone: aiStickerTone,
          color1: aiColor1 ? aiColor1.value : state.accentColor,
          color2: aiColor2 ? aiColor2.value : state.accentColor2,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur de generation');
      }

      // Add result to results grid
      if (aiStickerResults) {
        var resultDiv = document.createElement('div');
        resultDiv.className = 'ai-sticker-result';
        resultDiv.innerHTML = '<img src="' + data.url + '" alt="AI Sticker">' +
          '<div class="ai-sticker-result__add">+ Ajouter</div>';
        resultDiv.addEventListener('click', function() {
          addAiImageSticker(data.url);
        });
        aiStickerResults.prepend(resultDiv);
      }

      // Auto-add to canvas immediately
      addAiImageSticker(data.url);

    } catch (err) {
      console.error('AI Sticker error:', err);
      if (aiStickerError) {
        aiStickerError.textContent = err.message || 'Erreur lors de la generation';
        aiStickerError.style.display = '';
      }
    }

    if (btnAiStickerGen) btnAiStickerGen.disabled = false;
    if (aiStickerStatus) aiStickerStatus.style.display = 'none';
  }

  if (btnAiStickerGen) btnAiStickerGen.addEventListener('click', generateAiSticker);
  if (aiStickerPromptInput) aiStickerPromptInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); generateAiSticker(); }
  });

  // Add AI-generated image as a draggable sticker
  function addAiImageSticker(imageUrl) {
    var cw = canvas.offsetWidth;
    var ch = canvas.offsetHeight;
    var sScale = cw / 540;
    var size = 100 * sScale;
    var x = ((cw - size) / 2 + (Math.random() - 0.5) * cw * 0.15) / cw * 100;
    var y = ((ch - size) / 2 + (Math.random() - 0.5) * ch * 0.15) / ch * 100;

    var sticker = {
      id: 'stk-' + (++stickerIdCounter),
      type: 'ai-image',
      imageUrl: imageUrl,
      x: Math.max(0, Math.min(85, x)),
      y: Math.max(0, Math.min(85, y)),
      w: size,
      h: size,
      rotation: 0,
      opacity: 1,
      layer: 'above',
    };
    state.stickers.push(sticker);
    renderStickers();
    selectSticker(sticker.id);
    pushHistory();
    scheduleAutoSave();
  }

  // ============ SVG ANIMATION GENERATION ============
  let svgAnimType = 'illustration';
  let svgAnimStyle = 'organic';
  const svgAnimPromptInput = document.getElementById('svg-anim-prompt');
  const btnSvgAnimGen = document.getElementById('btn-svg-anim-gen');
  const svgAnimStatus = document.getElementById('svg-anim-status');
  const svgAnimError = document.getElementById('svg-anim-error');
  const svgAnimResults = document.getElementById('svg-anim-results');
  const svgAnimEmpty = document.getElementById('svg-anim-empty');
  const svgAnimColor1 = document.getElementById('svg-anim-color1');
  const svgAnimColor2 = document.getElementById('svg-anim-color2');
  const svgColorSync = document.getElementById('svg-color-sync');
  const svgTransparentBg = document.getElementById('svg-transparent-bg');

  // Sync colors from style pack
  function syncSvgColors() {
    if (svgAnimColor1) svgAnimColor1.value = state.accentColor;
    if (svgAnimColor2) svgAnimColor2.value = state.accentColor2 || '#e8a87c';
  }
  syncSvgColors();
  if (svgColorSync) svgColorSync.addEventListener('click', syncSvgColors);

  // Type buttons
  document.querySelectorAll('.svg-type-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.svg-type-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      svgAnimType = btn.dataset.svgType;
    });
  });

  // Style buttons
  document.querySelectorAll('.svg-style-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.svg-style-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      svgAnimStyle = btn.dataset.svgStyle;
    });
  });

  // Preset chips
  document.querySelectorAll('[data-svg-prompt]').forEach(function(chip) {
    chip.addEventListener('click', function() {
      if (svgAnimPromptInput) {
        svgAnimPromptInput.value = chip.dataset.svgPrompt;
        svgAnimPromptInput.focus();
      }
    });
  });

  // Generate SVG animation
  async function generateSvgAnimation() {
    if (!svgAnimPromptInput || !svgAnimPromptInput.value.trim()) {
      if (svgAnimPromptInput) svgAnimPromptInput.focus();
      return;
    }

    if (btnSvgAnimGen) btnSvgAnimGen.disabled = true;
    if (svgAnimStatus) svgAnimStatus.style.display = 'flex';
    if (svgAnimError) svgAnimError.style.display = 'none';

    try {
      var res = await fetch('/api/branding/generate-svg-animation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: svgAnimPromptInput.value.trim(),
          type: svgAnimType,
          style: svgAnimStyle,
          color1: svgAnimColor1 ? svgAnimColor1.value : state.accentColor,
          color2: svgAnimColor2 ? svgAnimColor2.value : state.accentColor2,
          bgColor: (svgTransparentBg && svgTransparentBg.checked) ? 'transparent' : state.bgColor,
        }),
      });

      var data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur de generation SVG');
      }

      // Hide empty message
      if (svgAnimEmpty) svgAnimEmpty.style.display = 'none';

      // Create result card
      var card = document.createElement('div');
      card.className = 'svg-anim-result-card';
      card.innerHTML =
        '<div class="svg-anim-result-card__preview">' + data.svg + '</div>' +
        '<div class="svg-anim-result-card__actions">' +
        '<button class="btn btn--primary btn--sm svg-add-to-canvas">+ Sur le canvas</button>' +
        '<button class="btn btn--ghost btn--sm svg-download">Telecharger</button>' +
        '</div>';

      // Add to canvas button
      card.querySelector('.svg-add-to-canvas').addEventListener('click', function() {
        addSvgAnimationSticker(data.svg, data.url);
      });

      // Download button
      card.querySelector('.svg-download').addEventListener('click', function() {
        var blob = new Blob([data.svg], { type: 'image/svg+xml' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'animation-' + Date.now() + '.svg';
        a.click();
        URL.revokeObjectURL(a.href);
      });

      if (svgAnimResults) svgAnimResults.prepend(card);

    } catch (err) {
      console.error('SVG Animation error:', err);
      if (svgAnimError) {
        svgAnimError.textContent = err.message || 'Erreur lors de la generation';
        svgAnimError.style.display = '';
      }
    }

    if (btnSvgAnimGen) btnSvgAnimGen.disabled = false;
    if (svgAnimStatus) svgAnimStatus.style.display = 'none';
  }

  if (btnSvgAnimGen) btnSvgAnimGen.addEventListener('click', generateSvgAnimation);
  if (svgAnimPromptInput) svgAnimPromptInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); generateSvgAnimation(); }
  });

  // Add SVG animation as a draggable sticker on canvas
  function addSvgAnimationSticker(svgCode, svgUrl) {
    var cw = canvas.offsetWidth;
    var ch = canvas.offsetHeight;
    var sScale = cw / 540;
    var size = 150 * sScale;
    var x = ((cw - size) / 2 + (Math.random() - 0.5) * cw * 0.1) / cw * 100;
    var y = ((ch - size) / 2 + (Math.random() - 0.5) * ch * 0.1) / ch * 100;

    var sticker = {
      id: 'stk-' + (++stickerIdCounter),
      type: 'svg-animation',
      svgCode: svgCode,
      svgUrl: svgUrl || '',
      x: Math.max(0, Math.min(75, x)),
      y: Math.max(0, Math.min(75, y)),
      w: size,
      h: size,
      rotation: 0,
      opacity: 1,
      layer: 'above',
    };
    state.stickers.push(sticker);
    renderStickers();
    selectSticker(sticker.id);
    pushHistory();
    scheduleAutoSave();
  }

  // ============ SVG UPLOAD ============
  var inputSvgUpload = document.getElementById('input-svg-upload');
  if (inputSvgUpload) {
    inputSvgUpload.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file || !file.name.toLowerCase().endsWith('.svg')) return;

      // Read SVG code locally
      var reader = new FileReader();
      reader.onload = function(ev) {
        var svgCode = ev.target.result;

        // Upload to server in parallel for URL persistence
        var formData = new FormData();
        formData.append('file', file);
        fetch('/api/branding/upload', { method: 'POST', body: formData })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            var url = data.url || '';
            addSvgUploadSticker(svgCode, url);
          })
          .catch(function() {
            // Even if upload fails, add to canvas with local svgCode
            addSvgUploadSticker(svgCode, '');
          });
      };
      reader.readAsText(file);
      // Reset input so same file can be re-imported
      inputSvgUpload.value = '';
    });
  }

  function addSvgUploadSticker(svgCode, svgUrl) {
    var cw = canvas.offsetWidth;
    var ch = canvas.offsetHeight;
    var sScale = cw / 540;
    var size = 150 * sScale;
    var x = ((cw - size) / 2 + (Math.random() - 0.5) * cw * 0.1) / cw * 100;
    var y = ((ch - size) / 2 + (Math.random() - 0.5) * ch * 0.1) / ch * 100;

    var sticker = {
      id: 'stk-' + (++stickerIdCounter),
      type: 'svg-upload',
      svgCode: svgCode,
      svgUrl: svgUrl || '',
      x: Math.max(0, Math.min(75, x)),
      y: Math.max(0, Math.min(75, y)),
      w: size,
      h: size,
      rotation: 0,
      opacity: 1,
      layer: 'above',
    };
    state.stickers.push(sticker);
    renderStickers();
    selectSticker(sticker.id);
    pushHistory();
    scheduleAutoSave();
  }

  // ============ FREE LAYOUT (DRAGGABLE TEXTS) ============
  var optFreeLayout = document.getElementById('opt-free-layout');

  function attachDragHandle(el, key) {
    // Remove existing handle if any
    var existing = el.querySelector('.text-drag-handle');
    if (existing) existing.remove();

    var handle = document.createElement('div');
    handle.className = 'text-drag-handle';
    handle.dataset.dragKey = key;
    handle.textContent = '\u2807';
    handle.contentEditable = 'false';
    el.insertBefore(handle, el.firstChild);

    handle.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!state.freeLayout) return;

      var cRect = canvas.getBoundingClientRect();
      var startX = e.clientX;
      var startY = e.clientY;
      var origX = state.textPositions[key] ? state.textPositions[key].x : 10;
      var origY = state.textPositions[key] ? state.textPositions[key].y : 10;

      handle.style.cursor = 'grabbing';

      function onMove(ev) {
        var dx = (ev.clientX - startX) / cRect.width * 100;
        var dy = (ev.clientY - startY) / cRect.height * 100;
        var newX = Math.max(-5, Math.min(95, origX + dx));
        var newY = Math.max(-5, Math.min(95, origY + dy));
        if (!state.textPositions[key]) state.textPositions[key] = { x: 10, y: 10 };
        state.textPositions[key].x = newX;
        state.textPositions[key].y = newY;
        el.style.left = newX + '%';
        el.style.top = newY + '%';
      }
      function onUp() {
        handle.style.cursor = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        pushHistory();
        scheduleAutoSave();
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function applyFreeLayout() {
    var elements = {
      logo: canvasLogo,
      headline: canvasHeadline,
      subline: canvasSubline,
      body: canvasBody,
      cta: canvasCta
    };
    // Ensure textPositions exists
    if (!state.textPositions) {
      state.textPositions = getDefaultState().textPositions;
    }
    if (state.freeLayout) {
      canvas.classList.add('free-layout');
      Object.keys(elements).forEach(function(key) {
        var el = elements[key];
        if (!el) return;
        var pos = state.textPositions[key];
        if (pos) {
          el.style.left = pos.x + '%';
          el.style.top = pos.y + '%';
        }
        // Dynamically inject drag handle
        attachDragHandle(el, key);
      });
    } else {
      canvas.classList.remove('free-layout');
      Object.keys(elements).forEach(function(key) {
        var el = elements[key];
        if (!el) return;
        el.style.left = '';
        el.style.top = '';
        // Remove drag handles
        var h = el.querySelector('.text-drag-handle');
        if (h) h.remove();
      });
    }
  }

  _applyFreeLayoutFn = applyFreeLayout;

  if (optFreeLayout) {
    optFreeLayout.addEventListener('change', function() {
      state.freeLayout = this.checked;
      applyFreeLayout();
      pushHistory();
      scheduleAutoSave();
    });
  }

  // ============ INIT ============
  async function initPubs() {
    const lastId = localStorage.getItem('branding_last_pub');
    let loaded = false;
    if (lastId) {
      loaded = await loadPub(lastId);
    }
    if (!loaded) {
      try {
        const res = await fetch('/api/brandings');
        const data = await res.json();
        if (data.brandings && data.brandings.length > 0) {
          loaded = await loadPub(data.brandings[0].id);
        }
      } catch (e) {}
    }
    if (!loaded) {
      await createNewPub();
    }
  }

  updateCanvas();
  updateUndoRedoButtons();
  initPubs();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => fitCanvasToViewport(), 100);
  });

  // ============ AI GENERATOR ============
  const aiModalOverlay = document.getElementById('ai-modal-overlay');
  const btnOpenAi = document.getElementById('btn-open-ai');
  const btnCloseAi = document.getElementById('ai-modal-close');
  const btnAiGenAll = document.getElementById('btn-ai-generate-all');
  const btnImprovePrompt = document.getElementById('btn-improve-prompt');
  const aiGenPrompt = document.getElementById('ai-gen-prompt');
  const aiGenError = document.getElementById('ai-gen-error');

  if (btnOpenAi) btnOpenAi.addEventListener('click', () => {
    aiModalOverlay.classList.add('visible');
    setTimeout(() => aiGenPrompt && aiGenPrompt.focus(), 200);
  });

  function closeAiModal() {
    aiModalOverlay.classList.remove('visible');
  }

  if (btnCloseAi) btnCloseAi.addEventListener('click', closeAiModal);
  if (aiModalOverlay) aiModalOverlay.addEventListener('click', (e) => {
    if (e.target === aiModalOverlay) closeAiModal();
  });

  // Improve prompt with AI
  if (btnImprovePrompt) btnImprovePrompt.addEventListener('click', async () => {
    if (!aiGenPrompt || !aiGenPrompt.value.trim()) {
      aiGenPrompt && aiGenPrompt.focus();
      return;
    }

    btnImprovePrompt.disabled = true;
    const origText = btnImprovePrompt.querySelector('span');
    if (origText) origText.textContent = 'Reflexion...';

    try {
      const res = await fetch('/api/branding/ai-improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiGenPrompt.value.trim() }),
      });
      const data = await res.json();
      if (data.success && data.improved) {
        aiGenPrompt.value = data.improved;
        aiGenPrompt.style.height = 'auto';
        aiGenPrompt.style.height = aiGenPrompt.scrollHeight + 'px';
      }
    } catch (err) {
      console.error('Improve prompt error:', err);
    }

    btnImprovePrompt.disabled = false;
    if (origText) origText.textContent = 'Booster le prompt';
  });

  // Generate everything with AI
  if (btnAiGenAll) btnAiGenAll.addEventListener('click', async () => {
    if (!aiGenPrompt || !aiGenPrompt.value.trim()) {
      aiGenPrompt && aiGenPrompt.focus();
      return;
    }

    btnAiGenAll.disabled = true;
    btnAiGenAll.classList.add('loading');
    const genText = btnAiGenAll.querySelector('.ai-gen-text');
    if (genText) genText.textContent = 'Generation en cours...';
    if (aiGenError) aiGenError.style.display = 'none';

    try {
      const res = await fetch('/api/branding/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiGenPrompt.value.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      const r = data.result;

      // Apply the AI-generated design
      historyPaused = true;

      // 1. Apply style pack if valid
      if (r.stylePack && stylePacks[r.stylePack]) {
        state.stylePack = r.stylePack;
        const pack = stylePacks[r.stylePack];
        state.bgColor = pack.bg;
        state.textColor = pack.text;
        state.accentColor = pack.accent;
        state.accentColor2 = pack.accent2;
        state.typoHeadline.font = pack.headlineFont;
        state.typoBody.font = pack.bodyFont;
      }

      // 2. Apply template
      if (r.template && templateDefaults[r.template]) {
        state.template = r.template;
      }

      // 3. Apply text content
      if (r.headline) state.headline = r.headline;
      if (r.subline) state.subline = r.subline;
      if (r.body) state.body = r.body;
      if (r.cta) state.cta = r.cta;

      // 4. Apply typography options
      if (r.headlineSize) state.typoHeadline.size = Math.max(24, Math.min(100, r.headlineSize));
      if (r.headlineWeight) state.typoHeadline.weight = r.headlineWeight;
      if (r.headlineCase) state.typoHeadline.case = r.headlineCase;
      if (r.headlineAlign) state.typoHeadline.align = r.headlineAlign;
      if (r.bodySize) state.typoBody.size = Math.max(8, Math.min(24, r.bodySize));

      // 5. Apply options
      if (typeof r.showBorder === 'boolean') state.showBorder = r.showBorder;
      if (typeof r.showGrain === 'boolean') state.showGrain = r.showGrain;

      // 6. Clear existing stickers for a fresh design
      state.stickers = [];
      selectedStickerId = null;

      // Restore all UI from the new state
      restoreFromState();
      historyPaused = false;
      pushHistory();

      // Close modal
      closeAiModal();

      // 7. Generate AI stickers in background
      if (r.stickers && Array.isArray(r.stickers) && r.stickers.length > 0) {
        if (genText) genText.textContent = 'Stickers IA...';
        const pack = r.stylePack && stylePacks[r.stylePack] ? stylePacks[r.stylePack] : null;
        const c1 = pack ? pack.accent : state.accentColor;
        const c2 = pack ? pack.accent2 : state.accentColor2;

        for (const stickerSpec of r.stickers) {
          try {
            const stkRes = await fetch('/api/branding/generate-sticker', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: stickerSpec.prompt,
                category: stickerSpec.category || 'icon',
                tone: stickerSpec.tone || 'flat',
                color1: c1,
                color2: c2,
              }),
            });
            const stkData = await stkRes.json();
            if (stkData.success && stkData.url) {
              // Place at the position suggested by AI
              var cw = canvas.offsetWidth;
              var ch = canvas.offsetHeight;
              var sScale = cw / 540;
              var sz = (stickerSpec.size || 90) * sScale;
              var sticker = {
                id: 'stk-' + (++stickerIdCounter),
                type: 'ai-image',
                imageUrl: stkData.url,
                x: Math.max(0, Math.min(85, stickerSpec.x || 50)),
                y: Math.max(0, Math.min(85, stickerSpec.y || 50)),
                w: sz,
                h: sz,
                rotation: 0,
                opacity: 1,
                layer: 'above',
              };
              state.stickers.push(sticker);
              renderStickers();
              scheduleAutoSave();
            }
          } catch (stkErr) {
            console.warn('AI sticker generation failed:', stkErr);
          }
        }
        pushHistory();
      }

    } catch (err) {
      if (aiGenError) {
        aiGenError.textContent = err.message;
        aiGenError.style.display = '';
      }
    }

    btnAiGenAll.disabled = false;
    btnAiGenAll.classList.remove('loading');
    if (genText) genText.textContent = 'Generer le design';
  });

  // Enter key in AI prompt triggers generate
  if (aiGenPrompt) aiGenPrompt.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      btnAiGenAll && btnAiGenAll.click();
    }
  });

  // ============ AI MODAL TABS ============
  document.querySelectorAll('.ai-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.ai-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-ai-tab');
      const content = document.querySelector(`[data-ai-tab-content="${target}"]`);
      if (content) content.classList.add('active');
    });
  });

  // ============ AI URL SCRAPER ============
  const btnScrapeUrl = document.getElementById('btn-scrape-url');
  const aiUrlInput = document.getElementById('ai-url-input');
  const aiUrlError = document.getElementById('ai-url-error');
  const aiUrlBusiness = document.getElementById('ai-url-business');
  const aiBizName = document.getElementById('ai-biz-name');
  const aiBizIndustry = document.getElementById('ai-biz-industry');
  const aiBizVibe = document.getElementById('ai-biz-vibe');
  const aiIdeasGrid = document.getElementById('ai-ideas-grid');

  const formatMap = {
    post: { w: 1080, h: 1080, label: 'Post' },
    story: { w: 1080, h: 1920, label: 'Story' },
    banner: { w: 1200, h: 628, label: 'Banniere' },
    cover: { w: 1920, h: 1080, label: 'Cover' },
    portrait: { w: 1080, h: 1350, label: 'Portrait' },
    linkedin: { w: 1080, h: 566, label: 'LinkedIn' },
  };

  if (btnScrapeUrl) btnScrapeUrl.addEventListener('click', async () => {
    const url = aiUrlInput ? aiUrlInput.value.trim() : '';
    if (!url) { aiUrlInput && aiUrlInput.focus(); return; }

    // Basic URL validation
    try { new URL(url); } catch {
      if (aiUrlError) { aiUrlError.textContent = 'URL invalide'; aiUrlError.style.display = ''; }
      return;
    }

    btnScrapeUrl.disabled = true;
    btnScrapeUrl.classList.add('loading');
    const analyzeText = btnScrapeUrl.querySelector('.ai-url__analyze-text');
    if (analyzeText) analyzeText.textContent = 'Analyse...';
    if (aiUrlError) aiUrlError.style.display = 'none';
    if (aiIdeasGrid) { aiIdeasGrid.style.display = 'none'; aiIdeasGrid.innerHTML = ''; }
    if (aiUrlBusiness) aiUrlBusiness.style.display = 'none';

    try {
      const res = await fetch('/api/branding/ai-scrape-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      // Show business info
      if (data.business && aiUrlBusiness) {
        if (aiBizName) aiBizName.textContent = data.business.name || '';
        if (aiBizIndustry) aiBizIndustry.textContent = data.business.industry || '';
        if (aiBizVibe) aiBizVibe.textContent = data.business.vibe || '';
        aiUrlBusiness.style.display = '';
      }

      // Render idea cards
      if (data.ideas && data.ideas.length > 0 && aiIdeasGrid) {
        aiIdeasGrid.innerHTML = '';
        data.ideas.forEach(idea => {
          const card = document.createElement('div');
          card.className = 'ai-idea-card';
          card.innerHTML = `
            <div class="ai-idea-card__top">
              <span class="ai-idea-card__title">${escapeHtml(idea.title)}</span>
              <div class="ai-idea-card__badges">
                <span class="ai-idea-card__type">${escapeHtml(idea.type)}</span>
                <span class="ai-idea-card__format">${escapeHtml((formatMap[idea.format] || formatMap.post).label)}</span>
              </div>
            </div>
            <div class="ai-idea-card__desc">${escapeHtml(idea.description)}</div>
            <div class="ai-idea-card__action">
              <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 1v5M5 10v1M1 5h3M9 5h2M2 2l1.5 1.5M7 7l1.5 1.5"/></svg>
              Appliquer ce visuel
            </div>
          `;

          card.addEventListener('click', () => {
            // Apply the pre-generated design directly (no extra AI call)
            historyPaused = true;

            // 1. Format
            if (idea.format && formatMap[idea.format]) {
              const fmt = formatMap[idea.format];
              state.format = { w: fmt.w, h: fmt.h, label: fmt.label };
              document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
              const fmtBtn = document.querySelector(`.format-btn[data-w="${fmt.w}"][data-h="${fmt.h}"]`);
              if (fmtBtn) fmtBtn.classList.add('active');
            }

            // 2. Style pack
            if (idea.stylePack && stylePacks[idea.stylePack]) {
              state.stylePack = idea.stylePack;
              const pack = stylePacks[idea.stylePack];
              state.bgColor = pack.bg;
              state.textColor = pack.text;
              state.accentColor = pack.accent;
              state.accentColor2 = pack.accent2;
              state.typoHeadline.font = pack.headlineFont;
              state.typoBody.font = pack.bodyFont;
            }

            // 3. Template
            if (idea.template && templateDefaults[idea.template]) {
              state.template = idea.template;
            }

            // 4. Text content
            if (idea.headline) state.headline = idea.headline;
            if (idea.subline) state.subline = idea.subline;
            if (idea.body) state.body = idea.body;
            if (idea.cta) state.cta = idea.cta;

            // 5. Typography
            if (idea.headlineSize) state.typoHeadline.size = Math.max(24, Math.min(100, idea.headlineSize));
            if (idea.headlineWeight) state.typoHeadline.weight = idea.headlineWeight;
            if (idea.headlineCase) state.typoHeadline.case = idea.headlineCase;
            if (idea.headlineAlign) state.typoHeadline.align = idea.headlineAlign;
            if (idea.bodySize) state.typoBody.size = Math.max(8, Math.min(24, idea.bodySize));

            // 6. Options
            if (typeof idea.showBorder === 'boolean') state.showBorder = idea.showBorder;
            if (typeof idea.showGrain === 'boolean') state.showGrain = idea.showGrain;

            // Restore UI and close modal
            restoreFromState();
            historyPaused = false;
            pushHistory();
            closeAiModal();

            // Visual feedback on card
            card.style.borderColor = '#8b5cf6';
            card.style.background = 'rgba(139,92,246,0.1)';
          });

          aiIdeasGrid.appendChild(card);
        });
        aiIdeasGrid.style.display = '';
      }

    } catch (err) {
      if (aiUrlError) {
        aiUrlError.textContent = err.message;
        aiUrlError.style.display = '';
      }
    }

    btnScrapeUrl.disabled = false;
    btnScrapeUrl.classList.remove('loading');
    if (analyzeText) analyzeText.textContent = 'Analyser';
  });

  // Enter in URL input triggers analyze
  if (aiUrlInput) aiUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); btnScrapeUrl && btnScrapeUrl.click(); }
  });

  // Helper: escape HTML in idea cards
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Save before leaving
  window.addEventListener('beforeunload', () => {
    if (currentPubId) {
      const stateToSave = JSON.parse(JSON.stringify(state));
      delete stateToSave.zoom;
      delete stateToSave.gridVisible;
      const body = JSON.stringify({ state: stateToSave, name: pubNameInput ? pubNameInput.value : undefined });
      navigator.sendBeacon('/api/brandings/' + currentPubId, new Blob([body], { type: 'application/json' }));
    }
  });

  // ============ COLLAPSIBLE PANELS (Accordion) ============
  document.querySelectorAll('.panel__title--toggle').forEach(function(title) {
    title.addEventListener('click', function() {
      var isCollapsed = this.getAttribute('data-collapsed') === 'true';
      this.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
    });
  });

  // ============ AI COMMAND BAR ============
  var aiBarInput = document.getElementById('ai-bar-input');
  var aiBarSubmit = document.getElementById('ai-bar-submit');
  var aiBarBoost = document.getElementById('ai-bar-boost');

  function triggerAiBarGenerate() {
    if (!aiBarInput || !aiBarInput.value.trim()) return;
    var prompt = aiBarInput.value.trim();
    // Pre-fill the modal prompt and open it
    if (aiGenPrompt) aiGenPrompt.value = prompt;
    if (aiModalOverlay) aiModalOverlay.classList.add('visible');
    // Auto-trigger generation
    setTimeout(function() {
      if (btnAiGenAll && !btnAiGenAll.disabled) btnAiGenAll.click();
    }, 300);
  }

  if (aiBarSubmit) aiBarSubmit.addEventListener('click', triggerAiBarGenerate);
  if (aiBarInput) aiBarInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerAiBarGenerate();
    }
  });

  // Boost prompt from bar
  if (aiBarBoost) aiBarBoost.addEventListener('click', async function() {
    if (!aiBarInput || !aiBarInput.value.trim()) { aiBarInput && aiBarInput.focus(); return; }
    aiBarBoost.disabled = true;
    try {
      var res = await fetch('/api/branding/ai-improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiBarInput.value.trim() }),
      });
      var data = await res.json();
      if (data.success && data.improved) {
        aiBarInput.value = data.improved;
      }
    } catch (e) {}
    aiBarBoost.disabled = false;
  });

  // Quick chips
  document.querySelectorAll('.ai-bar__chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var prompt = this.getAttribute('data-prompt');
      if (aiBarInput) aiBarInput.value = prompt;
      triggerAiBarGenerate();
    });
  });

  // Hide AI bar when AI modal is open
  var aiBar = document.getElementById('ai-bar');
  if (aiModalOverlay && aiBar) {
    var observer = new MutationObserver(function() {
      var isOpen = aiModalOverlay.classList.contains('visible');
      aiBar.style.opacity = isOpen ? '0' : '';
      aiBar.style.pointerEvents = isOpen ? 'none' : '';
    });
    observer.observe(aiModalOverlay, { attributes: true, attributeFilter: ['class'] });
  }

  // ============ AGENT HOOKS ============
  // Expose state and pubId for the creative agent
  window.__brandingState = function () {
    // Return a clean copy without circular refs
    var s = JSON.parse(JSON.stringify(state));
    // Don't send large base64 bg images to the agent
    if (s.bgImage && s.bgImage.length > 200) {
      s.bgImage = '[image présente]';
    }
    return s;
  };

  window.__brandingPubId = function () {
    return currentPubId;
  };

  window.__brandingNewPub = async function (name) {
    await autoSave();
    await createNewPub(name);
    closePubDropdown();
  };

  // Notify agent when pub changes
  var _origLoadPub = loadPub;
  loadPub = async function (id) {
    var result = await _origLoadPub(id);
    window.dispatchEvent(new Event('branding-pub-changed'));
    return result;
  };

  // ============ ANIMATED EXPORT (GIF / WebM) ============

  // Hide Video button if MediaRecorder not supported
  (function() {
    if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream === 'undefined') {
      var webmBtn = document.querySelector('.export-dropdown__opt[data-val="webm"]');
      if (webmBtn) webmBtn.style.display = 'none';
    }
  })();

  /** Inject .recording-hover rules by duplicating :hover rules from SVG <style> tags */
  function injectHoverSimulation() {
    var svgs = canvas.querySelectorAll('.svg-anim-wrapper svg');
    svgs.forEach(function(svg) {
      var styles = svg.querySelectorAll('style');
      styles.forEach(function(styleEl) {
        var origCss = styleEl.textContent;
        styleEl.dataset.origCss = origCss;

        // Find all :hover rules and duplicate them with .recording-hover
        var hoverRules = [];
        // Pattern: selector:hover { ... }  or  selector:hover selector { ... }
        var regex = /([^{}]*):hover([^{]*)\{([^}]*)\}/g;
        var match;
        while ((match = regex.exec(origCss)) !== null) {
          var before = match[1].trim();
          var after = match[2];
          var body = match[3];
          // e.g. ".robot:hover { ... }" → ".robot.recording-hover { ... }"
          // e.g. "svg:hover .child { ... }" → "svg.recording-hover .child { ... }"
          // e.g. ".scene:hover .child { ... }" → ".scene.recording-hover .child { ... }"
          hoverRules.push(before + '.recording-hover' + after + '{' + body + '}');
        }

        if (hoverRules.length > 0) {
          styleEl.textContent = origCss + '\n/* recording-hover */\n' + hoverRules.join('\n');
        }
      });
    });
  }

  /** Remove injected .recording-hover rules, restore original CSS */
  function removeHoverSimulation() {
    var svgs = canvas.querySelectorAll('.svg-anim-wrapper svg');
    svgs.forEach(function(svg) {
      var styles = svg.querySelectorAll('style');
      styles.forEach(function(styleEl) {
        if (styleEl.dataset.origCss !== undefined) {
          styleEl.textContent = styleEl.dataset.origCss;
          delete styleEl.dataset.origCss;
        }
      });
    });
  }

  /** Toggle .recording-hover class on SVG elements */
  function toggleHoverClass(enabled) {
    var svgs = canvas.querySelectorAll('.svg-anim-wrapper svg');
    svgs.forEach(function(svg) {
      if (enabled) {
        svg.classList.add('recording-hover');
      } else {
        svg.classList.remove('recording-hover');
      }
      // Also toggle on direct <g> children for patterns like .scene:hover .child
      svg.querySelectorAll(':scope > g').forEach(function(g) {
        if (enabled) {
          g.classList.add('recording-hover');
        } else {
          g.classList.remove('recording-hover');
        }
      });
    });
  }

  /** Capture N frames using html2canvas, toggling hover according to timeline */
  function captureFrames(totalFrames, fps, onProgress) {
    return new Promise(function(resolve) {
      var frames = [];
      var frameIndex = 0;

      function captureNext() {
        if (frameIndex >= totalFrames) {
          resolve(frames);
          return;
        }

        // Hover timeline: ON from 25% to 55% of the cycle
        var pct = frameIndex / totalFrames;
        var hoverOn = pct >= 0.25 && pct <= 0.55;
        toggleHoverClass(hoverOn);

        // Small delay to let CSS transitions apply
        setTimeout(function() {
          var t0 = performance.now();
          html2canvas(canvas, {
            scale: 1,
            width: canvas.offsetWidth,
            height: canvas.offsetHeight,
            useCORS: true,
            backgroundColor: null,
            logging: false,
          }).then(function(frameCanvas) {
            frames.push(frameCanvas);
            frameIndex++;
            if (onProgress) onProgress(frameIndex, totalFrames);

            // Delay to approximate target FPS
            var elapsed = performance.now() - t0;
            var frameDelay = Math.max(0, (1000 / fps) - elapsed);
            setTimeout(captureNext, frameDelay);
          }).catch(function(err) {
            console.error('Frame capture error:', err);
            frameIndex++;
            if (onProgress) onProgress(frameIndex, totalFrames);
            setTimeout(captureNext, 0);
          });
        }, 50);
      }

      captureNext();
    });
  }

  /** Assemble frames into a GIF blob using gif.js */
  function assembleGIF(frames, fps) {
    return new Promise(function(resolve, reject) {
      var gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: '/js/gif.worker.js',
        width: frames[0].width,
        height: frames[0].height,
      });

      var delay = Math.round(1000 / fps);
      frames.forEach(function(frameCanvas) {
        gif.addFrame(frameCanvas, { delay: delay, copy: true });
      });

      gif.on('finished', function(blob) {
        resolve(blob);
      });

      gif.on('error', function(err) {
        reject(err);
      });

      gif.render();
    });
  }

  /** Assemble frames into a WebM blob using MediaRecorder + captureStream */
  function assembleWebM(frames, fps) {
    return new Promise(function(resolve, reject) {
      var w = frames[0].width;
      var h = frames[0].height;
      var offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      var ctx = offscreen.getContext('2d');

      var stream = offscreen.captureStream(0);
      var track = stream.getVideoTracks()[0];

      var mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      var recorder = new MediaRecorder(stream, { mimeType: mimeType, videoBitsPerSecond: 5000000 });
      var chunks = [];

      recorder.ondataavailable = function(e) {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = function() {
        var blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      recorder.onerror = function(e) {
        reject(e.error || new Error('MediaRecorder error'));
      };

      recorder.start();

      var frameIndex = 0;
      var delay = Math.round(1000 / fps);

      function drawNext() {
        if (frameIndex >= frames.length) {
          // Add a small delay before stopping to ensure last frame is captured
          setTimeout(function() { recorder.stop(); }, 100);
          return;
        }
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(frames[frameIndex], 0, 0);
        if (track.requestFrame) track.requestFrame();
        frameIndex++;
        setTimeout(drawNext, delay);
      }

      drawNext();
    });
  }

  /** Main orchestrator for animated export (GIF or WebM) */
  async function exportAnimated() {
    var duration = exportDurationSlider ? parseInt(exportDurationSlider.value) : 3;
    var fps = exportFpsSlider ? parseInt(exportFpsSlider.value) : 10;
    var totalFrames = duration * fps;

    var overlayText = document.getElementById('export-overlay-text');
    var progressWrap = document.getElementById('export-progress');
    var progressBar = document.getElementById('export-progress-bar');

    // Show overlay
    exportOverlay.classList.add('visible');
    if (exportDropdown) exportDropdown.style.display = 'none';
    if (overlayText) overlayText.textContent = 'Capture des frames...';
    if (progressWrap) progressWrap.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';

    // Resize canvas to native resolution for crisp frames
    var snapshot = prepareCanvasForExport(state.format.w);

    // Inject hover simulation CSS
    injectHoverSimulation();

    try {
      // Wait a beat for layout/CSS to settle
      await new Promise(function(r) { setTimeout(r, 250); });

      // Capture frames
      var frames = await captureFrames(totalFrames, fps, function(done, total) {
        var pct = Math.round((done / total) * 70); // 0-70% for frame capture
        if (progressBar) progressBar.style.width = pct + '%';
        if (overlayText) overlayText.textContent = 'Capture ' + done + '/' + total + '...';
      });

      // Assemble
      if (overlayText) overlayText.textContent = 'Assemblage ' + exportFormat.toUpperCase() + '...';
      if (progressBar) progressBar.style.width = '75%';

      var blob;
      if (exportFormat === 'gif') {
        blob = await assembleGIF(frames, fps);
      } else {
        blob = await assembleWebM(frames, fps);
      }

      if (progressBar) progressBar.style.width = '100%';
      if (overlayText) overlayText.textContent = 'Telechargement...';

      // Download
      var ext = exportFormat === 'gif' ? 'gif' : 'webm';
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.download = 'latraverse-' + state.template + '-' + state.format.label.toLowerCase() + '-' + Date.now() + '.' + ext;
      link.href = url;
      link.click();
      setTimeout(function() { URL.revokeObjectURL(url); }, 5000);

    } catch (err) {
      console.error('Animated export error:', err);
      alert('Erreur lors de l\'export anime: ' + err.message);
    } finally {
      // Cleanup
      removeHoverSimulation();
      toggleHoverClass(false);
      snapshot.restore();
      exportOverlay.classList.remove('visible');
      if (progressWrap) progressWrap.style.display = 'none';
      if (progressBar) progressBar.style.width = '0%';
      if (overlayText) overlayText.textContent = 'Export en cours...';
    }
  }

})();
