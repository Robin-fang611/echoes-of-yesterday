import {
  UI_EVENTS,
  UI_PATHS,
  UI_STORAGE_KEYS,
} from "./ui-config.js";

function dispatchUIEvent(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export class MainMenuUI {
  open() {
    const detail = { target: UI_PATHS.mainMenu };
    sessionStorage.removeItem(UI_STORAGE_KEYS.pageTransition);
    dispatchUIEvent(UI_EVENTS.mainMenuOpening, detail);
    window.location.assign(UI_PATHS.mainMenu);
  }
}
