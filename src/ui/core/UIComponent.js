export class UIComponent {
  constructor({ id, className = "", tagName = "div", ariaLabel = "" } = {}) {
    if (!id) {
      throw new Error("UIComponent requires a stable id.");
    }

    this.id = id;
    this.children = [];
    this.parent = null;
    this.element = document.createElement(tagName);
    this.element.id = id;
    this.element.dataset.uiComponent = this.constructor.name;

    if (className) {
      this.element.className = className;
    }

    if (ariaLabel) {
      this.element.setAttribute("aria-label", ariaLabel);
    }
  }

  addChild(component) {
    if (!(component instanceof UIComponent)) {
      throw new TypeError("UIComponent children must inherit from UIComponent.");
    }

    component.parent = this;
    this.children.push(component);
    this.element.appendChild(component.element);
    return component;
  }

  mount(target) {
    const host = target instanceof UIComponent ? target.element : target;
    if (!(host instanceof Element)) {
      throw new TypeError("UIComponent.mount requires a DOM Element.");
    }

    host.appendChild(this.element);
    return this;
  }

  unmount() {
    this.element.remove();
    return this;
  }

  setVisible(visible) {
    this.element.hidden = !visible;
    this.element.setAttribute("aria-hidden", String(!visible));
    return this;
  }

  setLayout(layout = {}) {
    const entries = Object.entries(layout);
    for (const [property, value] of entries) {
      if (value !== undefined && value !== null) {
        this.element.style[property] = String(value);
      }
    }
    return this;
  }

  destroy() {
    for (const child of this.children) {
      child.destroy();
    }
    this.children = [];
    this.unmount();
  }
}
