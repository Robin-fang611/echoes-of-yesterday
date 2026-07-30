import { UIComponent } from "../core/UIComponent.js";

export class PhotoFrame extends UIComponent {
  constructor({ id, layout, ariaLabel = "章节记忆照片区域" }) {
    super({
      id,
      className: "photo-frame",
      ariaLabel,
    });

    this.element.dataset.phase = "placeholder";
    this.setLayout({
      position: "absolute",
      overflow: "hidden",
      ...layout,
    });
  }

  setImage(source, alt = "") {
    this.element.replaceChildren();
    if (!source) {
      return this;
    }

    const image = document.createElement("img");
    image.className = "photo-frame__image";
    image.src = source;
    image.alt = alt;
    image.draggable = false;
    const imageLayer = document.createElement("div");
    imageLayer.className = "photo-frame__image-layer";
    imageLayer.appendChild(image);

    const oldFilter = document.createElement("i");
    oldFilter.className = "photo-frame__old-filter";
    const grain = document.createElement("i");
    grain.className = "photo-frame__grain";
    const border = document.createElement("i");
    border.className = "photo-frame__paper-border";

    this.element.append(imageLayer, oldFilter, grain, border);
    this.element.dataset.phase = "content";
    return this;
  }
}
