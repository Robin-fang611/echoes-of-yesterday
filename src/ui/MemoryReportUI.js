import {
  UI_EVENTS,
  UI_PATHS,
  UI_STORAGE_KEYS,
} from "./ui-config.js";

let configPromise;

function dispatchUIEvent(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function normalizeRequest(request) {
  if (typeof request === "string") return { chapter: request };
  if (request && typeof request === "object") return { ...request };
  return {};
}

async function loadConfig() {
  if (!configPromise) {
    configPromise = fetch(UI_PATHS.memoryReportConfig).then((response) => {
      if (!response.ok) {
        throw new Error(`UI config request failed: ${response.status}`);
      }
      return response.json();
    });
  }
  return configPromise;
}

export class MemoryReportUI {
  async open(request) {
    const options = normalizeRequest(request);
    const config = await loadConfig();
    const chapter = options.chapter ?? config.defaultChapter;
    const chapterConfig = config.chapters?.[chapter];

    if (!chapterConfig) {
      const error = new Error(`Unknown Memory Report chapter: ${chapter}`);
      dispatchUIEvent(UI_EVENTS.navigationError, {
        surface: "memory-report",
        chapter,
        message: error.message,
      });
      throw error;
    }

    const memoryFrom = options.memoryFrom ?? chapterConfig.memoryFrom;
    const memoryTo = options.memoryTo ?? chapterConfig.memoryTo;
    const launch = {
      chapter,
      memoryFrom,
      memoryTo,
      baselineVersion: config.schemaVersion,
    };

    sessionStorage.removeItem(UI_STORAGE_KEYS.pageTransition);
    sessionStorage.setItem(
      UI_STORAGE_KEYS.memoryReportLaunch,
      JSON.stringify(launch),
    );
    dispatchUIEvent(UI_EVENTS.memoryReportOpening, launch);

    const target = new URL(UI_PATHS.memoryReport, window.location.href);
    target.searchParams.set("chapter", chapter);
    if (options.memoryFrom !== undefined) {
      target.searchParams.set("memoryFrom", String(memoryFrom));
    }
    if (options.memoryTo !== undefined) {
      target.searchParams.set("memoryTo", String(memoryTo));
    }
    window.location.assign(target.href);
  }
}
