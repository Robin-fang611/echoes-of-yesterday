import { UIComponent } from "../core/UIComponent.js";

export class MemorySummary extends UIComponent {
  constructor({ id }) {
    super({
      id,
      className: "memory-summary",
      ariaLabel: "本章记忆归档摘要",
    });

    this.headingElement = document.createElement("h2");
    this.headingElement.className = "memory-summary__heading";

    this.descriptionElement = document.createElement("p");
    this.descriptionElement.className = "memory-summary__description";

    this.element.append(this.headingElement, this.descriptionElement);
  }

  setData({ heading = "", description = "" } = {}) {
    this.headingElement.textContent = heading;
    this.descriptionElement.textContent = Array.isArray(description)
      ? description.join("\n")
      : description;
    return this;
  }
}
