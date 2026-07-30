export class UIManager {
  constructor({ root, assetRegistry, fontManager }) {
    if (!(root instanceof Element)) {
      throw new TypeError("UIManager requires a root DOM Element.");
    }

    this.root = root;
    this.assetRegistry = assetRegistry;
    this.fontManager = fontManager;
    this.screens = new Map();
    this.activeScreen = null;
  }

  registerScreen(name, screen) {
    if (!name || !screen) {
      throw new Error("UIManager.registerScreen requires a name and screen.");
    }

    if (this.screens.has(name)) {
      throw new Error(`UI screen already registered: ${name}`);
    }

    this.screens.set(name, screen);
    screen.setVisible(false).mount(this.root);
    return screen;
  }

  showScreen(name) {
    const nextScreen = this.screens.get(name);
    if (!nextScreen) {
      throw new Error(`Unknown UI screen: ${name}`);
    }

    if (this.activeScreen && this.activeScreen !== nextScreen) {
      this.activeScreen.setVisible(false);
    }

    nextScreen.setVisible(true);
    this.activeScreen = nextScreen;
    return nextScreen;
  }

  getScreen(name) {
    return this.screens.get(name) ?? null;
  }

  destroy() {
    for (const screen of this.screens.values()) {
      screen.destroy();
    }
    this.screens.clear();
    this.activeScreen = null;
  }
}
