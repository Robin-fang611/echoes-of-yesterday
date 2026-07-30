import { UIComponent } from "../core/UIComponent.js";
import { MemoryThumbnail } from "./MemoryThumbnail.js";

const ICON_LABELS = Object.freeze({
  photo: "影",
  name: "名",
  place: "地",
  object: "物",
  moment: "时",
  sound: "声",
  unknown: "？",
});

export class MemoryItem extends UIComponent {
  constructor({ id, type = "restored" }) {
    super({
      id,
      className: `memory-item memory-item--${type}`,
    });

    this.type = type;
    this.thumbnail = new MemoryThumbnail({
      id: `${id}-thumbnail`,
    });
    this.iconElement = this.thumbnail.element;

    this.titleElement = document.createElement("span");
    this.titleElement.className = "memory-item__title";

    this.markElement = document.createElement("span");
    this.markElement.className = "memory-item__mark";
    this.markElement.setAttribute("aria-hidden", "true");

    this.element.append(
      this.iconElement,
      this.titleElement,
      this.markElement,
    );
  }

  setData(item, index = 0) {
    const iconKey = this.type === "forgotten" ? "unknown" : item.icon;
    this.iconElement.dataset.icon = iconKey ?? "memory";
    if (this.type === "forgotten") {
      this.thumbnail.placeholderElement.textContent =
        ICON_LABELS.unknown;
      this.thumbnail.imageElement.removeAttribute("src");
      this.thumbnail.element.classList.add("is-placeholder");
    } else {
      this.thumbnail.setData(item, index);
    }
    this.titleElement.textContent = item.title ?? "";
    this.titleElement.title = item.description ?? item.title ?? "";
    this.markElement.textContent = this.type === "restored" ? "✓" : "？";
    this.element.dataset.status =
      this.type === "restored" ? item.status ?? "restored" : "forgotten";
    return this;
  }
}
