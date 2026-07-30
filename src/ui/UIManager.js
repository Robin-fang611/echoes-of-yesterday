import { MainMenuUI } from "./MainMenuUI.js";
import { MemoryReportUI } from "./MemoryReportUI.js";
import { UI_BASELINE_VERSION } from "./ui-config.js";

export class UIManager {
  constructor() {
    this.version = UI_BASELINE_VERSION;
    this.mainMenu = new MainMenuUI();
    this.memoryReport = new MemoryReportUI();
  }

  openMainMenu() {
    return this.mainMenu.open();
  }

  openMemoryReport(request) {
    return this.memoryReport.open(request);
  }
}

export const YesterdayUIManager = new UIManager();

export const openMainMenu = () => YesterdayUIManager.openMainMenu();
export const openMemoryReport = (request) =>
  YesterdayUIManager.openMemoryReport(request);
