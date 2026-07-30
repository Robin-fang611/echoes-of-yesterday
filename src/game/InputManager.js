/**
 * 输入管理器
 * 基于 Pointer Events，坐标换算到设计画布 1280×720
 */

export class InputManager {
  constructor(canvas, designW, designH) {
    this.canvas = canvas;
    this.designW = designW;
    this.designH = designH;
    this.handlers = {};

    this._onPointerDown = (e) => this.dispatch('down', e);
    this._onPointerMove = (e) => this.dispatch('move', e);
    this._onPointerUp = (e) => this.dispatch('up', e);
    this._onPointerCancel = (e) => this.dispatch('cancel', e);

    canvas.addEventListener('pointerdown', this._onPointerDown, { passive: false });
    canvas.addEventListener('pointermove', this._onPointerMove, { passive: false });
    canvas.addEventListener('pointerup', this._onPointerUp, { passive: false });
    canvas.addEventListener('pointercancel', this._onPointerCancel, { passive: false });

    // 阻止右键菜单 + 手势
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('gesturestart', e => e.preventDefault());
    canvas.addEventListener('gesturechange', e => e.preventDefault());
    canvas.addEventListener('gestureend', e => e.preventDefault());
  }

  /** 坐标换算 */
  toDesign(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (this.designW / rect.width),
      y: (event.clientY - rect.top) * (this.designH / rect.height),
      pointerId: event.pointerId,
      pointerType: event.pointerType,
    };
  }

  /** 设置事件处理器 */
  setHandlers(handlers = {}) {
    this.handlers = handlers;
  }

  dispatch(type, event) {
    const handler = this.handlers[type];
    if (!handler) return;
    event.preventDefault();

    const point = this.toDesign(event);

    if (type === 'down') {
      try { this.canvas.setPointerCapture(event.pointerId); } catch {}
    }
    if (type === 'up' || type === 'cancel') {
      try {
        if (this.canvas.hasPointerCapture?.(event.pointerId)) {
          this.canvas.releasePointerCapture(event.pointerId);
        }
      } catch {}
    }

    handler(point, event);
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
    this.canvas.removeEventListener('pointercancel', this._onPointerCancel);
    this.handlers = {};
  }
}
