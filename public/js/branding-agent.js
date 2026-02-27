/* ============================================================
   LA TRAVERSE — Creative Agent (Continuous Voice Chat)
   Real voice conversation: you talk, AI responds vocally, loop.
   One conversation per pub — persisted server-side.
   ============================================================ */

(function () {
  'use strict';

  // ============ STATE ============
  let voiceMode = false;       // continuous voice conversation active
  let isListening = false;     // speech recognition currently running
  let isProcessing = false;    // waiting for AI response
  let isSpeaking = false;      // TTS currently speaking
  let recognition = null;
  let synthesis = window.speechSynthesis;
  let chatOpen = false;
  let frVoice = null;          // cached French voice
  let silenceTimer = null;     // detect end of speech via silence

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

  // ============ SPEECH RECOGNITION SETUP ============
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;         // KEY: never stops on its own
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      isListening = true;
      agentMic.classList.add('listening');
      agentBtn.classList.add('listening');
      setStatus('Je t\'ecoute...');
    };

    recognition.onresult = function (event) {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      // Show interim text in the input field as user speaks
      if (interim) {
        agentInput.value = interim;
        // Reset silence timer — user is still talking
        clearTimeout(silenceTimer);
      }

      if (finalTranscript) {
        var text = finalTranscript.trim();
        if (text) {
          agentInput.value = '';
          // Pause recognition while processing (will auto-resume after AI speaks)
          pauseListening();
          sendMessage(text);
        }
      }
    };

    recognition.onerror = function (event) {
      console.error('[Agent] Speech error:', event.error);
      if (event.error === 'not-allowed') {
        setStatus('Micro refuse — autorise le micro');
        stopVoiceMode();
      } else if (event.error === 'no-speech') {
        // No speech detected — just restart if voice mode is on
        if (voiceMode && !isProcessing && !isSpeaking) {
          restartListening();
        }
      } else if (event.error === 'aborted') {
        // Normal when we stop/restart
      } else {
        // Network or other error — try to restart
        if (voiceMode) {
          setTimeout(restartListening, 500);
        }
      }
    };

    recognition.onend = function () {
      isListening = false;
      agentMic.classList.remove('listening');
      agentBtn.classList.remove('listening');

      // Auto-restart if voice mode is still active and we're not processing/speaking
      if (voiceMode && !isProcessing && !isSpeaking) {
        setTimeout(restartListening, 300);
      } else if (!voiceMode) {
        setStatus('');
      }
    };
  }

  // ============ VOICE MODE CONTROL ============
  function startVoiceMode() {
    if (!recognition) {
      addMessage('assistant', 'La reconnaissance vocale n\'est pas supportee par ce navigateur. Utilise Chrome.');
      return;
    }

    // Open panel if closed
    if (!chatOpen) {
      agentPanel.classList.add('open');
      chatOpen = true;
      agentBtn.classList.add('active');
      loadConversation();
    }

    // IMPORTANT: Request mic permission FIRST via getUserMedia
    // This triggers Chrome's permission popup. SpeechRecognition alone doesn't always do it.
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        // Permission granted — stop the stream (we don't need it, SpeechRecognition handles audio)
        stream.getTracks().forEach(function (t) { t.stop(); });

        voiceMode = true;
        agentBtn.classList.add('voice-active');
        agentMic.classList.add('voice-active');
        startListening();
      })
      .catch(function (err) {
        console.error('[Agent] Mic permission denied:', err);
        addMessage('assistant', 'Micro refuse. Autorise le micro dans ton navigateur (icone cadenas en haut a gauche).');
        setStatus('Micro refuse');
      });
  }

  function stopVoiceMode() {
    voiceMode = false;
    agentBtn.classList.remove('voice-active', 'listening');
    agentMic.classList.remove('voice-active', 'listening');
    clearTimeout(silenceTimer);

    if (isListening) {
      try { recognition.stop(); } catch (e) {}
    }
    if (isSpeaking) {
      synthesis.cancel();
      isSpeaking = false;
    }
    setStatus('');
  }

  function startListening() {
    if (isListening || isProcessing || isSpeaking) return;
    try {
      recognition.start();
    } catch (e) {
      // Already started — ignore
      console.warn('[Agent] Recognition start error:', e.message);
    }
  }

  function pauseListening() {
    if (isListening) {
      try { recognition.stop(); } catch (e) {}
    }
  }

  function restartListening() {
    if (!voiceMode || isProcessing || isSpeaking || isListening) return;
    setStatus('Je t\'ecoute...');
    try {
      recognition.start();
    } catch (e) {
      // If it fails, try again after a short delay
      setTimeout(() => {
        if (voiceMode && !isListening && !isProcessing && !isSpeaking) {
          try { recognition.start(); } catch (e2) {}
        }
      }, 500);
    }
  }

  // ============ SPEECH SYNTHESIS (TTS) ============
  function speak(text) {
    if (!synthesis || !text) {
      onSpeakEnd();
      return;
    }

    synthesis.cancel();
    isSpeaking = true;
    agentBtn.classList.add('speaking');
    agentBtn.classList.remove('listening');
    setStatus('Agent parle...');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.08;
    utterance.pitch = 1;

    if (frVoice) utterance.voice = frVoice;

    utterance.onend = onSpeakEnd;
    utterance.onerror = onSpeakEnd;

    synthesis.speak(utterance);
  }

  function onSpeakEnd() {
    isSpeaking = false;
    agentBtn.classList.remove('speaking');

    // Auto-restart listening after AI finishes speaking
    if (voiceMode && !isProcessing) {
      setTimeout(restartListening, 400);
    }
  }

  // Load/cache French voice
  function loadVoices() {
    if (!synthesis) return;
    var voices = synthesis.getVoices();
    frVoice = voices.find(function (v) { return v.lang.startsWith('fr') && v.name.includes('Google'); })
      || voices.find(function (v) { return v.lang.startsWith('fr'); });
  }

  if (synthesis) {
    synthesis.onvoiceschanged = loadVoices;
    loadVoices();
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
        addMessage('assistant', 'Salut ! Je suis ton partenaire creatif. Dis-moi ce que tu veux faire, ou discutons ensemble de tes idees.');
      }
    } catch (e) {
      console.error('[Agent] Load conversation error:', e);
      addMessage('assistant', 'Salut ! Parle-moi de ce que tu veux creer.');
    }
  }

  // ============ SEND MESSAGE ============
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
        if (voiceMode) setTimeout(restartListening, 500);
        return;
      }

      var data = await res.json();

      // Execute actions first (so the canvas updates before the voice response)
      if (data.actions && data.actions.length > 0) {
        for (var action of data.actions) {
          executeAction(action);
        }
      }

      // Show text response
      if (data.text) {
        addMessage('assistant', data.text);
        // In voice mode, speak the response — listening restarts after TTS ends
        if (voiceMode) {
          speak(data.text);
        }
      } else if (voiceMode) {
        // No text to speak — restart listening immediately
        onSpeakEnd();
      }

    } catch (err) {
      removeTypingIndicator();
      addMessage('assistant', 'Erreur de connexion.');
      console.error('[Agent] Send error:', err);
      if (voiceMode) setTimeout(restartListening, 500);
    } finally {
      isProcessing = false;
      agentBtn.classList.remove('thinking');
      if (!voiceMode) setStatus('');
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
        if (args.bgColor) { triggerColor('color-bg', args.bgColor); }
        if (args.textColor) { triggerColor('color-text', args.textColor); }
        if (args.accentColor) { triggerColor('color-accent', args.accentColor); }
        if (args.accentColor2) { triggerColor('color-accent2', args.accentColor2); }
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
          'Playfair Display': "'Playfair Display', serif",
          'DM Serif Display': "'DM Serif Display', serif",
          'Libre Baskerville': "'Libre Baskerville', serif",
          'Inter': "'Inter', sans-serif",
          'Instrument Sans': "'Instrument Sans', sans-serif",
          'Bebas Neue': "'Bebas Neue', sans-serif",
          'Poppins': "'Poppins', sans-serif",
          'Oswald': "'Oswald', sans-serif",
          'Lora': "'Lora', serif",
          'Montserrat': "'Montserrat', sans-serif",
          'Raleway': "'Raleway', sans-serif",
          'Space Mono': "'Space Mono', monospace",
        };
        var prefix = args.target === 'body' ? 'typo-body' : 'typo-headline';
        if (args.font) triggerSelect(prefix + '-font', fontMap[args.font] || args.font);
        if (args.size) triggerRange(prefix + '-size', args.size);
        if (args.weight) triggerSelect(prefix + '-weight', args.weight);
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
        var optG = document.getElementById('opt-gradient');
        if (optG && optG.checked !== args.enabled) { optG.checked = args.enabled; optG.dispatchEvent(new Event('change')); }
        if (args.start) triggerColor('gradient-start', args.start);
        if (args.end) triggerColor('gradient-end', args.end);
        if (args.angle !== undefined) triggerRange('gradient-angle', args.angle);
        break;
      }
      case 'setFormat': {
        var fmtMap = { post: { w: '1080', h: '1080' }, story: { w: '1080', h: '1920' }, landscape: { w: '1920', h: '1080' }, banner: { w: '1200', h: '628' }, square: { w: '1080', h: '1080' } };
        var f = fmtMap[args.format];
        if (f) { var fbtn = document.querySelector('.format-btn[data-w="' + f.w + '"][data-h="' + f.h + '"]'); if (fbtn) fbtn.click(); }
        break;
      }
      case 'generateBackgroundImage': {
        var p = document.getElementById('ai-prompt');
        var b = document.getElementById('btn-generate-ai');
        if (p && b) { p.value = args.prompt; b.click(); }
        break;
      }
      case 'generateSticker': {
        var sp = document.getElementById('sticker-ai-prompt');
        var sb = document.getElementById('btn-generate-sticker');
        if (sp && sb) { sp.value = args.prompt; sb.click(); }
        break;
      }
      case 'generateSvgAnimation': {
        var svgp = document.getElementById('svg-anim-prompt');
        var svgb = document.getElementById('btn-generate-svg-anim');
        if (svgp && svgb) { svgp.value = args.prompt; svgb.click(); }
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
      // Stop voice conversation
      stopVoiceMode();
    } else {
      // Start voice conversation
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

  // Send button (text mode — still works)
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
  });

})();
