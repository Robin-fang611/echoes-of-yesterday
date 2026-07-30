export class PaperMaterial {
  constructor({ textureUrl }) {
    this.textureUrl = textureUrl;
  }

  apply(element, variant = "paper-aged") {
    element.classList.add("paper-material", variant);
    element.style.setProperty("--paper-texture-url", `url("${this.textureUrl}")`);
    return this;
  }
}
