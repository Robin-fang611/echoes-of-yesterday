import { UIComponent } from "./UIComponent.js";

export const UILayerLevel = Object.freeze({
  BACKGROUND: 0,
  PAPER_FRAME: 1,
  STATIC_DECORATION: 2,
  DYNAMIC_CONTENT: 3,
  TEXT: 4,
  INTERACTION: 5,
});

export class UILayer extends UIComponent {
  constructor({ id, name, level, className = "" }) {
    super({
      id,
      className: `ui-layer ${className}`.trim(),
      ariaLabel: name,
    });

    this.name = name;
    this.level = level;
    this.element.dataset.layerName = name;
    this.element.dataset.layerLevel = String(level);
    this.setLayout({
      position: "absolute",
      inset: "0",
      zIndex: level,
      pointerEvents: level === UILayerLevel.INTERACTION ? "auto" : "none",
    });
  }
}
