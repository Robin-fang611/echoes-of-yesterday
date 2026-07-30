const DEFAULT_MESSAGES = [
  '你不是一个人。',
  '有人在等你回家。',
  '慢慢来，不着急。',
  '微光就在前方。',
  '黑夜也会过去。',
  '深呼吸，放轻松。',
];

export class DanmakuBubbleField {
  constructor({
    messages = DEFAULT_MESSAGES,
    targetX,
    targetY,
    random = Math.random,
    spawnInterval = 1.2,
    required = 4,
  } = {}) {
    this.messages = messages.length ? messages : DEFAULT_MESSAGES;
    this.targetX = targetX ?? 640;
    this.targetY = targetY ?? 500;
    this.random = random;
    this.spawnInterval = spawnInterval;
    this.required = required;
    this.bubbles = [];
    this.collected = 0;
    this.running = false;
    this.spawnTimer = 0;
  }

  get activeBubbles() {
    return this.bubbles.filter(bubble => bubble.state === 'floating');
  }

  get isReady() {
    return this.collected >= this.required;
  }

  start() {
    this.running = true;
    this.spawnTimer = this.spawnInterval;
  }

  stop() {
    this.running = false;
    this.bubbles = [];
  }

  update(dt) {
    if (!this.running) return;
    this.spawnTimer += dt;
    while (this.spawnTimer >= this.spawnInterval && this.activeBubbles.length < 5 && !this.isReady) {
      this.spawnTimer -= this.spawnInterval;
      this._spawn();
    }

    for (const bubble of this.bubbles) {
      if (bubble.state === 'floating') {
        bubble.x -= bubble.speed * dt;
        bubble.wobble += dt * bubble.wobbleSpeed;
        if (bubble.x + bubble.width < -30) bubble.state = 'gone';
      } else if (bubble.state === 'collecting') {
        bubble.collectTime += dt;
        const progress = Math.min(1, bubble.collectTime / 0.45);
        bubble.x = bubble.startX + (this.targetX - bubble.startX) * progress;
        bubble.y = bubble.startY + (this.targetY - bubble.startY) * progress;
        bubble.alpha = 1 - progress * 0.35;
        if (progress >= 1) {
          bubble.state = 'gone';
          this.collected += 1;
        }
      }
    }
    this.bubbles = this.bubbles.filter(bubble => bubble.state !== 'gone');
  }

  hit(point) {
    if (!this.running || this.isReady) return false;
    const bubble = this.activeBubbles.find(candidate => (
      point.x >= candidate.x - candidate.width / 2 &&
      point.x <= candidate.x + candidate.width / 2 &&
      point.y >= candidate.y - candidate.height / 2 &&
      point.y <= candidate.y + candidate.height / 2
    ));
    if (!bubble) return false;
    bubble.state = 'collecting';
    bubble.startX = bubble.x;
    bubble.startY = bubble.y;
    bubble.collectTime = 0;
    return true;
  }

  render(ctx) {
    ctx.save();
    for (const bubble of this.bubbles) {
      const wobbleY = bubble.state === 'floating' ? Math.sin(bubble.wobble) * 4 : 0;
      const x = bubble.x;
      const y = bubble.y + wobbleY;
      const alpha = bubble.alpha ?? 1;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, bubble.width * 0.9);
      glow.addColorStop(0, `rgba(255, 210, 130, ${0.3 * alpha})`);
      glow.addColorStop(1, 'rgba(255, 210, 130, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, bubble.width * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(244, 224, 188, ${0.92 * alpha})`;
      this._roundedRect(ctx, x - bubble.width / 2, y - bubble.height / 2, bubble.width, bubble.height, bubble.height / 2);
      ctx.fill();
      ctx.fillStyle = `rgba(67, 47, 35, ${alpha})`;
      ctx.font = '16px "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bubble.text, x, y);
    }
    ctx.restore();
  }

  _spawn() {
    const text = this.messages[Math.floor(this.random() * this.messages.length)];
    const width = Math.max(126, text.length * 17 + 36);
    this.bubbles.push({
      text,
      x: 1340 + this.random() * 110,
      y: 130 + this.random() * 390,
      width,
      height: 44,
      speed: 35 + this.random() * 30,
      wobble: this.random() * Math.PI * 2,
      wobbleSpeed: 1 + this.random(),
      alpha: 1,
      state: 'floating',
    });
  }

  _roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
