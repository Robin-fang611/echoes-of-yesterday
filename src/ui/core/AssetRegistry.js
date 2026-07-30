export const AssetCategory = Object.freeze({
  IMAGES: "images",
  FONTS: "fonts",
  TEXTURES: "textures",
  STAMPS: "stamps",
});

export class AssetRegistry {
  constructor() {
    this.assets = new Map(
      Object.values(AssetCategory).map((category) => [category, new Map()]),
    );
  }

  register(category, key, source, metadata = {}) {
    const group = this.assets.get(category);
    if (!group) {
      throw new Error(`Unsupported asset category: ${category}`);
    }
    if (!key || !source) {
      throw new Error("AssetRegistry.register requires a key and source.");
    }

    group.set(key, Object.freeze({ key, source, metadata: { ...metadata } }));
    return this;
  }

  get(category, key) {
    return this.assets.get(category)?.get(key) ?? null;
  }

  require(category, key) {
    const asset = this.get(category, key);
    if (!asset) {
      throw new Error(`Missing registered asset: ${category}.${key}`);
    }
    return asset;
  }

  image(key) {
    return this.require(AssetCategory.IMAGES, key);
  }

  font(key) {
    return this.require(AssetCategory.FONTS, key);
  }

  texture(key) {
    return this.require(AssetCategory.TEXTURES, key);
  }

  stamp(key) {
    return this.require(AssetCategory.STAMPS, key);
  }
}
