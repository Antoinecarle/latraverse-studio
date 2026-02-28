/**
 * RealtimeClient — WebSocket client for OpenAI Realtime API relay
 * Handles audio capture (AudioWorklet), playback, and event routing.
 */
class RealtimeClient {
  constructor(options = {}) {
    this.ws = null;
    this.audioContext = null;
    this.workletNode = null;
    this.micStream = null;

    // Playback state — uses a GainNode as kill switch
    this._playbackQueue = [];
    this._isPlaying = false;
    this._currentSource = null;
    this._nextPlaybackTime = 0;
    this._gainNode = null;           // master gain — disconnect to kill ALL audio
    this._allSources = [];           // track ALL scheduled sources for cleanup
    this._interrupted = false;       // true when user interrupted — ignore old audio deltas
    this._currentResponseId = null;  // track which response we accept audio from
    this._playbackGeneration = 0;    // incremented on stop — orphaned onended callbacks bail out

    // Callbacks
    this.onSessionCreated = options.onSessionCreated || null;
    this.onAudioDelta = options.onAudioDelta || null;
    this.onTranscriptDelta = options.onTranscriptDelta || null;
    this.onInputTranscript = options.onInputTranscript || null;
    this.onSpeechStarted = options.onSpeechStarted || null;
    this.onSpeechStopped = options.onSpeechStopped || null;
    this.onFunctionCall = options.onFunctionCall || null;
    this.onResponseDone = options.onResponseDone || null;
    this.onError = options.onError || null;
    this.onClose = options.onClose || null;
    this.onResponseCreated = options.onResponseCreated || null;

    this._connected = false;
    this._sessionConfigured = false;
  }

  /**
   * Connect to the WebSocket relay server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}/ws/realtime`;

      console.log('[Realtime] Connecting to', url);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[Realtime] Connected');
        this._connected = true;
        resolve();
      };

      this.ws.onclose = (e) => {
        console.log('[Realtime] Closed:', e.code, e.reason);
        this._connected = false;
        if (this.onClose) this.onClose(e);
      };

      this.ws.onerror = (e) => {
        console.error('[Realtime] WebSocket error:', e);
        if (!this._connected) reject(e);
        if (this.onError) this.onError(e);
      };

      this.ws.onmessage = (event) => {
        this._handleMessage(event);
      };
    });
  }

  /**
   * Send init message with design state — server relay configures session
   */
  sendInit(designState) {
    this._send({
      type: 'init',
      designState: designState,
    });
  }

  /**
   * Send updated design state to server relay (re-configures instructions)
   */
  sendDesignStateUpdate(designState) {
    this._send({
      type: 'design_state_update',
      designState: designState,
    });
  }

  /**
   * Start capturing mic audio via AudioWorklet and streaming to WS
   */
  async startAudioCapture(stream) {
    this.micStream = stream;
    this.audioContext = new AudioContext({ sampleRate: 24000 });

    // Create master gain node for playback — disconnect this to kill ALL audio instantly
    this._gainNode = this.audioContext.createGain();
    this._gainNode.connect(this.audioContext.destination);

    // Load the AudioWorklet processor
    await this.audioContext.audioWorklet.addModule('/js/audio-processor.js');

    const source = this.audioContext.createMediaStreamSource(stream);
    this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-capture-processor');

    // Receive PCM16 buffers from the worklet
    this.workletNode.port.onmessage = (event) => {
      if (!this._connected || !this._sessionConfigured) return;

      const pcm16Buffer = event.data;
      const bytes = new Uint8Array(pcm16Buffer);
      const base64 = this._arrayBufferToBase64(bytes);

      this._send({
        type: 'input_audio_buffer.append',
        audio: base64,
      });
    };

    source.connect(this.workletNode);
    this.workletNode.connect(this.audioContext.destination);
  }

