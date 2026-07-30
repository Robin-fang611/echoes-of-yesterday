export class MemoryStamp {
  constructor(element) {
    if (!(element instanceof HTMLElement)) {
      throw new TypeError("MemoryStamp requires an HTMLElement.");
    }
    this.element = element;
    element.classList.add("memory-stamp-v4");
  }

  reveal({ replay = false } = {}) {
    if (replay) {
      this.element.classList.remove("is-stamped");
      void this.element.offsetWidth;
    }
    this.element.classList.add("is-stamped");
    this.element.dispatchEvent(
      new CustomEvent("memory-stamp:complete", { bubbles: true }),
    );
  }
}
