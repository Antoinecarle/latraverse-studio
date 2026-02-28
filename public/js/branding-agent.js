/* ============================================================
   LA TRAVERSE — Creative Agent (Realtime Voice + Text Chat)
   True speech-to-speech via OpenAI Realtime API.
   Text chat via /api/agent/chat as fallback.
   One conversation per pub — persisted server-side.
   ============================================================ */

(function () {
  'use strict';

  // ============ STATE ============
  let voiceMode = false;
  let voiceConnecting = false;    // true while startVoiceMode() is in progress — prevents double sessions
  let isProcessing = false;
  let isSpeaking = false;
  let chatOpen = false;
  let realtimeClient = null;
  let currentTranscript = '';      // accumulates AI transcript deltas
  let transcriptMsgEl = null;     // DOM element for streaming AI transcript

  // ============ DOM REFS ============
  const agentBtn = document.getElementById('agent-btn');
  const agentPanel = document.getElementById('agent-panel');
  const agentMessages = document.getElementById('agent-messages');
  const agentInput = document.getElementById('agent-input');
  const agentSend = document.getElementById('agent-send');
  const agentMic = document.getElementById('agent-mic');
  const agentClose = document.getElementById('agent-close');
  const agentClear = document.getElementById('agent-clear');
  const agentStatus = document.getElementById('agent-status');

  if (!agentBtn) return;

  // ============ REALTIME VOICE MODE ============

  async function startVoiceMode() {
    // Prevent double sessions — if already connecting or connected, bail out
    if (voiceMode || voiceConnecting) return;
    voiceConnecting = true;

    // Open panel if closed
    if (!chatOpen) {
      agentPanel.classList.add('open');
      chatOpen = true;
      agentBtn.classList.add('active');
      loadConversation();
    }

    setStatus('Connexion...');
    agentBtn.classList.add('thinking');

    try {
      // Request mic permission
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create Realtime client
      realtimeClient = new RealtimeClient({
        onSessionCreated: function () {
          console.log('[Agent] Realtime session created — server handles config');
        },

        onAudioDelta: function () {
          if (!isSpeaking) {
            isSpeaking = true;
            agentBtn.classList.add('speaking');
            agentBtn.classList.remove('listening', 'thinking');
            setStatus('Agent parle...');
          }
        },

        onTranscriptDelta: function (delta) {
          // Stream AI transcript into chat
          currentTranscript += delta;
          if (!transcriptMsgEl) {
            transcriptMsgEl = createStreamingMessage('assistant');
          }
          updateStreamingMessage(transcriptMsgEl, currentTranscript);
        },

        onInputTranscript: function (transcript) {
          // User's speech was transcribed — show in chat
          if (transcript && transcript.trim()) {
            addMessage('user', transcript.trim());
          }
        },

        onSpeechStarted: function () {
          // User started talking — show listening state
          agentBtn.classList.add('listening');
          agentBtn.classList.remove('speaking', 'thinking');
          setStatus("Je t'ecoute...");
          isSpeaking = false;
          // Finalize any streaming AI message
          finalizeStreamingMessage();
        },

        onSpeechStopped: function () {
          agentBtn.classList.remove('listening');
          agentBtn.classList.add('thinking');
          setStatus('Reflexion...');
        },

        onFunctionCall: function (call) {
          console.log('[Agent] Function call:', call.name, call.arguments);
          try {
            var args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
            executeAction({ function: call.name, arguments: args });
            // Force save after AI modifies the design
            if (window.__brandingScheduleSave) window.__brandingScheduleSave();
            // Send result back so the AI can continue
            realtimeClient.sendFunctionResult(call.callId, { success: true, action: call.name });
          } catch (e) {
            console.error('[Agent] Function call error:', e);
            realtimeClient.sendFunctionResult(call.callId, { success: false, error: e.message });
          }
        },

        onResponseDone: function () {
          isSpeaking = false;
          agentBtn.classList.remove('speaking', 'thinking');
          agentBtn.classList.add('listening');
          setStatus("Je t'ecoute...");
          // Finalize any streaming AI message
          finalizeStreamingMessage();
        },

        onResponseCreated: function () {
          agentBtn.classList.add('thinking');
          agentBtn.classList.remove('listening');
          setStatus('Reflexion...');
        },

        onError: function (err) {
          console.error('[Agent] Realtime error:', err);
          var msg = err.message || err.code || 'Erreur connexion';
          addMessage('assistant', 'Erreur: ' + msg);
          setStatus('Erreur');
        },

        onClose: function () {
          if (voiceMode) {
            console.log('[Agent] Connection closed unexpectedly');
            stopVoiceMode();
            addMessage('assistant', 'Connexion perdue. Clique sur le micro pour recommencer.');
          }
        },
      });

      // Connect WebSocket
      await realtimeClient.connect();

      // Send init with design state — server will configure session with tools + instructions
      realtimeClient.sendInit(getDesignState());

      // Start audio capture
      await realtimeClient.startAudioCapture(stream);

      voiceMode = true;
      voiceConnecting = false;
      agentBtn.classList.remove('thinking');
      agentBtn.classList.add('voice-active', 'listening');
      agentMic.classList.add('voice-active');
      setStatus("Je t'ecoute...");

    } catch (err) {
      console.error('[Agent] Failed to start voice mode:', err);
      voiceConnecting = false;
      agentBtn.classList.remove('thinking');
      if (err.name === 'NotAllowedError') {
        addMessage('assistant', 'Micro refuse. Autorise le micro dans ton navigateur.');
        setStatus('Micro refuse');
      } else {
        addMessage('assistant', 'Impossible de demarrer le mode vocal: ' + err.message);
        setStatus('Erreur');
      }
      if (realtimeClient) {
        realtimeClient.disconnect();
        realtimeClient = null;
      }
    }
  }

  function stopVoiceMode() {
    voiceMode = false;
    isSpeaking = false;
    agentBtn.classList.remove('voice-active', 'listening', 'speaking', 'thinking');
    agentMic.classList.remove('voice-active', 'listening');

    // Force save all pending changes before disconnecting
    if (window.__brandingForceSave) window.__brandingForceSave();

    if (realtimeClient) {
      realtimeClient.disconnect();
      realtimeClient = null;
    }

    finalizeStreamingMessage();
    setStatus('');
  }

  // ============ STREAMING MESSAGE HELPERS ============
  function createStreamingMessage(role) {
    var div = document.createElement('div');
    div.className = 'agent-msg agent-msg--' + role + ' agent-msg--streaming';
    if (role === 'assistant') {
      div.innerHTML = '<div class="agent-msg__avatar">AI</div><div class="agent-msg__text"></div>';
    } else {
      div.innerHTML = '<div class="agent-msg__text"></div>';
    }
    agentMessages.appendChild(div);
    agentMessages.scrollTop = agentMessages.scrollHeight;
    return div;
  }

  function updateStreamingMessage(el, text) {
    if (!el) return;
    var textEl = el.querySelector('.agent-msg__text');
    if (textEl) textEl.textContent = text;
    agentMessages.scrollTop = agentMessages.scrollHeight;
  }

  function finalizeStreamingMessage() {
    if (transcriptMsgEl) {
      transcriptMsgEl.classList.remove('agent-msg--streaming');
      transcriptMsgEl = null;
    }
    currentTranscript = '';
  }

  // ============ UI HELPERS ============
  function setStatus(text) {
    if (agentStatus) agentStatus.textContent = text;
  }

  function addMessage(role, content) {
    var div = document.createElement('div');
    div.className = 'agent-msg agent-msg--' + role;

    if (role === 'assistant') {
      div.innerHTML = '<div class="agent-msg__avatar">AI</div><div class="agent-msg__text">' + escapeHtml(content) + '</div>';
    } else {
      div.innerHTML = '<div class="agent-msg__text">' + escapeHtml(content) + '</div>';
    }

    agentMessages.appendChild(div);
    agentMessages.scrollTop = agentMessages.scrollHeight;
  }

  function addTypingIndicator() {
    var div = document.createElement('div');
    div.className = 'agent-msg agent-msg--assistant agent-msg--typing';
    div.id = 'agent-typing';
    div.innerHTML = '<div class="agent-msg__avatar">AI</div><div class="agent-msg__text"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
    agentMessages.appendChild(div);
    agentMessages.scrollTop = agentMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    var el = document.getElementById('agent-typing');
    if (el) el.remove();
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============ GET CURRENT DESIGN STATE ============
  function getDesignState() {
    if (window.__brandingState) return window.__brandingState();
    return null;
  }

  function getCurrentPubId() {
    if (window.__brandingPubId) return window.__brandingPubId();
    return null;
  }

  // ============ LOAD CONVERSATION FROM SERVER ============
  async function loadConversation() {
    var pubId = getCurrentPubId();
    if (!pubId) return;

    try {
      var res = await fetch('/api/conversations/' + pubId);
      var data = await res.json();
      agentMessages.innerHTML = '';

      if (data.messages && data.messages.length > 0) {
        for (var msg of data.messages) {
          var cleanContent = msg.content.replace(/\n\[Actions:.*\]$/, '');
          addMessage(msg.role, cleanContent);
        }
      } else {
        addMessage('assistant', 'Salut ! Je suis ton partenaire creatif. Clique sur le micro pour discuter a voix, ou tape ton message.');
      }
    } catch (e) {
      console.error('[Agent] Load conversation error:', e);
      addMessage('assistant', 'Salut ! Parle-moi de ce que tu veux creer.');
    }
  }

  // ============ SEND MESSAGE (text chat fallback) ============
  async function sendMessage(text) {
    if (!text || isProcessing) return;

    isProcessing = true;
    agentInput.value = '';
    setStatus('Reflexion...');
    agentBtn.classList.add('thinking');
    agentBtn.classList.remove('listening');

    addMessage('user', text);
    addTypingIndicator();

    try {
      var res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          designState: getDesignState(),
          pubId: getCurrentPubId(),
        }),
      });

      removeTypingIndicator();

      if (!res.ok) {
        var err = await res.json().catch(function () { return { error: 'Erreur reseau' }; });
        addMessage('assistant', 'Desole, une erreur est survenue : ' + (err.error || 'Erreur inconnue'));
        isProcessing = false;
        agentBtn.classList.remove('thinking');
        return;
      }

      var data = await res.json();

      // Execute actions first
      if (data.actions && data.actions.length > 0) {
        for (var action of data.actions) {
          executeAction(action);
        }
        // Force save after AI modifies the design
        if (window.__brandingForceSave) window.__brandingForceSave();
      }

      // Show text response
      if (data.text) {
        addMessage('assistant', data.text);
      }

    } catch (err) {
      removeTypingIndicator();
      addMessage('assistant', 'Erreur de connexion.');
      console.error('[Agent] Send error:', err);
    } finally {
      isProcessing = false;
      agentBtn.classList.remove('thinking');
      setStatus('');
    }
  }

  // ============ ACTION RUNNER ============
  function executeAction(action) {
    var fn = action.function;
    var args = action.arguments || {};

    var canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.classList.add('agent-highlight');
      setTimeout(function () { canvas.classList.remove('agent-highlight'); }, 600);
    }

    switch (fn) {
      case 'setTemplate': {
        var btn = document.querySelector('.template-btn[data-template="' + args.template + '"]');
        if (btn) btn.click();
        break;
      }
      case 'setStylePack': {
        var btn = document.querySelector('.style-pack-btn[data-pack="' + args.pack + '"]');
        if (btn) btn.click();
        break;
      }
      case 'setColors': {
        // Direct state update — bypasses fragile DOM color input events
        if (window.__brandingSetColors) {
          window.__brandingSetColors(args);
        } else {
          if (args.bgColor) { triggerColor('color-bg', args.bgColor); }
          if (args.textColor) { triggerColor('color-text', args.textColor); }
          if (args.accentColor) { triggerColor('color-accent', args.accentColor); }
          if (args.accentColor2) { triggerColor('color-accent2', args.accentColor2); }
        }
        break;
      }
      case 'setText': {
        if (args.headline !== undefined) triggerInput('input-headline', args.headline);
        if (args.subline !== undefined) triggerInput('input-subline', args.subline);
        if (args.body !== undefined) triggerInput('input-body', args.body);
        if (args.cta !== undefined) triggerInput('input-cta', args.cta);
        break;
      }
      case 'setTypography': {
        var fontMap = {
          // ════ VELVETYNE — Fonderie artiste open-source ════
          'Bluu Next': "'Bluu Next', serif",
          'Bluu Next Titling': "'Bluu Next Titling', serif",
          'Trickster': "'Trickster', fantasy",
          'Lack': "'Lack', sans-serif",
          'VG5000': "'VG5000', monospace",
          'Commune Nuit Debout': "'Commune Nuit Debout', sans-serif",
          'Commune Nuit Debout Pochoir': "'Commune Nuit Debout Pochoir', sans-serif",
          'Sporting Grotesque': "'Sporting Grotesque', sans-serif",
          // ════ FONTSHARE — Indian Type Foundry artiste ════
          'Clash Display': "'Clash Display', sans-serif",
          'Zodiak': "'Zodiak', serif",
          'Boska': "'Boska', serif",
          'Panchang': "'Panchang', sans-serif",
          'Nippo': "'Nippo', sans-serif",
          'Array': "'Array', sans-serif",
          'Gambarino': "'Gambarino', serif",
          'Erode': "'Erode', serif",
          'Supreme': "'Supreme', serif",
          'Chillax': "'Chillax', sans-serif",
          'Ranade': "'Ranade', sans-serif",
          'Tanker': "'Tanker', sans-serif",
          'Sentient': "'Sentient', serif",
          'Stardom': "'Stardom', serif",
          'Melodrama': "'Melodrama', serif",
          'Plein': "'Plein', sans-serif",
          'Bonny': "'Bonny', serif",
          'Alpino': "'Alpino', sans-serif",
          'Telma': "'Telma', serif",
          'Switzer': "'Switzer', sans-serif",
          'General Sans': "'General Sans', sans-serif",
          'Satoshi': "'Satoshi', sans-serif",
          'Cabinet Grotesk': "'Cabinet Grotesk', sans-serif",
          // ════ GOOGLE — Experimental / Glitch / Pixel ════
          'Rubik Glitch': "'Rubik Glitch', system-ui",
          'Bungee Shade': "'Bungee Shade', system-ui",
          'Bungee Inline': "'Bungee Inline', system-ui",
          'Bungee Outline': "'Bungee Outline', system-ui",
          'Nabla': "'Nabla', system-ui",
          'Pixelify Sans': "'Pixelify Sans', system-ui",
          'Silkscreen': "'Silkscreen', system-ui",
          'Press Start 2P': "'Press Start 2P', monospace",
          'Foldit': "'Foldit', system-ui",
          'Fascinate': "'Fascinate', system-ui",
          'Fascinate Inline': "'Fascinate Inline', system-ui",
          'Major Mono Display': "'Major Mono Display', monospace",
          'Monoton': "'Monoton', cursive",
          'Megrim': "'Megrim', cursive",
          'Cinzel Decorative': "'Cinzel Decorative', serif",
          'Poiret One': "'Poiret One', cursive",
          // ════ SERIF (élégant, éditorial, luxe) ════
          'Playfair Display': "'Playfair Display', serif",
          'DM Serif Display': "'DM Serif Display', serif",
          'Libre Baskerville': "'Libre Baskerville', serif",
          'Lora': "'Lora', serif",
          'Young Serif': "'Young Serif', serif",
          'Fraunces': "'Fraunces', serif",
          'EB Garamond': "'EB Garamond', serif",
          'Alegreya': "'Alegreya', serif",
          'Newsreader': "'Newsreader', serif",
          // ════ SANS-SERIF (moderne, clean, pro) ════
          'Inter': "'Inter', sans-serif",
          'Instrument Sans': "'Instrument Sans', sans-serif",
          'Poppins': "'Poppins', sans-serif",
          'Montserrat': "'Montserrat', sans-serif",
          'Raleway': "'Raleway', sans-serif",
          'Plus Jakarta Sans': "'Plus Jakarta Sans', sans-serif",
          'DM Sans': "'DM Sans', sans-serif",
          'Work Sans': "'Work Sans', sans-serif",
          'Outfit': "'Outfit', sans-serif",
          'Space Grotesk': "'Space Grotesk', sans-serif",
          // ════ DISPLAY (impact, titres, poster) ════
          'Bebas Neue': "'Bebas Neue', sans-serif",
          'Oswald': "'Oswald', sans-serif",
          'Syne': "'Syne', sans-serif",
          'Unbounded': "'Unbounded', sans-serif",
          'Orbitron': "'Orbitron', sans-serif",
          'Bricolage Grotesque': "'Bricolage Grotesque', sans-serif",
          'League Spartan': "'League Spartan', sans-serif",
          'Archivo Black': "'Archivo Black', sans-serif",
          // ════ MONO (code, tech, rétro) ════
          'Space Mono': "'Space Mono', monospace",
        };
        // Direct state update if available
        if (window.__brandingSetTypography) {
          var typoArgs = { target: args.target };
          if (args.font) typoArgs.font = fontMap[args.font] || args.font;
          if (args.size) typoArgs.size = args.size;
          if (args.weight) typoArgs.weight = args.weight;
          if (args.align) typoArgs.align = args.align;
          if (args.textCase) typoArgs.textCase = args.textCase;
          window.__brandingSetTypography(typoArgs);
        } else {
          var prefix = args.target === 'body' ? 'typo-body' : 'typo-headline';
          if (args.font) triggerSelect(prefix + '-font', fontMap[args.font] || args.font);
          if (args.size) triggerRange(prefix + '-size', args.size);
          if (args.weight) triggerSelect(prefix + '-weight', args.weight);
        }
        if (args.align) {
          var abtn = document.querySelector('.align-btn[data-target="headline"][data-align="' + args.align + '"]');
          if (abtn) abtn.click();
        }
        if (args.textCase) {
          var cbtn = document.querySelector('.case-btn[data-case="' + args.textCase + '"]');
          if (cbtn) cbtn.click();
        }
        break;
      }
      case 'toggleEffect': {
        var effectMap = { grain: 'opt-grain', vignette: 'opt-vignette', border: 'opt-border', logo: 'opt-logo', outline: 'fx-outline', gradient: 'opt-gradient' };
        var el = document.getElementById(effectMap[args.effect]);
        if (el && el.checked !== args.enabled) { el.checked = args.enabled; el.dispatchEvent(new Event('change')); }
        break;
      }
      case 'setEffectValues': {
        if (args.shadow !== undefined) triggerRange('fx-shadow', args.shadow);
        if (args.glow !== undefined) triggerRange('fx-glow', args.glow);
        break;
      }
      case 'setGradient': {
        if (window.__brandingSetGradient) {
          window.__brandingSetGradient(args);
        } else {
          var optG = document.getElementById('opt-gradient');
          if (optG && optG.checked !== args.enabled) { optG.checked = args.enabled; optG.dispatchEvent(new Event('change')); }
          if (args.start) triggerColor('gradient-start', args.start);
          if (args.end) triggerColor('gradient-end', args.end);
          if (args.angle !== undefined) triggerRange('gradient-angle', args.angle);
        }
        break;
      }
      case 'setFormat': {
        var fmtMap = { post: { w: '1080', h: '1080' }, story: { w: '1080', h: '1920' }, landscape: { w: '1920', h: '1080' }, banner: { w: '1200', h: '628' }, square: { w: '1080', h: '1080' } };
        var f = fmtMap[args.format];
        if (f) { var fbtn = document.querySelector('.format-btn[data-w="' + f.w + '"][data-h="' + f.h + '"]'); if (fbtn) fbtn.click(); }
        break;
      }
      case 'generateBackgroundImage': {
        // Generate image AND auto-apply it as background
        (async function () {
          try {
            var canvas = document.getElementById('canvas');
            if (canvas) canvas.classList.add('agent-highlight');

            var res = await fetch('/api/branding/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: args.prompt }),
            });
            var data = await res.json();
            if (data.success && data.url) {
              // Auto-apply as background via direct state update
              if (window.__brandingSetBgImage) {
                window.__brandingSetBgImage(data.url);
              }
              // Also update the preview in the sidebar
              var aiResultImg = document.getElementById('ai-result-img');
              var aiResult = document.getElementById('ai-result');
              if (aiResultImg) aiResultImg.src = data.url;
              if (aiResult) aiResult.style.display = '';
            }
          } catch (e) {
            console.error('[Agent] Background image generation failed:', e);
          }
        })();
        break;
      }
      case 'generateSticker': {
        // Direct API call — bypasses fragile button clicks
        (async function () {
          try {
            var res = await fetch('/api/branding/generate-sticker', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: args.prompt,
                category: args.category || 'icon',
                tone: args.tone || 'flat',
              }),
            });
            var data = await res.json();
            if (data.success && data.url && window.__brandingAddAiSticker) {
              window.__brandingAddAiSticker(data.url, {
                x: args.x || 50,
                y: args.y || 50,
                size: args.size || 90,
              });
            }
          } catch (e) {
            console.error('[Agent] Sticker generation failed:', e);
          }
        })();
        break;
      }
      case 'generateSvgAnimation': {
        // Direct API call — bypasses fragile button clicks
        (async function () {
          try {
            var res = await fetch('/api/branding/generate-svg-animation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: args.prompt,
                type: args.type || 'illustration',
                style: args.style || 'organic',
              }),
            });
            var data = await res.json();
            if (data.success && data.svg && window.__brandingAddSvg) {
              window.__brandingAddSvg(data.svg, {
                x: args.x || 50,
                y: args.y || 50,
                size: args.size || 120,
              });
            }
          } catch (e) {
            console.error('[Agent] SVG animation generation failed:', e);
          }
        })();
        break;
      }
      case 'addSticker': {
        if (window.__brandingAddSticker) {
          window.__brandingAddSticker(args.sticker, {
            x: args.x,
            y: args.y,
            layer: args.layer,
          });
        }
        break;
      }
      case 'clearStickers': {
        if (window.__brandingClearStickers) window.__brandingClearStickers();
        break;
      }
      case 'setBorderStyle': {
        if (window.__brandingSetBorderStyle) window.__brandingSetBorderStyle(args);
        break;
      }
      case 'setSublineStyle': {
        if (window.__brandingSetSublineStyle) window.__brandingSetSublineStyle(args.style);
        break;
      }
      case 'setCtaStyle': {
        if (window.__brandingSetCtaStyle) window.__brandingSetCtaStyle(args);
        break;
      }
      case 'setHeadlineDecoration': {
        if (window.__brandingSetHeadlineDecoration) window.__brandingSetHeadlineDecoration(args.decoration);
        break;
      }
      case 'setPattern': {
        if (window.__brandingSetPattern) window.__brandingSetPattern(args);
        break;
      }
      case 'setOverlay': {
        if (window.__brandingSetOverlay) window.__brandingSetOverlay(args);
        break;
      }
      case 'setContentAlign': {
        if (window.__brandingSetContentAlign) window.__brandingSetContentAlign(args.align);
        break;
      }
      case 'toggleElement': {
        if (window.__brandingToggleElement) window.__brandingToggleElement(args.element, args.show);
        break;
      }
      case 'exportDesign': {
        var ebtn = document.getElementById('btn-export');
        if (ebtn) ebtn.click();
        break;
      }
      case 'newDesign': {
        if (window.__brandingNewPub) window.__brandingNewPub(args.name || 'Sans titre');
        break;
      }
      case 'resetDesign': {
        var rbtn = document.getElementById('btn-reset');
        if (rbtn) rbtn.click();
        break;
      }
      case 'undoRedo': {
        var ubtn = document.getElementById(args.action === 'undo' ? 'btn-undo' : 'btn-redo');
        if (ubtn) ubtn.click();
        break;
      }
      case 'setBgImageSettings': {
        if (args.opacity !== undefined) triggerRange('input-opacity', args.opacity);
        if (args.blur !== undefined) triggerRange('input-blur', args.blur);
        break;
      }
      default:
        console.warn('[Agent] Unknown action:', fn);
    }
  }

  // DOM helper — trigger color input
  function triggerColor(id, val) {
    var el = document.getElementById(id);
    if (el) { el.value = val; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); }
  }
  // DOM helper — trigger text input
  function triggerInput(id, val) {
    var el = document.getElementById(id);
    if (el) { el.value = val; el.dispatchEvent(new Event('input')); }
  }
  // DOM helper — trigger range/slider
  function triggerRange(id, val) {
    var el = document.getElementById(id);
    if (el) { el.value = val; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); }
  }
  // DOM helper — trigger select
  function triggerSelect(id, val) {
    var el = document.getElementById(id);
    if (el) { el.value = val; el.dispatchEvent(new Event('change')); }
  }

  // ============ EVENT HANDLERS ============

  // FAB button — toggle voice mode
  agentBtn.addEventListener('click', function () {
    if (voiceMode) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  });

  // Close button — also stops voice mode
  if (agentClose) {
    agentClose.addEventListener('click', function () {
      stopVoiceMode();
      agentPanel.classList.remove('open');
      chatOpen = false;
      agentBtn.classList.remove('active');
    });
  }

  // Clear conversation
  if (agentClear) {
    agentClear.addEventListener('click', async function () {
      var pubId = getCurrentPubId();
      if (pubId) {
        await fetch('/api/conversations/' + pubId, { method: 'DELETE' });
      }
      agentMessages.innerHTML = '';
      addMessage('assistant', 'Conversation effacee. On repart de zero !');
    });
  }

  // Send button (text mode)
  if (agentSend) {
    agentSend.addEventListener('click', function () {
      var text = agentInput.value.trim();
      if (text) sendMessage(text);
    });
  }

  // Enter to send (text mode)
  if (agentInput) {
    agentInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        var text = agentInput.value.trim();
        if (text) sendMessage(text);
      }
    });
  }

  // Mic button in panel — toggle voice mode
  if (agentMic) {
    agentMic.addEventListener('click', function () {
      if (voiceMode) {
        stopVoiceMode();
      } else {
        startVoiceMode();
      }
    });
  }

  // Listen for pub changes to reload conversation
  window.addEventListener('branding-pub-changed', function () {
    if (chatOpen) loadConversation();
    // If voice mode is active, send updated design state to server relay
    if (voiceMode && realtimeClient) {
      realtimeClient.sendDesignStateUpdate(getDesignState());
    }
  });

})();
