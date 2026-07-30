import { UIComponent } from "../core/UIComponent.js";

export class TextBlock extends UIComponent {
  constructor({ id, role, text = "", layout = {}, typography = {} }) {
    super({
      id,
      className: "text-block",
    });

    this.element.dataset.typographyRole = role;
    this.element.textContent = text;
    this.setLayout({
      position: "absolute",
      ...typography,
      ...layout,
    });
  }

  setText(text) {
    this.element.textContent = text ?? "";
    return this;
  }
}
