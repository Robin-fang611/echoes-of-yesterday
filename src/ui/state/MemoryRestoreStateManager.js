function normalizeProgress(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function normalizeItems(items) {
  return Array.isArray(items)
    ? [...new Set(items.map(String).filter(Boolean))]
    : [];
}

export class MemoryRestoreStateManager {
  constructor({ storage = globalThis.localStorage } = {}) {
    this.storage = storage;
    this.fallback = new Map();
  }

  getKey(chapterId) {
    const normalizedChapterId = String(chapterId || "unknown")
      .replace(/^chapter_/, "chapter");
    return `memory_restore_${normalizedChapterId}`;
  }

  read(chapterId) {
    const key = this.getKey(chapterId);
    let serialized = null;
    try {
      serialized = this.storage?.getItem(key) ?? null;
    } catch {
      serialized = this.fallback.get(key) ?? null;
    }
    if (!serialized) return null;

    try {
      const state = JSON.parse(serialized);
      return {
        completed: state.completed === true,
        progress: normalizeProgress(state.progress),
        items: normalizeItems(state.items),
      };
    } catch {
      return null;
    }
  }

  isCompleted(chapterId) {
    return this.read(chapterId)?.completed === true;
  }

  save(chapterId, state = {}) {
    const key = this.getKey(chapterId);
    const normalizedState = {
      completed: state.completed === true,
      progress: normalizeProgress(state.progress),
      items: normalizeItems(state.items),
    };
    const serialized = JSON.stringify(normalizedState);
    this.fallback.set(key, serialized);
    try {
      this.storage?.setItem(key, serialized);
    } catch {
      // Restricted webviews may deny storage; the in-memory fallback remains usable.
    }
    return normalizedState;
  }

  saveCompleted(chapterId, { progress, items } = {}) {
    return this.save(chapterId, {
      completed: true,
      progress,
      items,
    });
  }
}
