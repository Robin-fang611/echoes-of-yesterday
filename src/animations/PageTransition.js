export class MemoryPageTransition {
  constructor({ root = document.body } = {}) {
    this.root = root;
    this.overlay = this.createOverlay();
    this.busy = false;
    this.restoreState();
  }

  createOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "memory-page-transition";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="memory-page-transition__book">
        <i class="memory-page-transition__depth"></i>
        <div class="memory-page-transition__paper">
          <span class="memory-page-transition__grain"></span>
        </div>
        <div class="memory-page-transition__spine"></div>
      </div>`;
    this.root.appendChild(overlay);
    return overlay;
  }

  restoreState() {
    if (sessionStorage.getItem("yesterday:page-transition") !== "incoming") {
      return;
    }
    sessionStorage.removeItem("yesterday:page-transition");
    this.overlay.classList.add("is-arriving");
    this.root.classList.add("is-memory-arriving");
    window.setTimeout(() => {
      this.overlay.classList.remove("is-arriving");
      this.root.classList.remove("is-memory-arriving");
    }, 1000);
  }

  navigate(url) {
    if (this.busy) return;
    this.busy = true;
    this.overlay.setAttribute("aria-hidden", "false");
    this.overlay.classList.add("is-leaving");
    this.root.classList.add("is-memory-leaving");
    sessionStorage.setItem("yesterday:page-transition", "incoming");
    window.setTimeout(() => window.location.assign(url), 1000);
  }
}
