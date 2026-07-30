import { UIComponent } from "../core/UIComponent.js";

export class MemoryPanel extends UIComponent {
  constructor({ id, region, layout, ariaLabel }) {
    super({
      id,
      className: "memory-panel",
      ariaLabel,
    });

    this.region = region;
    this.element.dataset.region = region;
    this.element.dataset.phase = "placeholder";
    this.setLayout({
      position: "absolute",
      ...layout,
    });
  }
}
