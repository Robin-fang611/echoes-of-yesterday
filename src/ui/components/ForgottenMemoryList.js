import { UIComponent } from "../core/UIComponent.js";
import { MemoryItem } from "./MemoryItem.js";

export class ForgottenMemoryList extends UIComponent {
  constructor({ id, heading }) {
    super({
      id,
      className: "memory-list memory-list--forgotten",
      ariaLabel: heading,
    });

    this.headingElement = document.createElement("h2");
    this.headingElement.className = "memory-list__heading";
    this.headingElement.textContent = heading;

    this.itemsElement = document.createElement("div");
    this.itemsElement.className = "memory-list__items";
    this.element.append(this.headingElement, this.itemsElement);
  }

  setItems(items = []) {
    this.itemsElement.replaceChildren();
    items.forEach((item, index) => {
      const component = new MemoryItem({
        id: `${this.id}-item-${index + 1}`,
        type: "forgotten",
      });
      component.setData(item, index);
      this.itemsElement.appendChild(component.element);
    });
    this.element.dataset.count = String(items.length);
    return this;
  }
}
