/* ============================================================
   LA TRAVERSE — Branding Studio JS
   ============================================================ */

(function () {
  'use strict';

  // DOM refs
  const canvas = document.getElementById('canvas');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const canvasHeadline = document.getElementById('canvas-headline');
  const canvasSubline = document.getElementById('canvas-subline');
  const canvasBody = document.getElementById('canvas-body');
  const canvasCta = document.getElementById('canvas-cta');
  const canvasLogo = document.getElementById('canvas-logo');
  const canvasBorder = document.getElementById('canvas-border');
  const canvasGrain = document.getElementById('canvas-grain');
  const canvasBgImage = document.getElementById('canvas-bgimage');
  const infoFormat = document.getElementById('info-format');
  const infoTemplate = document.getElementById('info-template');

  // State
  let state = {
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
    bgImage: null,
    bgOpacity: 70,
  };

  // ---- FORMAT ----
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.format = {
        w: parseInt(btn.dataset.w),
        h: parseInt(btn.dataset.h),
        label: btn.dataset.label,
      };
      updateCanvas();
    });
  });

  // ---- TEMPLATES ----
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.template = btn.dataset.template;
      updateCanvas();
    });
  });

  // ---- TEXT INPUTS ----
  document.getElementById('input-headline').addEventListener('input', e => {
    state.headline = e.target.value;
    canvasHeadline.textContent = state.headline;
  });
  document.getElementById('input-subline').addEventListener('input', e => {
    state.subline = e.target.value;
    canvasSubline.textContent = state.subline;
  });
  document.getElementById('input-body').addEventListener('input', e => {
    state.body = e.target.value;
    canvasBody.textContent = state.body;
  });
  document.getElementById('input-cta').addEventListener('input', e => {
    state.cta = e.target.value;
    canvasCta.textContent = state.cta;
  });

  // ---- COLORS ----
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
  document.getElementById('color-text').addEventListener('input', e => {
    state.textColor = e.target.value;
    clearPresetActive('text');
    applyColors();
  });
  document.getElementById('color-accent').addEventListener('input', e => {
    state.accentColor = e.target.value;
    clearPresetActive('accent');
    applyColors();
  });

  function clearPresetActive(target) {
    document.querySelectorAll(`.color-presets[data-target="${target}"] .color-dot`).forEach(d => d.classList.remove('active'));
  }

  // ---- OPTIONS ----
  document.getElementById('opt-logo').addEventListener('change', e => {
    state.showLogo = e.target.checked;
    canvasLogo.style.display = state.showLogo ? '' : 'none';
  });
  document.getElementById('opt-border').addEventListener('change', e => {
    state.showBorder = e.target.checked;
    canvasBorder.classList.toggle('visible', state.showBorder);
  });
  document.getElementById('opt-grain').addEventListener('change', e => {
    state.showGrain = e.target.checked;
    canvasGrain.classList.toggle('visible', state.showGrain);
  });

  // Background image
  const bgInput = document.getElementById('input-bgimage');
  const bgClearBtn = document.getElementById('btn-clear-bg');
  const fieldOpacity = document.getElementById('field-opacity');

  bgInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      state.bgImage = ev.target.result;
      canvasBgImage.style.backgroundImage = `url(${state.bgImage})`;
      bgClearBtn.style.display = '';
      fieldOpacity.style.display = '';
      applyBgOpacity();
    };
    reader.readAsDataURL(file);
  });

  bgClearBtn.addEventListener('click', () => {
    state.bgImage = null;
    canvasBgImage.style.backgroundImage = '';
    bgInput.value = '';
    bgClearBtn.style.display = 'none';
    fieldOpacity.style.display = 'none';
  });

  document.getElementById('input-opacity').addEventListener('input', e => {
    state.bgOpacity = parseInt(e.target.value);
    document.getElementById('opacity-val').textContent = state.bgOpacity;
    applyBgOpacity();
  });

  function applyBgOpacity() {
    const overlay = canvasBgImage.querySelector('::after') || canvasBgImage;
    canvasBgImage.style.setProperty('--overlay-opacity', state.bgOpacity / 100);
    // Use inline style on the pseudo-element via CSS variable
    canvas.style.setProperty('--bg-overlay', `rgba(0,0,0,${state.bgOpacity / 100})`);
  }

  // ---- RESET ----
  document.getElementById('btn-reset').addEventListener('click', () => {
    state = {
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
      bgImage: null,
      bgOpacity: 70,
    };

    // Reset form inputs
    document.getElementById('input-headline').value = state.headline;
    document.getElementById('input-subline').value = state.subline;
    document.getElementById('input-body').value = state.body;
    document.getElementById('input-cta').value = state.cta;
    document.getElementById('color-bg').value = state.bgColor;
    document.getElementById('color-text').value = state.textColor;
    document.getElementById('color-accent').value = state.accentColor;
    document.getElementById('opt-logo').checked = true;
    document.getElementById('opt-border').checked = true;
    document.getElementById('opt-grain').checked = false;
    document.getElementById('input-bgimage').value = '';
    document.getElementById('btn-clear-bg').style.display = 'none';
    document.getElementById('field-opacity').style.display = 'none';

    // Reset active states
    document.querySelectorAll('.format-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    document.querySelectorAll('.template-btn').forEach((b, i) => b.classList.toggle('active', i === 0));

    canvasBgImage.style.backgroundImage = '';
    updateCanvas();
  });

  // ---- EXPORT ----
  document.getElementById('btn-export').addEventListener('click', async () => {
    // Create a full-size offscreen clone for export
    const exportW = state.format.w;
    const exportH = state.format.h;

    // Get scale factor
    const currentW = canvas.offsetWidth;
    const scale = exportW / currentW;

    try {
      const result = await html2canvas(canvas, {
        scale: scale,
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `latraverse-${state.template}-${state.format.label.toLowerCase()}-${Date.now()}.png`;
      link.href = result.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export error:', err);
      alert('Erreur lors de l\'export. Verifiez la console.');
    }
  });

  // ---- MAIN UPDATE ----
  function updateCanvas() {
    // Template
    canvas.dataset.template = state.template;
    infoTemplate.textContent = state.template.charAt(0).toUpperCase() + state.template.slice(1);

    // Format — scale to fit viewport
    const area = document.querySelector('.canvas-area');
    const maxW = area.clientWidth - 80;
    const maxH = area.clientHeight - 80;
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

    infoFormat.textContent = `${state.format.label} — ${state.format.w} \u00d7 ${state.format.h}`;

    // Scale font sizes based on display width vs reference (540px for 1080)
    const fontScale = displayW / 540;
    canvas.style.setProperty('--font-scale', fontScale);

    // Update text
    canvasHeadline.textContent = state.headline;
    canvasSubline.textContent = state.subline;
    canvasBody.textContent = state.body;
    canvasCta.textContent = state.cta;

    // Options
    canvasLogo.style.display = state.showLogo ? '' : 'none';
    canvasBorder.classList.toggle('visible', state.showBorder);
    canvasGrain.classList.toggle('visible', state.showGrain);

    applyColors();
    scaleFonts(fontScale);
  }

  function applyColors() {
    // Apply bg color if no template-specific gradient override
    const templateDefaults = {
      minimal: state.bgColor,
      bold: state.bgColor,
      gradient: `linear-gradient(160deg, ${state.accentColor} 0%, ${state.bgColor} 60%)`,
      split: state.bgColor,
      quote: state.bgColor,
      promo: state.bgColor,
    };

    const bg = templateDefaults[state.template];
    if (bg && bg.startsWith('linear-gradient')) {
      canvas.style.background = bg;
    } else {
      canvas.style.background = state.bgColor;
    }

    // Text color
    canvas.style.color = state.textColor;

    // Accent color for border, subline badge, etc.
    canvasBorder.style.borderColor = state.accentColor;

    // Split template: right panel color
    if (state.template === 'split') {
      canvas.style.setProperty('--split-accent', state.accentColor);
      // Use a pseudo-element approach via inline box-shadow
      const rightPanel = canvas.querySelector('.canvas__content');
      if (rightPanel) {
        canvas.style.boxShadow = `inset -${canvas.offsetWidth * 0.4}px 0 0 0 ${state.accentColor}`;
      }
    } else {
      canvas.style.boxShadow = 'none';
    }

    // Promo template: subline badge bg
    if (state.template === 'promo') {
      canvasSubline.style.background = state.accentColor;
      canvasSubline.style.color = '#fff';
    } else {
      canvasSubline.style.background = '';
      canvasSubline.style.color = '';
    }

    // BG image overlay
    if (state.bgImage) {
      const afterStyle = `rgba(${hexToRgb(state.bgColor)},${state.bgOpacity / 100})`;
      canvasBgImage.style.setProperty('--overlay-bg', afterStyle);
    }
  }

  function scaleFonts(scale) {
    const s = Math.max(0.5, Math.min(scale, 1.5));
    canvasHeadline.style.fontSize = '';
    canvasSubline.style.fontSize = '';
    canvasBody.style.fontSize = '';
    canvasCta.style.fontSize = '';
    canvasLogo.style.fontSize = '';

    // Let CSS handle base sizes, just scale the container font-size
    canvas.style.fontSize = (16 * s) + 'px';
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }

  // ---- AI IMAGE GENERATION ----
  const aiPrompt = document.getElementById('ai-prompt');
  const btnGenerate = document.getElementById('btn-generate-ai');
  const btnGenerateText = document.getElementById('btn-generate-text');
  const aiResult = document.getElementById('ai-result');
  const aiResultImg = document.getElementById('ai-result-img');
  const aiError = document.getElementById('ai-error');

  btnGenerate.addEventListener('click', async () => {
    const prompt = aiPrompt.value.trim();
    if (!prompt) {
      aiPrompt.focus();
      return;
    }

    // Loading state
    btnGenerate.disabled = true;
    btnGenerate.classList.add('loading');
    btnGenerateText.textContent = 'Generation en cours...';
    aiResult.style.display = 'none';
    aiError.style.display = 'none';

    try {
      const res = await fetch('/api/branding/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      // Show result
      aiResultImg.src = data.url;
      aiResult.style.display = '';

      // Refresh gallery if it exists
      loadGallery();

    } catch (err) {
      aiError.textContent = err.message;
      aiError.style.display = '';
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.classList.remove('loading');
      btnGenerateText.textContent = 'Generer l\'image';
    }
  });

  // Use AI image as background
  document.getElementById('btn-ai-bg').addEventListener('click', () => {
    const url = aiResultImg.src;
    if (!url) return;
    state.bgImage = url;
    canvasBgImage.style.backgroundImage = `url(${url})`;
    document.getElementById('btn-clear-bg').style.display = '';
    document.getElementById('field-opacity').style.display = '';
    applyBgOpacity();
  });

  // Save to gallery (already saved server-side, just confirm)
  document.getElementById('btn-ai-save').addEventListener('click', () => {
    const btn = document.getElementById('btn-ai-save');
    btn.textContent = 'Sauvegardee !';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Sauvegarder';
      btn.disabled = false;
    }, 2000);
  });

  // ---- IMAGE GALLERY ----
  function loadGallery() {
    fetch('/api/branding/images')
      .then(r => r.json())
      .then(data => {
        const gallery = document.getElementById('image-gallery');
        const hint = document.getElementById('gallery-hint');
        if (!data.images || data.images.length === 0) {
          gallery.innerHTML = '';
          hint.style.display = 'none';
          return;
        }
        hint.style.display = '';
        gallery.innerHTML = data.images.map(img => `
          <div class="gallery-thumb" data-url="${img.url}" title="${img.filename}">
            <img src="${img.url}" alt="${img.filename}" loading="lazy">
            <button class="gallery-thumb__delete" data-filename="${img.filename}">&times;</button>
          </div>
        `).join('');

        // Click to set as BG
        gallery.querySelectorAll('.gallery-thumb').forEach(thumb => {
          thumb.addEventListener('click', (e) => {
            if (e.target.closest('.gallery-thumb__delete')) return;
            const url = thumb.dataset.url;
            state.bgImage = url;
            canvasBgImage.style.backgroundImage = `url(${url})`;
            document.getElementById('btn-clear-bg').style.display = '';
            document.getElementById('field-opacity').style.display = '';
            applyBgOpacity();
          });
        });

        // Delete button
        gallery.querySelectorAll('.gallery-thumb__delete').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const filename = btn.dataset.filename;
            await fetch('/api/branding/images/' + encodeURIComponent(filename), { method: 'DELETE' });
            loadGallery();
          });
        });
      })
      .catch(() => {});
  }
  loadGallery();

  // Initial render
  updateCanvas();

  // Resize handling
  window.addEventListener('resize', () => updateCanvas());

})();
