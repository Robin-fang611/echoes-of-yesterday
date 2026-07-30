// 终章蒙太奇「活动」：按帧序列做柔和交叉淡入，可选字幕。
// 纯呈现型，不需要输入；通过 isFinished / onComplete 通知章节切换。
// 设计坐标 1280×720。frames 为 game.images 的键数组（如 ['ch10_livingroom', ...]）。
//
// 这是「叙事活动」之一：与具体章节逻辑解耦，队友可随时用另一种表现形式替换本文件，
// 只要维持 start / update / render / isFinished 的相同契约即可（详见同目录 README.md）。
export class MontageActivity {
  constructor(game) {
    this.game = game;
    this.frames = [];
    this.captions = [];
    this.perFrame = 1.4;
    this.crossfade = 0.5;
    this.time = 0;
    this.finished = false;
    this.onComplete = null;
    this._ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  }

  start({ frames = [], captions = [], perFrame = 1.4, crossfade = 0.5, onComplete = null } = {}) {
    this.frames = frames.filter(Boolean);
    this.captions = Array.isArray(captions) ? captions : [];
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

    // 字幕淡入淡出
    const cap = this.captions[idx];
    if (cap) {
      const fade = 0.35;
      const a = Math.max(0, Math.min(1,
        Math.min(localT / fade, (1 - localT) / fade)));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(10, 6, 4, 0.5)';
      ctx.fillRect(0, height - 120, width, 120);
      ctx.fillStyle = '#f4e2bd';
      ctx.font = '500 26px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cap, width / 2, height - 60);
      ctx.restore();
    }
  }

  _img(i) {
    const key = this.frames[i];
    if (!key) return null;
    const im = this.game.images[key];
    if (!im) return null;
    // 真实 Image：loaded 时 naturalWidth>0；程序占位图无 naturalWidth，跳过避免斜纹占位
    if (im.naturalWidth) return im.naturalWidth > 0 ? im : null;
    if (im.width && !im.__placeholder) return im;
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
