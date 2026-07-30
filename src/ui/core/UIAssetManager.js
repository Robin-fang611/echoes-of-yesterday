export class UIAssetManager {
  static transparentPixel =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/69hSLwAAAABJRU5ErkJggg==";

  constructor({
    manifestUrl = "./assets/ui/ui_assets.json",
    baseUrl = globalThis.document?.baseURI ?? import.meta.url,
  } = {}) {
    this.baseUrl = new URL("./", baseUrl);
    this.manifestUrl = new URL(manifestUrl, this.baseUrl).href;
    this.manifest = null;
    this.cache = new Map();
  }

  async loadManifest() {
    if (this.manifest) return this.manifest;
    const response = await fetch(this.manifestUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load UI asset manifest: ${response.status}`);
    }
    this.manifest = Object.freeze(await response.json());
    return this.manifest;
  }

  async resolve(group, key, { optional = false } = {}) {
    const manifest = await this.loadManifest();
    const value = manifest[group]?.[key];
    if (!value) {
      if (optional) return UIAssetManager.transparentPixel;
      throw new Error(`Unknown UI asset: ${group}.${key}`);
    }
    if (group !== "images" || value.startsWith("data:")) return value;
    return new URL(value, this.baseUrl).href;
  }

  async loadTexture(key, { optional = true } = {}) {
    if (this.cache.has(`texture:${key}`)) {
      return this.cache.get(`texture:${key}`);
    }
    const source = await this.resolve("images", key, { optional });
    const image = new Image();
    const loaded = new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => {
        if (!optional) {
          reject(new Error(`Unable to load texture: ${key}`));
          return;
        }
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.src = UIAssetManager.transparentPixel;
      };
    });
    image.src = source;
    await loaded;
    this.cache.set(`texture:${key}`, image);
    return image;
  }

  async loadImageSource(key, { optional = true } = {}) {
    const image = await this.loadTexture(key, { optional });
    return image.currentSrc || image.src || UIAssetManager.transparentPixel;
  }

  async loadFont(key) {
    return this.resolve("fonts", key);
  }

  async loadMaterial(key) {
    return this.resolve("materials", key);
  }
}
