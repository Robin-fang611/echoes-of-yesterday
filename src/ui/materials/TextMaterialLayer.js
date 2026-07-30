export class TextMaterialLayer {
  constructor(root) {
    this.root = root;
  }

  apply() {
    this.root.classList.add("text-material-layer");
    this.root.querySelectorAll(
      ".text-block, .memory-summary, .memory-clarity, .memory-list, .emotion-text, .date-stamp, .memory-button",
    ).forEach((element) => {
      element.classList.add("ink-absorbed");
    });
    return this;
  }
}
