export const UI_BASELINE_VERSION = "1.1";

export const UI_PATHS = Object.freeze({
  mainMenu: "./main-menu.html",
  memoryReport: "./memory-report-artwork.html",
  memoryReportConfig: "./src/ui/memory-report-config.json",
});

export const UI_EVENTS = Object.freeze({
  mainMenuOpening: "yesterday-ui:main-menu-opening",
  memoryReportOpening: "yesterday-ui:memory-report-opening",
  navigationError: "yesterday-ui:navigation-error",
});

export const UI_STORAGE_KEYS = Object.freeze({
  memoryReportLaunch: "yesterday:memory-report-launch",
  pageTransition: "yesterday:page-transition",
});
