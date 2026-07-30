export class UIPostProcess {
  constructor(root) {
    this.root = root;
  }

  apply(preset = "archive-warm") {
    this.root.classList.add("ui-post-process");
    this.root.dataset.postProcess = preset;
    return this;
  }
}
