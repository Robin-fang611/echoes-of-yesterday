export const FontRole = Object.freeze({
  TITLE: "TitleFont",
  CHAPTER: "ChapterFont",
  BODY: "BodyFont",
  HANDWRITING: "HandwritingFont",
  SYSTEM: "SystemFont",
});

export class FontManager {
  constructor() {
    this.fonts = new Map();
  }

  register(role, descriptor) {
    if (!Object.values(FontRole).includes(role)) {
      throw new Error(`Unsupported font role: ${role}`);
    }

    this.fonts.set(role, Object.freeze({ ...descriptor }));
    return this;
  }

  get(role) {
    return this.fonts.get(role) ?? null;
  }

  resolveFamily(role) {
    return this.get(role)?.family ?? "serif";
  }

  getFont(type) {
    return this.get(type);
  }

  async load(role) {
    const descriptor = this.get(role);
    if (!descriptor?.source) {
      return descriptor;
    }

    const localSources = (descriptor.local ?? [])
      .map((name) => `local("${name}")`)
      .join(", ");
    const remoteSource = `url("${descriptor.source}")`;
    const source = [localSources, remoteSource].filter(Boolean).join(", ");

    try {
      const face = new FontFace(descriptor.face ?? descriptor.name, source);
      const loadedFace = await face.load();
      document.fonts.add(loadedFace);
      return { ...descriptor, loaded: true };
    } catch {
      return { ...descriptor, loaded: false, fallback: true };
    }
  }

  async loadAll() {
    await Promise.all([...this.fonts.keys()].map((role) => this.load(role)));
  }

  async loadFonts() {
    await this.loadAll();
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    return this;
  }
}
