import { UIComponent } from "../core/UIComponent.js";

export class EmotionText extends UIComponent {
  constructor({ id, label }) {
    super({
      id,
      className: "emotion-text",
      ariaLabel: label,
    });

    this.labelElement = document.createElement("span");
    this.labelElement.className = "emotion-text__label";
    this.labelElement.textContent = label;

    this.textElement = document.createElement("blockquote");
    this.textElement.className = "emotion-text__content";
    this.element.append(this.labelElement, this.textElement);
  }

  setText(text) {
    this.textElement.textContent = text ?? "";
    return this;
  }
}
