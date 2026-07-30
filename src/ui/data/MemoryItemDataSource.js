export class MemoryItemDataSource {
  async load(source, fallbackItems = []) {
    if (!source) return fallbackItems;

    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) return fallbackItems;
      const items = await response.json();
      return Array.isArray(items) ? items : fallbackItems;
    } catch {
      return fallbackItems;
    }
  }
}
