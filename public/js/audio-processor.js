/**
 * AudioWorklet Processor — captures mic input as PCM16 at 24kHz
 * Runs on the audio rendering thread for low-latency capture.
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSize = 2400; // ~100ms at 24kHz
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const float32 = input[0];

    // Downsample from sampleRate to 24000Hz
    const ratio = sampleRate / 24000;
    for (let i = 0; i < float32.length; i += ratio) {
      const idx = Math.floor(i);
      if (idx < float32.length) {
        // Convert float32 [-1,1] to int16 [-32768,32767]
        const s = Math.max(-1, Math.min(1, float32[idx]));
        this._buffer.push(s < 0 ? s * 0x8000 : s * 0x7FFF);
      }
    }

    // When buffer is full, send to main thread
    if (this._buffer.length >= this._bufferSize) {
      const pcm16 = new Int16Array(this._buffer.splice(0, this._bufferSize));
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }

    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
