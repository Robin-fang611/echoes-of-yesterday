export class PaperLayer {
  constructor(element, {
    depth = "content",
    rotation = 0,
    zIndex,
  } = {}) {
    if (!(element instanceof HTMLElement)) {
      throw new TypeError("PaperLayer requires an HTMLElement.");
    }
    this.element = element;
    element.classList.add("paper-layer");
    element.dataset.paperDepth = depth;
    element.style.setProperty("--paper-rotation", `${rotation}deg`);
    if (zIndex !== undefined) element.style.zIndex = String(zIndex);
  }
}
