import { UIComponent } from "../core/UIComponent.js";

export class Stamp extends UIComponent {
  constructor({ id, layout = {}, ariaLabel = "档案印章区域" }) {
    super({
      id,
      className: "stamp",
      ariaLabel,
    });

    this.element.dataset.phase = "placeholder";
    this.setLayout({
      position: "absolute",
      ...layout,
    });
  }

  setAsset(source, alt = "") {
    this.element.replaceChildren();
    if (!source) {
      return this;
    }

    const image = document.createElement("img");
    image.src = source;
    image.alt = alt;
    image.draggable = false;
    Object.assign(image.style, {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      display: "block",
    });
    this.element.appendChild(image);
    return this;
  }
}
