export class SmileDetector {
  constructor({
    faceapi = globalThis.faceapi,
    mediaDevices = globalThis.navigator?.mediaDevices,
    now = () => Date.now(),
    detect = null,
    modelPath = './assets/vendor/face-api/models/',
  } = {}) {
    this.faceapi = faceapi;
    this.mediaDevices = mediaDevices;
    this.now = now;
    this.detect = detect;
    this.modelPath = modelPath;
    this.status = 'idle';
    this.stream = null;
    this.video = null;
    this.smileStartedAt = null;
    this.happyHeldSeconds = 0;
  }

  async start() {
    if (this.status === 'ready') return true;
    this.smileStartedAt = null;
    this.happyHeldSeconds = 0;
    if (this.detect) {
      this.status = 'ready';
      return true;
    }
    if (!this.faceapi || !this.mediaDevices?.getUserMedia || typeof document === 'undefined') {
      this.status = 'failed';
      return false;
    }
    try {
      await Promise.all([
        this.faceapi.nets.tinyFaceDetector.load(this.modelPath),
        this.faceapi.nets.faceExpressionNet.load(this.modelPath),
      ]);
      this.stream = await this.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.setAttribute('aria-hidden', 'true');
      this.video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-2px;top:-2px;';
      this.video.srcObject = this.stream;
      document.body.appendChild(this.video);
      await this.video.play();
      this.status = 'ready';
      return true;
    } catch {
      this.stop();
      this.status = 'failed';
      return false;
    }
  }

  async sample() {
    if (this.status === 'failed') return { state: 'failed', happy: 0 };
    if (this.status !== 'ready') return { state: 'idle', happy: 0 };
    try {
      const happy = await this._detectHappy();
      if (happy >= 0.6) {
        const currentTime = this.now();
        if (this.smileStartedAt === null) this.smileStartedAt = currentTime;
        this.happyHeldSeconds = (currentTime - this.smileStartedAt) / 1000;
        if (this.happyHeldSeconds >= 1.5) return { state: 'smiling', happy };
        return { state: 'ready', happy };
      }
      this.smileStartedAt = null;
      this.happyHeldSeconds = 0;
      return { state: 'ready', happy };
    } catch {
      this.status = 'failed';
      return { state: 'failed', happy: 0 };
    }
  }

  stop() {
    for (const track of this.stream?.getTracks?.() || []) track.stop();
    if (this.video) {
      this.video.srcObject = null;
      this.video.remove();
    }
    this.stream = null;
    this.video = null;
    this.smileStartedAt = null;
    this.happyHeldSeconds = 0;
    if (this.status !== 'failed') this.status = 'idle';
  }

  async _detectHappy() {
    if (this.detect) return this.detect();
    if (!this.video || this.video.readyState < 2) throw new Error('camera not ready');
    const result = await this.faceapi
      .detectSingleFace(this.video, new this.faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
      .withFaceExpressions();
    return result?.expressions?.happy || 0;
  }
}
