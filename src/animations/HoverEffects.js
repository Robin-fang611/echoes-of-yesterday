export class HoverEffects {
  constructor(root = document) {
    this.root = root;
    this.cursor = null;
    this.onMove = this.onMove.bind(this);
    this.onPointerOver = this.onPointerOver.bind(this);
  }

  mount() {
    if (!matchMedia("(pointer: fine)").matches) return this;
    this.cursor = document.createElement("span");
    this.cursor.className = "vintage-cursor";
    this.cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(this.cursor);
    document.documentElement.classList.add("has-vintage-cursor");
    window.addEventListener("pointermove", this.onMove, { passive: true });
    this.root.addEventListener("pointerover", this.onPointerOver);
    return this;
  }

  onMove(event) {
    this.cursor?.style.setProperty(
      "transform",
      `translate3d(${event.clientX}px, ${event.clientY}px, 0)`,
    );
  }

  onPointerOver(event) {
    const active = event.target.closest(
      "button, a, [role='button'], .photo-frame",
    );
    this.cursor?.classList.toggle("is-active", Boolean(active));
  }
}
