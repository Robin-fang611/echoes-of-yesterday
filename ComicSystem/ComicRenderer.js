const SVG_NS = 'http://www.w3.org/2000/svg';

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

export class ComicRenderer {
  constructor(container, options = {}) {
    if (!(container instanceof Element)) {
      throw new TypeError('ComicRenderer requires a container element.');
    }

    this.container = container;
    this.options = {
      duration: options.duration ?? 500,
      className: options.className ?? '',
    };
    this.panelElements = [];
    this.root = null;
    this.svg = null;
    this.config = null;
  }

  async render(config) {
    this.destroy();
    this.config = config;

    const root = document.createElement('div');
    root.className = `comic-player-view ${this.options.className}`.trim();
    root.tabIndex = 0;
    root.setAttribute('role', 'button');
    root.setAttribute('aria-label', '漫画剧情，点击显示下一格');
    root.style.setProperty('--comic-fade-duration', `${this.options.duration}ms`);

    const svg = svgElement('svg', {
      class: 'comic-player-svg',
      viewBox: '0 0 100 100',
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
    });
    const defs = svgElement('defs');

    config.panels.forEach((panel, index) => {
      const clipId = `comic-${this.instanceId}-${index}`;
      const clipPath = svgElement('clipPath', {
        id: clipId,
        clipPathUnits: 'userSpaceOnUse',
      });
      clipPath.appendChild(svgElement('polygon', {
        points: panel.points.map(([x, y]) => `${x},${y}`).join(' '),
      }));
      defs.appendChild(clipPath);

      const group = svgElement('g', {
        class: 'comic-panel',
        'data-panel-id': String(panel.id),
        'data-order': String(panel.order),
        'clip-path': `url(#${clipId})`,
      });
      group.appendChild(svgElement('image', {
        href: config.image,
        x: '0',
        y: '0',
        width: '100',
        height: '100',
        preserveAspectRatio: 'none',
      }));
      svg.appendChild(group);
      this.panelElements.push(group);
    });

    svg.prepend(defs);
    root.appendChild(svg);
    this.container.appendChild(root);
    this.root = root;
    this.svg = svg;
    this.injectStyles();

    const { width, height } = await this.getImageSize(config.image);
    root.style.aspectRatio = `${width} / ${height}`;
    return root;
  }

  get instanceId() {
    if (!this._instanceId) {
      this._instanceId = Math.random().toString(36).slice(2);
    }
    return this._instanceId;
  }

  getImageSize(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      });
      image.onerror = () => reject(new Error(`Unable to load comic image: ${src}`));
      image.src = src;
    });
  }

  reveal(index) {
    const panel = this.panelElements[index];
    if (!panel) return false;
    panel.classList.add('is-visible');
    return true;
  }

  reset() {
    this.panelElements.forEach((panel) => panel.classList.remove('is-visible'));
    this.root?.classList.remove('is-complete');
    this.root?.setAttribute('aria-label', '漫画剧情，点击显示下一格');
  }

  setComplete(complete) {
    this.root?.classList.toggle('is-complete', complete);
    if (this.root) {
      this.root.setAttribute(
        'aria-label',
        complete ? '漫画剧情播放完成' : '漫画剧情，点击显示下一格',
      );
    }
  }

  injectStyles() {
    const id = 'comic-player-shared-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .comic-player-view {
        position: relative;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
        outline: none;
        background: #090807;
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      .comic-player-svg { display: block; width: 100%; height: 100%; }
      .comic-panel {
        opacity: 0;
        transition: opacity var(--comic-fade-duration) ease-out;
        pointer-events: none;
      }
      .comic-panel.is-visible { opacity: 1; }
      @media (prefers-reduced-motion: reduce) {
        .comic-panel { transition-duration: 1ms; }
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    this.root?.remove();
    this.root = null;
    this.svg = null;
    this.panelElements = [];
    this.config = null;
  }
}
