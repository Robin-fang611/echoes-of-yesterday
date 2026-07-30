import { MemoryStamp } from "../../components/MemoryStamp.js";

export const EVENT_MEMORY_RESTORED_COMPLETE =
  "EVENT_MEMORY_RESTORED_COMPLETE";
export const MEMORY_RESTORE_LOCK = "MEMORY_RESTORE_LOCK";
export const MEMORY_RESTORE_UNLOCK = "MEMORY_RESTORE_UNLOCK";

const DEFAULT_TIMING = Object.freeze({
  paperWake: 800,
  itemInterval: 500,
  progress: 2000,
  textReveal: 800,
  photoReveal: 1200,
  stamp: 1600,
});

function clamp(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

export class MemoryRestorationSequence {
  constructor({
    visualSystem,
    screen,
    timeScale = 1,
    clock = globalThis,
    stateManager = null,
  }) {
    this.visualSystem = visualSystem;
    this.screen = screen;
    this.root = screen.element;
    this.timeScale = timeScale;
    this.clock = clock;
    this.stateManager = stateManager;
    this.runId = 0;
    this.state = "idle";
    this.stamp = new MemoryStamp(screen.restoredList.archiveElement);
    this.pendingTimers = new Map();
    this.completed = false;
  }

  wait(milliseconds, runId) {
    return new Promise((resolve) => {
      const timer = this.clock.setTimeout(() => {
        this.pendingTimers.delete(timer);
        resolve(runId === this.runId);
      }, Math.max(0, milliseconds * this.timeScale));
      this.pendingTimers.set(timer, resolve);
    });
  }

  emit(type, detail = {}) {
    const eventDetail = {
      sequenceState: this.state,
      ...detail,
    };
    this.visualSystem.events.dispatchEvent(
      new CustomEvent(type, { detail: eventDetail }),
    );
    this.root.dispatchEvent(
      new CustomEvent(type, { detail: eventDetail, bubbles: true }),
    );
  }

  setStage(stage) {
    this.state = stage;
    this.root.dataset.restorationStage = stage;
    this.emit("memory-restoration-stage-change", { stage });
  }

  get chapterId() {
    return this.screen.chapterData?.chapterId ?? "unknown";
  }

  dispatchControlEvent(type, detail = {}) {
    this.root.dispatchEvent(
      new CustomEvent(type, { detail, bubbles: true }),
    );
  }

  isReducedMotion() {
    return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
      .matches === true;
  }

  initialize({ from, restoredItems }) {
    this.root.classList.add("memory-restoration-sequence", "is-sequence-running");
    this.root.classList.remove(
      "is-paper-awake",
      "is-text-revealed",
      "is-photo-revealed",
      "is-emotion-revealed",
      "is-sequence-complete",
    );
    this.root.querySelectorAll(".memory-thumbnail").forEach((thumbnail) => {
      thumbnail.classList.remove("is-restoring", "is-sequence-restored");
    });
    this.root.querySelectorAll(".memory-item").forEach((item) => {
      item.classList.remove("is-sequence-restored");
    });
    const stampElement = this.screen.restoredList.archiveElement;
    stampElement.classList.remove("is-stamped", "is-sequence-stamped");
    stampElement.textContent = "记忆已归档";
    this.screen.emotionText.setText("");
    this.visualSystem.setMemoryProgress(from, { silent: true });
    this.root.dataset.restoredItems = restoredItems.join(",");
  }

  prepare(data = {}) {
    const from = clamp(data.from ?? this.visualSystem.getMemoryProgress());
    const restoredItems = Array.isArray(data.restoredItems ?? data.items)
      ? [...(data.restoredItems ?? data.items)]
      : [];
    this.initialize({ from, restoredItems });
    this.state = "prepared";
    this.root.dataset.restorationStage = "prepared";
    return this;
  }

  showFinalState(data = {}) {
    const to = clamp(data.to ?? data.progress ??
      this.screen.chapterData?.clarity?.current ??
      this.visualSystem.getMemoryProgress());
    const restoredItems = Array.isArray(data.restoredItems ?? data.items)
      ? [...(data.restoredItems ?? data.items)]
      : [];
    this.root.classList.add(
      "memory-restoration-sequence",
      "is-paper-awake",
      "is-text-revealed",
      "is-photo-revealed",
      "is-emotion-revealed",
      "is-sequence-complete",
    );
    this.root.classList.remove("is-sequence-running");
    this.root.querySelectorAll(".memory-thumbnail").forEach((thumbnail) => {
      if (
        restoredItems.length === 0 ||
        restoredItems.includes(thumbnail.dataset.memoryId)
      ) {
        thumbnail.classList.add("is-sequence-restored");
      }
      thumbnail.classList.remove("is-restoring");
    });
    this.root.querySelectorAll(".memory-item").forEach((item) => {
      item.classList.add("is-sequence-restored");
    });
    const stampElement = this.screen.restoredList.archiveElement;
    stampElement.classList.remove("is-sequence-stamped");
    stampElement.classList.add("is-stamped");
    stampElement.textContent = "记忆已归档";
    this.screen.emotionText.setText(
      data.emotion ?? this.screen.chapterData?.emotionText ?? "",
    );
    this.visualSystem.setMemoryProgress(to, { silent: true });
    this.root.dataset.restorationStage = "stage-7-complete";
    this.root.dataset.restoredItems = restoredItems.join(",");
    this.state = "complete";
    this.completed = true;
    return this;
  }

  revealStamp() {
    const stampElement = this.screen.restoredList.archiveElement;
    if (stampElement.classList.contains("is-stamped")) return false;
    stampElement.classList.add("is-sequence-stamped");
    this.stamp.reveal();
    return true;
  }

  async restoreItems(items, interval, runId) {
    for (const itemId of items) {
      if (runId !== this.runId) return false;
      const thumbnail = [...this.root.querySelectorAll(".memory-thumbnail")]
        .find((element) => element.dataset.memoryId === itemId);
      if (thumbnail) {
        thumbnail.classList.add("is-restoring");
        const item = thumbnail.closest(".memory-item");
        await this.wait(interval * .55, runId);
        if (runId !== this.runId) return false;
        thumbnail.classList.add("is-sequence-restored");
        item?.classList.add("is-sequence-restored");
      }
      if (!(await this.wait(interval * .45, runId))) return false;
    }
    return true;
  }

  async animateProgress(from, to, duration, runId) {
    const direction = to >= from ? 1 : -1;
    const steps = Math.abs(Math.round(to) - Math.round(from));
    if (steps === 0) {
      this.visualSystem.setMemoryProgress(to, { silent: true });
      return true;
    }

    const stepDuration = duration / steps;
    let value = Math.round(from);
    for (let index = 0; index < steps; index += 1) {
      if (!(await this.wait(stepDuration, runId))) return false;
      value += direction;
      this.visualSystem.setMemoryProgress(value, { silent: true });
    }
    this.visualSystem.setMemoryProgress(to, { silent: true });
    return true;
  }

  async play(data = {}) {
    const persistedState = this.stateManager?.read(this.chapterId);
    if (this.completed || persistedState?.completed) {
      this.showFinalState({
        ...data,
        to: persistedState?.progress ?? data.to,
        items: persistedState?.items?.length
          ? persistedState.items
          : data.items,
      });
      return true;
    }
    const runId = ++this.runId;
    const from = clamp(data.from ?? this.visualSystem.getMemoryProgress());
    const to = clamp(data.to ?? from);
    const restoredItems = Array.isArray(data.restoredItems ?? data.items)
      ? [...(data.restoredItems ?? data.items)]
      : [];
    const baseDuration =
      DEFAULT_TIMING.paperWake +
      restoredItems.length * DEFAULT_TIMING.itemInterval +
      DEFAULT_TIMING.progress +
      DEFAULT_TIMING.textReveal +
      DEFAULT_TIMING.photoReveal +
      DEFAULT_TIMING.stamp;
    const durationScale = data.duration
      ? Math.max(.1, Number(data.duration) / baseDuration)
      : 1;
    const timing = Object.fromEntries(
      Object.entries(DEFAULT_TIMING).map(([key, value]) => [
        key,
        value * durationScale,
      ]),
    );

    this.dispatchControlEvent(MEMORY_RESTORE_LOCK, {
      chapterId: this.chapterId,
    });

    try {
      this.setStage("stage-0-initialize");
      this.initialize({ from, restoredItems });
      this.emit("memory-restoration-start", { from, to, restoredItems });

      if (this.isReducedMotion()) {
        this.showFinalState({ ...data, to, items: restoredItems });
      } else {
        this.setStage("stage-1-paper-awakening");
        this.root.classList.add("is-paper-awake");
        if (!(await this.wait(timing.paperWake, runId))) return false;

        this.setStage("stage-2-items-restoring");
        if (!(await this.restoreItems(
          restoredItems,
          timing.itemInterval,
          runId,
        ))) return false;

        this.setStage("stage-3-clarity-restoring");
        if (!(await this.animateProgress(from, to, timing.progress, runId))) {
          return false;
        }

        this.setStage("stage-4-text-revealing");
        this.root.classList.add("is-text-revealed");
        if (!(await this.wait(timing.textReveal, runId))) return false;

        this.setStage("stage-5-photo-restoring");
        this.root.classList.add("is-photo-revealed");
        if (!(await this.wait(timing.photoReveal, runId))) return false;

        this.setStage("stage-6-archive-stamp");
        this.revealStamp();
        if (!(await this.wait(timing.stamp, runId))) return false;

        this.setStage("stage-7-complete");
        this.root.classList.remove("is-sequence-running");
        this.root.classList.add(
          "is-emotion-revealed",
          "is-sequence-complete",
        );
        this.screen.emotionText.setText(data.emotion ?? "");
        this.state = "complete";
        this.completed = true;
      }

      this.stateManager?.saveCompleted(this.chapterId, {
        progress: to,
        items: restoredItems,
      });
      this.emit(EVENT_MEMORY_RESTORED_COMPLETE, {
        from,
        to,
        restoredItems,
        emotion: data.emotion ?? "",
      });
      return true;
    } finally {
      if (runId === this.runId) {
        this.dispatchControlEvent(MEMORY_RESTORE_UNLOCK, {
          chapterId: this.chapterId,
          state: this.state,
        });
      }
    }
  }

  cancel() {
    this.runId += 1;
    this.pendingTimers.forEach((resolve, timer) => {
      this.clock.clearTimeout(timer);
      resolve(false);
    });
    this.pendingTimers.clear();
    this.state = "cancelled";
    this.root.classList.remove(
      "is-sequence-running",
      "is-paper-awake",
      "is-text-revealed",
      "is-photo-revealed",
      "is-emotion-revealed",
    );
    this.root.querySelectorAll(".is-restoring").forEach((element) => {
      element.classList.remove("is-restoring");
    });
    this.screen.restoredList.archiveElement.classList.remove(
      "is-sequence-stamped",
    );
    delete this.root.dataset.restorationStage;
    delete this.root.dataset.restoredItems;
    this.dispatchControlEvent(MEMORY_RESTORE_UNLOCK, {
      chapterId: this.chapterId,
      state: this.state,
    });
    return this;
  }
}
