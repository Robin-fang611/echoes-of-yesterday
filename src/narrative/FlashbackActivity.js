// 通用闪回「活动」：按帧序列做柔和交叉淡入。
// 纯呈现型，不需要输入；通过 isFinished / onComplete 通知章节切换。
// 设计坐标 1280×720。frames 为 game.images 的键数组（如 ['ch2_flashback_01', ...]）。
export class FlashbackActivity {
  constructor(game) {
    this.game = game;
    this.frames = [];
    this.perFrame = 1.0;   // 每帧停留秒数（计划要求 0.8–1.2）
    this.crossfade = 0.45; // 与下一帧交叉淡入的时长（秒）
    this.time = 0;
    this.finished = false;
    this.onComplete = null;
    this._ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  }

  start({ frames = [], perFrame = 1.0, crossfade = 0.45, onComplete = null } = {}) {
    this.frames = frames.filter(Boolean);
    this.perFrame = perFrame;
    this.crossfade = Math.min(crossfade, perFrame);
    this.time = 0;
    this.finished = false;
    this.onComplete = onComplete;
  }

  update(dt) {
    if (this.finished) return;
    this.time += dt;
    const total = this.frames.length * this.perFrame;
    if (this.time >= total) {
      this.finished = true;
      this.onComplete?.();
    }
  }

  render(ctx, width, height) {
    const idx = Math.min(this.frames.length - 1, Math.floor(this.time / this.perFrame));
    const cur = this._img(idx);
    if (cur) this._draw(cur, ctx, width, height, 1);

    // 与下一帧做缓动交叉淡入（代替硬切）
    const localT = (this.time - idx * this.perFrame) / this.perFrame;
    const fadeStart = 1 - this.crossfade / this.perFrame;
    if (idx < this.frames.length - 1 && localT > fadeStart) {
      const next = this._img(idx + 1);
      if (next) {
        const a = this._ease((localT - fadeStart) / (this.crossfade / this.perFrame));
        this._draw(next, ctx, width, height, a);
      }
    }
  }

  _img(i) {
    const key = this.frames[i];
    if (!key) return null;
    const im = this.game.images[key];
    if (!im) return null;
    // 真实 Image：loaded 时 naturalWidth>0；程序占位图无 naturalWidth，跳过避免斜纹占位
    if (im.naturalWidth) return im.naturalWidth > 0 ? im : null;
    if (im.width && !im.__placeholder) return im; // canvas 占位（理论不会进到这里）
    return null;
  }

  _draw(im, ctx, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.drawImage(im, 0, 0, w, h);
    ctx.restore();
  }

  get isFinished() { return this.finished; }
}
