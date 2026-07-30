import { UIComponent } from "../core/UIComponent.js";
import { MemoryItem } from "./MemoryItem.js";

export class RestoredMemoryList extends UIComponent {
  constructor({ id, heading, archiveLabel = "已归档" }) {
    super({
      id,
      className: "memory-list memory-list--restored",
      ariaLabel: heading,
    });

    this.headingElement = document.createElement("h2");
    this.headingElement.className = "memory-list__heading";
    this.headingElement.textContent = heading;

    this.archiveElement = document.createElement("span");
    this.archiveElement.className = "memory-list__archive-stamp";
    this.archiveElement.textContent = archiveLabel;

    this.itemsElement = document.createElement("div");
    this.itemsElement.className = "memory-list__items";
    this.element.append(
      this.headingElement,
      this.archiveElement,
      this.itemsElement,
    );
  }

  setItems(items = []) {
    this.itemsElement.replaceChildren();
    items.forEach((item, index) => {
      const component = new MemoryItem({
        id: `${this.id}-item-${index + 1}`,
        type: "restored",
      });
      component.setData(item, index);
      this.itemsElement.appendChild(component.element);
    });
    this.element.dataset.count = String(items.length);
    return this;
  }
}
