import { UIComponent } from "../core/UIComponent.js";

export class MemoryButton extends UIComponent {
  constructor({ id, label, layout, typography, colors }) {
    super({
      id,
      className: "memory-button",
      ariaLabel: label,
    });

    this.label = label;
    this.element.setAttribute("role", "button");
    this.element.setAttribute("aria-disabled", "true");
    this.element.dataset.phase = "static-component";
    this.element.textContent = label;
    this.setLayout({
      position: "absolute",
      display: "grid",
      placeItems: "center",
      color: colors.control,
      fontFamily: typography.family,
      fontSize: typography.size,
      fontWeight: typography.weight,
      lineHeight: typography.lineHeight,
      letterSpacing: typography.letterSpacing,
      pointerEvents: "none",
      userSelect: "none",
      ...layout,
    });
  }
}
