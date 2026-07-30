import {
  TypographyConfig,
  TypographyToken,
  getTypographyFamily,
} from "../typography/TypographyConfig.js";

export const TextStyleRole = Object.freeze({
  TITLE: "TitleStyle",
  CHAPTER: "ChapterStyle",
  BODY: "BodyStyle",
  HANDWRITING: "HandwritingStyle",
  SYSTEM: "SystemStyle",
});

const DEFAULT_STYLES = Object.freeze({
  TitleStyle: Object.freeze({
    ...TypographyConfig[TypographyToken.TITLE_FONT],
    font: getTypographyFamily(TypographyToken.TITLE_FONT),
  }),
  ChapterStyle: Object.freeze({
    ...TypographyConfig[TypographyToken.CHAPTER_FONT],
    font: getTypographyFamily(TypographyToken.CHAPTER_FONT),
  }),
  BodyStyle: Object.freeze({
    ...TypographyConfig[TypographyToken.BODY_FONT],
    font: getTypographyFamily(TypographyToken.BODY_FONT),
  }),
  HandwritingStyle: Object.freeze({
    ...TypographyConfig[TypographyToken.HANDWRITING_FONT],
    font: getTypographyFamily(TypographyToken.HANDWRITING_FONT),
  }),
  SystemStyle: Object.freeze({
    ...TypographyConfig[TypographyToken.SYSTEM_FONT],
    font: getTypographyFamily(TypographyToken.SYSTEM_FONT),
  }),
});

export class TextStyleManager {
  constructor(styles = DEFAULT_STYLES) {
    this.styles = new Map(Object.entries(styles));
  }

  get(role) {
    const style = this.styles.get(role);
    if (!style) throw new Error(`Unknown text style: ${role}`);
    return style;
  }

  register(role, style) {
    this.styles.set(role, Object.freeze({ ...this.get(role), ...style }));
    return this;
  }

  applyRoot(root) {
    const styleMap = {
      TitleStyle: "title",
      ChapterStyle: "chapter",
      BodyStyle: "body",
      HandwritingStyle: "handwriting",
      SystemStyle: "system",
    };
    for (const [role, token] of Object.entries(styleMap)) {
      const style = this.get(role);
      root.style.setProperty(`--text-${token}-font`, style.font);
      root.style.setProperty(`--text-${token}-size`, style.size);
      root.style.setProperty(`--text-${token}-color`, style.color);
      root.style.setProperty(`--text-${token}-spacing`, style.spacing);
      root.style.setProperty(`--text-${token}-shadow`, style.shadow);
      root.style.setProperty(`--text-${token}-opacity`, style.opacity);
    }
    root.dataset.textStyleSystem = "typography-bible-v1";
    this.setTextureEnabled(root, true);
    return this;
  }

  setTextureEnabled(root, enabled = true) {
    root.classList.toggle("typography-texture-enabled", Boolean(enabled));
    root.dataset.typographyTexture = enabled ? "enabled" : "disabled";
    return this;
  }
}
