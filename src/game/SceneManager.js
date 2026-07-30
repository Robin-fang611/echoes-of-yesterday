/**
 * 场景管理器
 * 负责：场景注册 / 切换 / 300ms 黑场过渡
 */

export class SceneManager {
  constructor() {
    this.registry = new Map();
    this.current = null;      // 当前场景实例
    this.currentName = null;
    this.transition = { phase: 'idle', alpha: 0, duration: 0.3 };
    this._pendingName = null;
    this._pendingCtx = null;
  }

  register(name, SceneClass) {
    this.registry.set(name, SceneClass);
  }

  /** 请求切换场景 */
  switchTo(name, ctx) {
    if (!this.registry.has(name)) {
      console.warn(`Scene "${name}" not registered`);
      return;
    }
    if (!this.current) {
      // 首个场景，直接激活
      this._activate(name, ctx);
      this.transition = { phase: 'in', alpha: 1, duration: 0.3 };
      return;
    }
    // 已有场景 → 先黑出
    this._pendingName = name;
    this._pendingCtx = ctx;
    this.transition = { phase: 'out', alpha: 0, duration: 0.3 };
  }

  _activate(name, ctx) {
    this.current?.onExit?.();
    const SceneClass = this.registry.get(name);
    this.current = new SceneClass(ctx);
    this.currentName = name;
    this.current.onEnter?.();
  }

  update(dt) {
    this.current?.update?.(dt);

    if (this.transition.phase === 'out') {
      this.transition.alpha += dt / this.transition.duration;
      if (this.transition.alpha >= 1) {
        this.transition.alpha = 1;
        this._activate(this._pendingName, this._pendingCtx);
        this._pendingName = null;
        this._pendingCtx = null;
        this.transition = { phase: 'in', alpha: 1, duration: 0.3 };
      }
    } else if (this.transition.phase === 'in') {
      this.transition.alpha -= dt / this.transition.duration;
      if (this.transition.alpha <= 0) {
        this.transition.alpha = 0;
        this.transition.phase = 'idle';
      }
    }
  }

  render(ctx, gameCtx) {
    this.current?.render?.(ctx, gameCtx);
  }
}
