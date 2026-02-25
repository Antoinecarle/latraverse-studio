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
  const infoFormat = document.getElementById('info-format');
  const infoTemplate = document.getElementById('info-template');
  const exportOverlay = document.getElementById('export-overlay');

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
      showLogo: true,
      showBorder: true,
      showGrain: false,
      showVignette: false,
      bgImage: null,
      bgOpacity: 70,
      bgBlur: 0,
      gradient: { enabled: false, angle: 135, start: '#c4622a', end: '#1a1714' },
      typoHeadline: { font: "'Playfair Display', serif", size: 48, weight: '700', align: 'left', case: 'none', lh: 110, ls: 0 },
      typoBody: { font: "'Libre Baskerville', serif", size: 15, weight: '400' },
      fxShadow: 0,
      fxGlow: 0,
      fxOutline: false,
      zoom: 100,
      gridVisible: false,
    };
  }

  let state = getDefaultState();

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

  // ============ TABS ============
  document.querySelectorAll('.sidebar__tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.sidebar__tabs .tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const content = document.querySelector('[data-tab-content="' + tabName + '"]');
      if (content) content.classList.add('active');
    });
  });

  // ============ FORMAT ============
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.format = { w: parseInt(btn.dataset.w), h: parseInt(btn.dataset.h), label: btn.dataset.label };
      pushHistory();
      updateCanvas();
    });
  });

  // ============ TEMPLATE DEFAULTS ============
  const templateDefaults = {
    minimal:    { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a' },
    bold:       { bg: '#0a0a0a', text: '#f0e8dc', accent: '#c4622a' },
    gradient:   { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a' },
    split:      { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a' },
    editorial:  { bg: '#faf6f1', text: '#1a1714', accent: '#c4622a' },
    glass:      { bg: '#0c1220', text: '#f0e8dc', accent: '#4a6fa5' },
    neon:       { bg: '#0a0a0a', text: '#f0e8dc', accent: '#c4622a' },
    promo:      { bg: '#0a0a0a', text: '#f0e8dc', accent: '#c4622a' },
    quote:      { bg: '#f5f0e8', text: '#1a1a1a', accent: '#c4622a' },
    duotone:    { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a' },
    geometric:  { bg: '#1a1714', text: '#f0e8dc', accent: '#c4622a' },
    typewriter: { bg: '#f5f0e8', text: '#1a1714', accent: '#c4622a' },
  };

  // ============ TEMPLATES ============
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.template = btn.dataset.template;

      // Apply template default colors
      const defaults = templateDefaults[state.template];
      if (defaults) {
        state.bgColor = defaults.bg;
        state.textColor = defaults.text;
        state.accentColor = defaults.accent;
        document.getElementById('color-bg').value = defaults.bg;
        document.getElementById('color-text').value = defaults.text;
        document.getElementById('color-accent').value = defaults.accent;
        clearPresetActive('bg');
        clearPresetActive('text');
        clearPresetActive('accent');
      }

      // Reset glass panel visibility
      const glassPanel = document.getElementById('canvas-glass-panel');
      if (glassPanel) glassPanel.style.opacity = state.template === 'glass' ? '1' : '0';

      pushHistory();
      updateCanvas();
    });
  });

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
          }
          pushHistory();
          applyColors();
        });
      });
    });
  }
  setupColorPresets();

  document.getElementById('color-bg').addEventListener('input', e => {
    state.bgColor = e.target.value;
    clearPresetActive('bg');
    applyColors();
  });
  document.getElementById('color-bg').addEventListener('change', () => pushHistory());

  document.getElementById('color-text').addEventListener('input', e => {
    state.textColor = e.target.value;
    clearPresetActive('text');
    applyColors();
  });
  document.getElementById('color-text').addEventListener('change', () => pushHistory());

  document.getElementById('color-accent').addEventListener('input', e => {
    state.accentColor = e.target.value;
    clearPresetActive('accent');
    applyColors();
  });
  document.getElementById('color-accent').addEventListener('change', () => pushHistory());

  function clearPresetActive(target) {
    document.querySelectorAll('.color-presets[data-target="' + target + '"] .color-dot').forEach(d => d.classList.remove('active'));
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
  document.querySelectorAll('.gradient-preset').forEach(btn => {
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
    applyEffects();
  });
  if (fxShadow) fxShadow.addEventListener('change', () => pushHistory());

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

  // ============ OPTIONS ============
  document.getElementById('opt-logo').addEventListener('change', e => {
    state.showLogo = e.target.checked;
    canvasLogo.style.display = state.showLogo ? '' : 'none';
    pushHistory();
  });

  document.getElementById('opt-border').addEventListener('change', e => {
    state.showBorder = e.target.checked;
    canvasBorder.classList.toggle('visible', state.showBorder);
    pushHistory();
  });

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

  // ============ BACKGROUND IMAGE ============
  const bgInput = document.getElementById('input-bgimage');
  const bgClearBtn = document.getElementById('btn-clear-bg');
  const bgImageControls = document.getElementById('bg-image-controls');
  const uploadZone = document.getElementById('upload-zone-bg');
  const inputOpacity = document.getElementById('input-opacity');
  const opacityVal = document.getElementById('opacity-val');
  const inputBlur = document.getElementById('input-blur');
  const blurVal = document.getElementById('blur-val');

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
    canvasBgImage.style.backgroundImage = '';
    canvasBgImage.classList.remove('has-image');
    if (bgInput) bgInput.value = '';
    if (bgClearBtn) bgClearBtn.style.display = 'none';
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

  function applyBgImage() {
    canvasBgImage.style.setProperty('--overlay-opacity', state.bgOpacity / 100);
    if (state.bgBlur > 0) {
      canvasBgImage.style.filter = 'blur(' + state.bgBlur + 'px)';
      canvasBgImage.style.transform = 'scale(1.05)';
    } else {
      canvasBgImage.style.filter = '';
      canvasBgImage.style.transform = '';
    }
  }

  // ============ ZOOM ============
  const zoomVal = document.getElementById('zoom-val');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomFit = document.getElementById('btn-zoom-fit');

  function applyZoom() {
    if (zoomVal) zoomVal.textContent = state.zoom + '%';
    canvasWrapper.style.transform = 'scale(' + (state.zoom / 100) + ')';
    canvasWrapper.style.transformOrigin = 'center center';
  }

  if (btnZoomIn) btnZoomIn.addEventListener('click', () => {
    state.zoom = Math.min(200, state.zoom + 10);
    applyZoom();
  });

  if (btnZoomOut) btnZoomOut.addEventListener('click', () => {
    state.zoom = Math.max(30, state.zoom - 10);
    applyZoom();
  });

  if (btnZoomFit) btnZoomFit.addEventListener('click', () => {
    state.zoom = 100;
    applyZoom();
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
    state = getDefaultState();
    historyPaused = true;
    restoreFromState();
    historyPaused = false;
    pushHistory();
  });

  // ============ EXPORT ============
  function exportCanvas() {
    const exportW = state.format.w;
    const currentW = canvas.offsetWidth;
    const scale = exportW / currentW;

    exportOverlay.classList.add('visible');

    // Temporarily remove zoom for export
    const prevTransform = canvasWrapper.style.transform;
    canvasWrapper.style.transform = '';

    setTimeout(() => {
      html2canvas(canvas, {
        scale: scale,
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      }).then(result => {
        const link = document.createElement('a');
        link.download = 'latraverse-' + state.template + '-' + state.format.label.toLowerCase() + '-' + Date.now() + '.png';
        link.href = result.toDataURL('image/png');
        link.click();
        exportOverlay.classList.remove('visible');
        canvasWrapper.style.transform = prevTransform;
      }).catch(err => {
        console.error('Export error:', err);
        alert('Erreur lors de l\'export.');
        exportOverlay.classList.remove('visible');
        canvasWrapper.style.transform = prevTransform;
      });
    }, 100);
  }

  document.getElementById('btn-export').addEventListener('click', exportCanvas);

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
  function updateCanvas() {
    // Template
    canvas.dataset.template = state.template;
    if (infoTemplate) infoTemplate.textContent = state.template.charAt(0).toUpperCase() + state.template.slice(1);

    // Format — scale to fit viewport
    const maxW = canvasArea.clientWidth - 80;
    const maxH = canvasArea.clientHeight - 100;
    const ratio = state.format.w / state.format.h;

    let displayW, displayH;
    if (ratio >= 1) {
      displayW = Math.min(maxW, 600);
      displayH = displayW / ratio;
      if (displayH > maxH) {
        displayH = maxH;
        displayW = displayH * ratio;
      }
    } else {
      displayH = Math.min(maxH, 600);
      displayW = displayH * ratio;
      if (displayW > maxW) {
        displayW = maxW;
        displayH = displayW / ratio;
      }
    }

    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
    canvasWrapper.style.width = displayW + 'px';
    canvasWrapper.style.height = displayH + 'px';

    if (infoFormat) infoFormat.textContent = state.format.label + ' \u2014 ' + state.format.w + ' \u00d7 ' + state.format.h;

    // Scale font sizes
    const fontScale = displayW / 540;

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
    applyBgImage();
    applyDecorations();
    applyZoom();
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

    // Accent on border
    canvasBorder.style.borderColor = state.accentColor;

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
      if (state.template === 'glass') {
        glassPanel.style.opacity = '1';
      } else {
        glassPanel.style.opacity = '0';
      }
    }

    // BG image overlay color
    canvasBgImage.style.setProperty('--overlay-color', state.bgColor);
  }

  // ============ APPLY TYPOGRAPHY ============
  function applyTypography(fontScale) {
    const s = fontScale || (canvas.offsetWidth / 540);
    const fs = Math.max(0.5, Math.min(s, 1.5));

    // Headline
    canvasHeadline.style.fontFamily = state.typoHeadline.font;
    canvasHeadline.style.fontSize = (state.typoHeadline.size * fs) + 'px';
    canvasHeadline.style.fontWeight = state.typoHeadline.weight;
    canvasHeadline.style.textAlign = state.typoHeadline.align;
    canvasHeadline.style.textTransform = state.typoHeadline.case === 'none' ? '' : state.typoHeadline.case;
    canvasHeadline.style.lineHeight = (state.typoHeadline.lh / 100);
    canvasHeadline.style.letterSpacing = state.typoHeadline.ls + 'px';

    // Body
    canvasBody.style.fontFamily = state.typoBody.font;
    canvasBody.style.fontSize = (state.typoBody.size * fs) + 'px';
    canvasBody.style.fontWeight = state.typoBody.weight;

    // Subline & CTA scale
    canvasSubline.style.fontSize = (14 * fs) + 'px';
    canvasCta.style.fontSize = (12 * fs) + 'px';

    // Logo scale
    const logoSpan = canvasLogo.querySelector('span');
    if (logoSpan) logoSpan.style.fontSize = (14 * fs) + 'px';
    const logoSvg = canvasLogo.querySelector('svg');
    if (logoSvg) {
      logoSvg.style.width = (28 * fs) + 'px';
      logoSvg.style.height = (28 * fs) + 'px';
    }

    // Content alignment for some templates
    const content = canvas.querySelector('.canvas__content');
    if (state.template === 'bold' || state.template === 'promo' || state.template === 'quote' || state.template === 'glass') {
      if (content) content.style.alignItems = 'center';
      if (content) content.style.textAlign = 'center';
      canvasBody.style.textAlign = 'center';
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
  }

  // ============ APPLY EFFECTS ============
  function applyEffects() {
    let shadows = [];

    // Template-specific effects reset
    if (state.template !== 'neon') {
      // Only apply manual shadow if not neon
      if (state.fxShadow > 0) {
        shadows.push('0 ' + (state.fxShadow / 2) + 'px ' + state.fxShadow + 'px rgba(0,0,0,0.5)');
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
  }

  // ============ APPLY DECORATIONS (per template) ============
  function applyDecorations() {
    if (!canvasDecorations) return;
    canvasDecorations.innerHTML = '';

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const accent = state.accentColor;

    switch (state.template) {
      case 'editorial': {
        // Thin accent line top + bottom
        canvasDecorations.innerHTML =
          '<div style="position:absolute;top:8%;left:10%;right:10%;height:1px;background:' + accent + ';opacity:0.4"></div>' +
          '<div style="position:absolute;bottom:8%;left:10%;right:10%;height:1px;background:' + accent + ';opacity:0.4"></div>';
        break;
      }
      case 'geometric': {
        // Abstract geometric shapes
        canvasDecorations.innerHTML =
          '<div style="position:absolute;top:10%;right:10%;width:' + (w * 0.2) + 'px;height:' + (w * 0.2) + 'px;border:2px solid ' + accent + ';opacity:0.15;transform:rotate(45deg)"></div>' +
          '<div style="position:absolute;bottom:15%;left:8%;width:' + (w * 0.12) + 'px;height:' + (w * 0.12) + 'px;border-radius:50%;border:2px solid ' + accent + ';opacity:0.12"></div>' +
          '<div style="position:absolute;top:20%;left:5%;width:' + (w * 0.08) + 'px;height:' + (w * 0.08) + 'px;background:' + accent + ';opacity:0.08;transform:rotate(30deg)"></div>';
        break;
      }
      case 'duotone': {
        // Overlay gradient filter effect
        canvasDecorations.innerHTML =
          '<div style="position:absolute;inset:0;background:linear-gradient(135deg,' + accent + '20,' + state.bgColor + '40);mix-blend-mode:multiply;pointer-events:none"></div>';
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

    // Colors
    document.getElementById('color-bg').value = state.bgColor;
    document.getElementById('color-text').value = state.textColor;
    document.getElementById('color-accent').value = state.accentColor;

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

    // Options
    document.getElementById('opt-logo').checked = state.showLogo;
    document.getElementById('opt-border').checked = state.showBorder;
    document.getElementById('opt-grain').checked = state.showGrain;
    document.getElementById('opt-vignette').checked = state.showVignette;

    // BG image
    if (state.bgImage) {
      if (bgClearBtn) bgClearBtn.style.display = '';
      if (bgImageControls) bgImageControls.style.display = '';
      if (inputOpacity) { inputOpacity.value = state.bgOpacity; if (opacityVal) opacityVal.textContent = state.bgOpacity; }
      if (inputBlur) { inputBlur.value = state.bgBlur; if (blurVal) blurVal.textContent = state.bgBlur; }
    } else {
      if (bgClearBtn) bgClearBtn.style.display = 'none';
      if (bgImageControls) bgImageControls.style.display = 'none';
      if (bgInput) bgInput.value = '';
    }

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
      exportCanvas();
    }
  });

  // ============ HELPER ============
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r + ',' + g + ',' + b;
  }

  // ============ INIT ============
  updateCanvas();
  updateUndoRedoButtons();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => updateCanvas(), 100);
  });

})();
