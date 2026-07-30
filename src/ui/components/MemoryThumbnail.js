import { UIComponent } from "../core/UIComponent.js";

function formatPlaceholderLabel(id, index) {
  const match = String(id ?? "").match(/(\d+)$/);
  const number = match?.[1] ?? String(index + 1).padStart(3, "0");
  return `Memory ${number}`;
}

export class MemoryThumbnail extends UIComponent {
  constructor({ id }) {
    super({
      id,
      className: "memory-thumbnail",
      ariaLabel: "记忆缩略图",
    });

    this.imageElement = document.createElement("img");
    this.imageElement.className = "memory-thumbnail__image";
    this.imageElement.alt = "";
    this.imageElement.loading = "lazy";
    this.imageElement.decoding = "async";

    this.placeholderElement = document.createElement("span");
    this.placeholderElement.className = "memory-thumbnail__placeholder";

    this.element.append(this.placeholderElement, this.imageElement);
  }

  setData(item = {}, index = 0) {
    const label = item.placeholderLabel ??
      formatPlaceholderLabel(item.id, index);
    this.placeholderElement.textContent = label;
    this.element.dataset.memoryId = item.id ?? `memory_${index + 1}`;
    this.element.classList.remove("is-ready", "is-placeholder");

    if (!item.thumbnail) {
      this.imageElement.removeAttribute("src");
      this.element.classList.add("is-placeholder");
      return this;
    }

    this.imageElement.onload = () => {
      this.element.classList.add("is-ready");
      this.element.classList.remove("is-placeholder");
    };
    this.imageElement.onerror = () => {
      this.imageElement.removeAttribute("src");
      this.element.classList.remove("is-ready");
      this.element.classList.add("is-placeholder");
    };
    this.imageElement.src = item.thumbnail;
    return this;
  }
}
