function normalizeProgress(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

export class MemoryVisualSystem {
  constructor({ initialProgress = 0 } = {}) {
    this.currentProgress = normalizeProgress(initialProgress);
    this.listeners = [];
    this.events = new EventTarget();
  }

  subscribe(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("MemoryVisualSystem.subscribe requires a callback.");
    }
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  emitProgressChange(value = this.currentProgress) {
    const progress = normalizeProgress(value);
    this.listeners.forEach((listener) => listener(progress));
    this.events.dispatchEvent(
      new CustomEvent("progress-change", {
        detail: { value: progress },
      }),
    );
    return this;
  }

  setMemoryProgress(value, { silent = false } = {}) {
    const previous = this.currentProgress;
    const progress = normalizeProgress(value);
    this.currentProgress = progress;
    if (!silent) {
      console.info(
        `[MemoryVisualSystem]\nProgress: ${previous} -> ${progress}\nUpdating UI...`,
      );
    }
    this.emitProgressChange(progress);
    return this;
  }

  getMemoryProgress() {
    return this.currentProgress;
  }

  attachRestorationSequence(sequence) {
    this.restorationSequence = sequence;
    return this;
  }

  restoreMemorySequence(data) {
    if (!this.restorationSequence) {
      return Promise.reject(
        new Error("Memory restoration sequence is not attached."),
      );
    }
    if (this.activeRestoration) return this.activeRestoration;
    this.activeRestoration = this.restorationSequence.play(data)
      .finally(() => {
        this.activeRestoration = null;
      });
    return this.activeRestoration;
  }

  prepareMemoryRestore(data) {
    this.restorationSequence?.prepare(data);
    return this;
  }

  showMemoryRestoreFinalState(data) {
    this.restorationSequence?.showFinalState(data);
    return this;
  }

  revealMemoryStamp() {
    return this.restorationSequence?.revealStamp() ?? false;
  }

  cancelMemoryRestore() {
    this.restorationSequence?.cancel();
    return this;
  }

  testRestoreSequence() {
    return this.restoreMemorySequence({
      from: 15,
      to: 80,
      duration: 6500,
      restoredItems: ["memory_001", "memory_002", "memory_003"],
      emotion: "那些失去颜色的日子，正在一点点回来。",
    });
  }
}
