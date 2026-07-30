import { ComicDataLoader } from './ComicDataLoader.js';
import { ComicRenderer } from './ComicRenderer.js';

/**
 * Data-driven comic sequence controller.
 *
 * const player = new ComicPlayer(container, { clickToAdvance: true });
 * await player.load('./comics/chapter01_scene01.json');
 * player.next();
 */
export class ComicPlayer extends EventTarget {
  constructor(container, options = {}) {
    super();
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!(this.container instanceof Element)) {
      throw new TypeError('ComicPlayer requires a valid container or selector.');
    }

    this.options = {
      clickToAdvance: options.clickToAdvance ?? true,
      keyboard: options.keyboard ?? true,
      duration: options.duration ?? 500,
      onPanelShown: options.onPanelShown,
      onComplete: options.onComplete,
    };
    this.renderer = new ComicRenderer(this.container, this.options);
    this.config = null;
    this.currentIndex = 0;
    this.state = 'idle';

    this.onPointerUp = (event) => {
      if (this.options.clickToAdvance && event.button === 0) this.next();
    };
    this.onKeyDown = (event) => {
      if (
        this.options.keyboard
        && (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault();
        this.next();
      }
    };
  }

  async load(source) {
    this.state = 'loading';
    this.config = await ComicDataLoader.load(source);
    await this.renderer.render(this.config);
    this.currentIndex = 0;
    this.state = 'ready';
    this.bindInteraction();
    this.emit('comic:ready', { panelCount: this.panelCount });
    return this;
  }

  next() {
    if (this.state !== 'ready' || !this.config) {
      return {
        advanced: false,
        completed: this.state === 'complete',
        index: this.currentIndex,
        panel: null,
      };
    }

    const panel = this.config.panels[this.currentIndex];
    if (!panel || !this.renderer.reveal(this.currentIndex)) {
      return { advanced: false, completed: this.isComplete, index: this.currentIndex, panel: null };
    }

    this.currentIndex += 1;
    const detail = {
      advanced: true,
      completed: this.currentIndex >= this.panelCount,
      index: this.currentIndex,
      panel,
    };
    this.emit('comic:panelshown', detail);
    this.options.onPanelShown?.(detail, this);

    if (detail.completed) {
      this.state = 'complete';
      this.renderer.setComplete(true);
      this.emit('comic:complete', detail);
      this.options.onComplete?.(detail, this);
    }
    return detail;
  }

  reset() {
    if (!this.config) return this;
    this.currentIndex = 0;
    this.state = 'ready';
    this.renderer.reset();
    this.emit('comic:reset', { panelCount: this.panelCount });
    return this;
  }

  get panelCount() {
    return this.config?.panels.length ?? 0;
  }

  get isComplete() {
    return this.state === 'complete';
  }

  bindInteraction() {
    this.unbindInteraction();
    this.renderer.root?.addEventListener('pointerup', this.onPointerUp);
    this.renderer.root?.addEventListener('keydown', this.onKeyDown);
  }

  unbindInteraction() {
    this.renderer.root?.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.root?.removeEventListener('keydown', this.onKeyDown);
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  destroy() {
    this.unbindInteraction();
    this.renderer.destroy();
    this.config = null;
    this.currentIndex = 0;
    this.state = 'destroyed';
  }
}
