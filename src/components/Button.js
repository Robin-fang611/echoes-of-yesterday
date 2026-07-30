const ButtonState = Object.freeze({
  DEFAULT: "default",
  HOVER: "hover",
  PRESSED: "pressed",
  DISABLED: "disabled",
  COMPLETED: "completed",
});

const VALID_STATES = new Set(Object.values(ButtonState));

function resolveConstructorArguments(elementOrOptions, legacyOptions) {
  if (elementOrOptions instanceof HTMLElement) {
    return {
      element: elementOrOptions,
      ...legacyOptions,
    };
  }
  const options = elementOrOptions ?? {};
  const element = options.element ?? document.createElement("button");
  return { ...options, element };
}

export class Button {
  static DEBUG = true;

  constructor(elementOrOptions = {}, legacyOptions = {}) {
    const {
      element,
      special = false,
      onActivate = null,
      stateKey = null,
      type = "paper",
      state,
      id = null,
      label = "",
      debug = Button.DEBUG,
    } = resolveConstructorArguments(elementOrOptions, legacyOptions);
    if (!(element instanceof HTMLElement)) {
      throw new TypeError("Button requires an HTMLElement.");
    }

    this.element = element;
    this.type = type;
    this.special = special;
    this.onActivate = onActivate;
    this.stateKey = stateKey;
    this.debug = debug;
    this.pressed = false;
    this.boundHandlers = [];
    this.restingState = ButtonState.DEFAULT;

    if (id) element.id = id;
    if (label) {
      element.textContent = label;
      element.setAttribute("aria-label", label);
    }
    if (element.tagName === "BUTTON" && !element.hasAttribute("type")) {
      element.setAttribute("type", "button");
    }
    element.removeAttribute("data-state");
    element.classList.add("memory-button-v4", `memory-button-v4--${type}`);
    element.classList.toggle("memory-button-v4--awakening", special);
    element.dataset.buttonType = type;

    const initialState = element.matches(":disabled")
      ? ButtonState.DISABLED
      : state ?? ButtonState.DEFAULT;
    if (initialState === ButtonState.COMPLETED) {
      this.restingState = ButtonState.COMPLETED;
    }
    this.applyState(initialState, false);
    this.bind();
  }

  setState(state) {
    if (!VALID_STATES.has(state)) {
      throw new RangeError(`Unsupported button state: ${state}`);
    }
    if (this.isDisabled() && state !== ButtonState.DISABLED) return this;
    if (
      state === ButtonState.DEFAULT ||
      state === ButtonState.COMPLETED
    ) {
      this.restingState = state;
    }
    return this.applyState(state);
  }

  applyState(state, announce = true) {
    const previous = this.element.dataset.buttonState ?? "uninitialized";
    if (previous === state) return this;
    this.element.dataset.buttonState = state;
    this.element.setAttribute("aria-busy", String(state === ButtonState.PRESSED));
    this.element.classList.toggle(
      "is-button-completed",
      state === ButtonState.COMPLETED ||
        this.restingState === ButtonState.COMPLETED,
    );
    if (announce && this.debug) {
      console.info(
        `[ButtonSystem]\nButton: ${this.stateKey ?? this.element.id ?? "anonymous"}\nState: ${previous} -> ${state}`,
      );
    }
    this.element.dispatchEvent(
      new CustomEvent("button:state-change", {
        bubbles: true,
        detail: { previous, state, button: this },
      }),
    );
    return this;
  }

  setDisabled(disabled) {
    return disabled ? this.disable() : this.enable();
  }

  isDisabled() {
    return this.element.getAttribute("aria-disabled") === "true";
  }

  enable() {
    this.element.disabled = false;
    this.element.setAttribute("aria-disabled", "false");
    this.element.style.pointerEvents = "auto";
    this.element.tabIndex = 0;
    this.pressed = false;
    return this.applyState(this.restingState);
  }

  disable() {
    this.element.setAttribute("aria-disabled", "true");
    if ("disabled" in this.element) this.element.disabled = true;
    this.element.style.pointerEvents = "none";
    this.element.tabIndex = -1;
    this.pressed = false;
    return this.applyState(ButtonState.DISABLED);
  }

  setCompleted(completed = true) {
    this.restingState = completed
      ? ButtonState.COMPLETED
      : ButtonState.DEFAULT;
    if (!this.isDisabled()) this.applyState(this.restingState);
    return this;
  }

  listen(type, handler) {
    this.element.addEventListener(type, handler);
    this.boundHandlers.push([type, handler]);
  }

  bind() {
    this.listen("pointerenter", (event) => {
      if (event.pointerType !== "touch" && !this.pressed) {
        this.setState(ButtonState.HOVER);
      }
    });
    this.listen("pointerleave", () => {
      this.pressed = false;
      this.setState(this.restingState);
    });
    this.listen("pointerdown", (event) => {
      if (this.isDisabled()) return;
      this.pressed = true;
      this.element.setPointerCapture?.(event.pointerId);
      this.setState(ButtonState.PRESSED);
      this.element.dispatchEvent(
        new CustomEvent("button:paper-sound-request", {
          bubbles: true,
          detail: {
            sound: "paper-press",
            button: this,
          },
        }),
      );
    });
    this.listen("pointerup", (event) => {
      if (this.isDisabled()) return;
      if (!this.pressed) return;
      this.pressed = false;
      const bounds = this.element.getBoundingClientRect();
      const valid =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
      this.setState(
        event.pointerType === "touch"
          ? this.restingState
          : ButtonState.HOVER,
      );
      if (!valid) return;
      if (this.stateKey) {
        sessionStorage.setItem("yesterday:last-control", this.stateKey);
      }
      this.element.dispatchEvent(
        new CustomEvent("memory-button:activate", { bubbles: true }),
      );
      this.onActivate?.(this);
    });
    this.listen("pointercancel", () => {
      this.pressed = false;
      this.setState(this.restingState);
    });
    this.listen("focus", () => this.setState(ButtonState.HOVER));
    this.listen("blur", () => this.setState(this.restingState));
    this.listen("keydown", (event) => {
      if (this.isDisabled()) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      this.setState(ButtonState.PRESSED);
    });
    this.listen("keyup", (event) => {
      if (this.isDisabled()) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      this.setState(this.restingState);
      if (this.stateKey) {
        sessionStorage.setItem("yesterday:last-control", this.stateKey);
      }
      this.onActivate?.(this);
    });
  }

  destroy() {
    this.boundHandlers.forEach(([type, handler]) => {
      this.element.removeEventListener(type, handler);
    });
    this.boundHandlers = [];
  }
}

const MemoryButton = Button;

export { ButtonState, MemoryButton };
