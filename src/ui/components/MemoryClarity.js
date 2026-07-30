import { UIComponent } from "../core/UIComponent.js";

const SCALE_MARKS = Object.freeze([0, 25, 50, 75, 100]);

export class MemoryClarity extends UIComponent {
  constructor({ id, label }) {
    super({
      id,
      className: "memory-clarity",
      ariaLabel: label,
    });

    this.labelElement = document.createElement("h3");
    this.labelElement.className = "memory-clarity__label";
    this.labelElement.textContent = label;

    this.valuesElement = document.createElement("div");
    this.valuesElement.className = "memory-clarity__values";
    this.beforeElement = this.createValue("之前");
    this.arrowElement = document.createElement("span");
    this.arrowElement.className = "memory-clarity__arrow";
    this.arrowElement.textContent = "→";
    this.currentElement = this.createValue("现在");
    this.valuesElement.append(
      this.beforeElement.wrapper,
      this.arrowElement,
      this.currentElement.wrapper,
    );

    this.trackElement = document.createElement("div");
    this.trackElement.className = "memory-clarity__track";
    this.fillElement = document.createElement("div");
    this.fillElement.className = "memory-clarity__fill";
    this.trackElement.appendChild(this.fillElement);

    this.scaleElement = document.createElement("div");
    this.scaleElement.className = "memory-clarity__scale";
    SCALE_MARKS.forEach((mark) => {
      const tick = document.createElement("span");
      tick.textContent = `${mark}%`;
      this.scaleElement.appendChild(tick);
    });

    this.element.append(
      this.labelElement,
      this.valuesElement,
      this.trackElement,
      this.scaleElement,
    );
  }

  createValue(caption) {
    const wrapper = document.createElement("div");
    wrapper.className = "memory-clarity__value";
    const value = document.createElement("strong");
    const label = document.createElement("span");
    label.textContent = caption;
    wrapper.append(value, label);
    return { wrapper, value };
  }

  setData({ before = 0, current = 0 } = {}) {
    const safeBefore = Math.max(0, Math.min(100, Number(before) || 0));
    const safeCurrent = Math.max(0, Math.min(100, Number(current) || 0));
    this.beforeValue = safeBefore;
    this.currentValue = safeCurrent;
    this.beforeElement.value.textContent = `${safeBefore}%`;
    this.currentElement.value.textContent = `${safeCurrent}%`;
    this.fillElement.style.width = `${safeCurrent}%`;
    this.element.dataset.before = String(safeBefore);
    this.element.dataset.current = String(safeCurrent);
    return this;
  }

  setCurrent(value) {
    const safeCurrent = Math.max(0, Math.min(100, Number(value) || 0));
    this.currentValue = safeCurrent;
    this.currentElement.value.textContent = `${Math.round(this.currentValue)}%`;
    this.fillElement.style.width = `${this.currentValue}%`;
    this.element.dataset.current = String(this.currentValue);
    this.element.setAttribute(
      "aria-label",
      `记忆清晰度，当前${Math.round(this.currentValue)}%`,
    );
    return this;
  }
}
