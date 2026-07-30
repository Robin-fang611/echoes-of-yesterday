/**
 * Loads and validates comic configuration.
 * Coordinates are percentages of the complete source image (0–100).
 */
export class ComicDataLoader {
  static async load(source) {
    if (source && typeof source === 'object') {
      return this.normalize(source, document.baseURI);
    }

    if (typeof source !== 'string' || !source.trim()) {
      throw new TypeError('Comic config must be a URL or a configuration object.');
    }

    const configUrl = new URL(source, document.baseURI);
    const response = await fetch(configUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load comic config (${response.status}): ${configUrl}`);
    }

    return this.normalize(await response.json(), configUrl);
  }

  static normalize(rawConfig, baseUrl) {
    if (!rawConfig || typeof rawConfig !== 'object') {
      throw new TypeError('Comic config must be an object.');
    }
    if (typeof rawConfig.image !== 'string' || !rawConfig.image.trim()) {
      throw new TypeError('Comic config requires a non-empty "image" path.');
    }
    if (!Array.isArray(rawConfig.panels) || rawConfig.panels.length === 0) {
      throw new TypeError('Comic config requires at least one panel.');
    }

    const seenIds = new Set();
    const panels = rawConfig.panels.map((panel, sourceIndex) => {
      const id = panel.id ?? `panel-${sourceIndex + 1}`;
      if (seenIds.has(String(id))) {
        throw new TypeError(`Duplicate comic panel id: ${id}`);
      }
      seenIds.add(String(id));

      const order = Number(panel.order ?? sourceIndex + 1);
      if (!Number.isFinite(order)) {
        throw new TypeError(`Panel "${id}" has an invalid order.`);
      }

      return {
        ...panel,
        id,
        order,
        points: this.toPoints(panel, id),
        sourceIndex,
      };
    });

    panels.sort((a, b) => a.order - b.order || a.sourceIndex - b.sourceIndex);

    return {
      ...rawConfig,
      image: new URL(rawConfig.image, baseUrl).href,
      panels,
    };
  }

  static toPoints(panel, id) {
    const shape = panel.shape ?? (panel.points ? 'polygon' : 'rect');
    let points;

    if (shape === 'rect' || shape === 'rectangle') {
      const { x, y, width, height } = panel;
      if (![x, y, width, height].every(Number.isFinite)) {
        throw new TypeError(`Rect panel "${id}" requires numeric x, y, width and height.`);
      }
      points = [
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height],
      ];
    } else if (shape === 'polygon') {
      points = panel.points;
      if (!Array.isArray(points) || points.length < 3) {
        throw new TypeError(`Polygon panel "${id}" requires at least three points.`);
      }
    } else {
      throw new TypeError(`Panel "${id}" uses unsupported shape "${shape}".`);
    }

    return points.map((point) => {
      if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) {
        throw new TypeError(`Panel "${id}" contains an invalid point.`);
      }
      if (point.some((value) => value < 0 || value > 100)) {
        throw new RangeError(`Panel "${id}" coordinates must be between 0 and 100.`);
      }
      return point;
    });
  }
}