  /**
   * Play PCM16 audio chunk (base64 encoded)
   */
  playAudio(base64Audio) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }
    if (!this._gainNode) {
      this._gainNode = this.audioContext.createGain();
      this._gainNode.connect(this.audioContext.destination);
    }

    const bytes = this._base64ToArrayBuffer(base64Audio);
    const int16 = new Int16Array(bytes);
    const float32 = new Float32Array(int16.length);

    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    // Queue the buffer and kick the sequential player
    this._playbackQueue.push(buffer);
    if (!this._isPlaying) {
      this._playNextChunk();
    }
  }

  _playNextChunk() {
    if (this._playbackQueue.length === 0) {
      this._isPlaying = false;
      return;
    }

    this._isPlaying = true;
    const gen = this._playbackGeneration; // capture current generation
    const buffer = this._playbackQueue.shift();
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this._gainNode); // route through gain node, NOT directly to destination

    const now = this.audioContext.currentTime;
    const startTime = Math.max(now, this._nextPlaybackTime);
    source.start(startTime);
    this._nextPlaybackTime = startTime + buffer.duration;
    this._currentSource = source;
    this._allSources.push(source);

    source.onended = () => {
      // If generation changed (stopPlayback was called), do NOT continue the chain
      if (gen !== this._playbackGeneration) return;

      // Remove from tracked sources
      const idx = this._allSources.indexOf(source);
      if (idx !== -1) this._allSources.splice(idx, 1);

      if (this._playbackQueue.length > 0) {
        this._playNextChunk();
      } else {
        this._isPlaying = false;
        this._currentSource = null;
      }
    };
  }

  /**
   * Stop ALL audio playback immediately — nuclear option
   */
  stopPlayback() {
    // Increment generation so any pending onended callbacks bail out
    this._playbackGeneration++;

    // Clear queue
    this._playbackQueue = [];
    this._nextPlaybackTime = 0;
    this._isPlaying = false;
    this._currentSource = null;

    // Stop ALL tracked sources (not just the last one)
    for (const src of this._allSources) {
      try { src.stop(); } catch (e) {}
      try { src.disconnect(); } catch (e) {}
    }
    this._allSources = [];

    // Disconnect and recreate gain node — kills any audio still in the Web Audio pipeline
    if (this._gainNode) {
      try { this._gainNode.disconnect(); } catch (e) {}
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this._gainNode = this.audioContext.createGain();
        this._gainNode.connect(this.audioContext.destination);
      }
    }
  }

  /**
   * Send function call result back to the API
   */
  sendFunctionResult(callId, result) {
    // Stop current playback before triggering a new response
    // This prevents old audio from overlapping with the new response
    this.stopPlayback();

    this._send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify(result),
      },
    });

    // Trigger a new response after sending the result
    this._send({
      type: 'response.create',
    });
  }

  /**
   * Disconnect and clean up all resources
   */
  disconnect() {
    this.stopPlayback();

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this._gainNode = null;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this._connected = false;
    this._sessionConfigured = false;
  }

  // ---- Internal ----

  _send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  _handleMessage(event) {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      console.error('[Realtime] Failed to parse message:', e);
      return;
    }

    switch (data.type) {
      case 'session.created':
        console.log('[Realtime] Session created');
        if (this.onSessionCreated) this.onSessionCreated(data);
        break;

      case 'session.updated':
        console.log('[Realtime] Session updated — ready to stream audio');
        this._sessionConfigured = true;
        break;

      case 'response.created': {
        // New response — flush any leftover audio from previous response
        const newId = data.response ? data.response.id : null;
        if (this._currentResponseId && this._currentResponseId !== newId) {
          // Different response starting — kill old audio
          this.stopPlayback();
        }
        this._currentResponseId = newId;
        this._interrupted = false;
        if (this.onResponseCreated) this.onResponseCreated(data);
        break;
      }

      case 'response.audio.delta':
        // ONLY play audio if not interrupted AND it belongs to current response
        if (data.delta && !this._interrupted) {
          if (!data.response_id || data.response_id === this._currentResponseId) {
            this.playAudio(data.delta);
            if (this.onAudioDelta) this.onAudioDelta(data);
          }
        }
        break;

      case 'response.audio_transcript.delta':
        if (this.onTranscriptDelta && !this._interrupted) {
          if (!data.response_id || data.response_id === this._currentResponseId) {
            this.onTranscriptDelta(data.delta);
          }
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (this.onInputTranscript && data.transcript) {
          this.onInputTranscript(data.transcript);
        }
        break;

      case 'input_audio_buffer.speech_started':
        // User started speaking — KILL everything
        this._interrupted = true;
        this.stopPlayback();
        this._send({ type: 'response.cancel' });
        if (this.onSpeechStarted) this.onSpeechStarted();
        break;

      case 'input_audio_buffer.speech_stopped':
        if (this.onSpeechStopped) this.onSpeechStopped();
        break;

      case 'response.function_call_arguments.done':
        if (this.onFunctionCall) {
          this.onFunctionCall({
            callId: data.call_id,
            name: data.name,
            arguments: data.arguments,
          });
        }
        break;

      case 'response.done':
        if (this.onResponseDone) this.onResponseDone(data);
        break;

      case 'error':
        // Ignore "no active response" — happens when response.cancel is sent
        // while no response is generating (user spoke when AI was silent)
        if (data.error && data.error.message && data.error.message.includes('no active response')) {
          console.log('[Realtime] response.cancel ignored (no active response)');
          break;
        }
        console.error('[Realtime] API error:', data.error);
        if (this.onError) this.onError(data.error);
        break;

      case 'rate_limits.updated':
      case 'response.audio.done':
      case 'response.audio_transcript.done':
      case 'response.content_part.added':
      case 'response.content_part.done':
      case 'response.output_item.added':
      case 'response.output_item.done':
      case 'conversation.item.created':
      case 'input_audio_buffer.committed':
        break;

      default:
        console.log('[Realtime] Unhandled event:', data.type);
    }
  }

  _arrayBufferToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  _base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
