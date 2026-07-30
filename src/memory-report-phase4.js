import { Button } from "./components/Button.js";
import { PaperLayer } from "./components/PaperLayer.js";
import { HoverEffects } from "./animations/HoverEffects.js";
import { MemoryPageTransition } from "./animations/PageTransition.js";

export function initializeMemoryReportInteractions(app) {
  const screen = app.memoryReportScreen;
  const transition = new MemoryPageTransition();
  new HoverEffects(document).mount();

  new PaperLayer(screen.leftPanel.element, {
    depth: "content",
    rotation: -0.15,
  });
  new PaperLayer(screen.centerPanel.element, {
    depth: "middle",
    rotation: 0.12,
  });
  new PaperLayer(screen.rightPanel.element, {
    depth: "content",
    rotation: 0.18,
  });
  new PaperLayer(screen.photoFrame.element, {
    depth: "photo",
    rotation: -0.7,
  });

  const photoData = screen.chapterData?.photo ?? {};
  screen.photoFrame.element.tabIndex = 0;
  screen.photoFrame.element.dataset.photoNote =
    photoData.note ?? `${screen.chapterData?.date ?? ""} · 旧日留影`;
  if (screen.chapterData?.restoredMemory?.length) {
    screen.photoFrame.element.classList.add("is-restored");
  }

  const buttonControllers = screen.buttons.map((button, index) => {
    button.element.style.pointerEvents = "auto";
    button.element.tabIndex = 0;
    button.element.setAttribute("aria-disabled", "false");
    return new Button(button.element, {
      type: "paper",
      special: index === 0,
      stateKey: button.id,
      onActivate: () => {
        if (index === 0) {
          const nextChapter =
            screen.chapterData?.chapterId === "chapter_test"
              ? "chapter_01"
              : "chapter_test";
          sessionStorage.setItem("yesterday:chapter-selection", nextChapter);
          transition.navigate(
            `./memory-report.html?chapter=${encodeURIComponent(nextChapter)}`,
          );
        }
        if (index === 1) {
          app.visualSystem?.revealMemoryStamp();
        }
        if (index === 2) transition.navigate("./index.html");
      },
    });
  });

  const setInteractionLocked = (locked) => {
    screen.element.dataset.memoryRestoreLocked = String(locked);
    buttonControllers.forEach((button) => button.setDisabled(locked));
  };
  screen.element.addEventListener("MEMORY_RESTORE_LOCK", () => {
    setInteractionLocked(true);
  });
  screen.element.addEventListener("MEMORY_RESTORE_UNLOCK", () => {
    setInteractionLocked(false);
  });

  window.addEventListener("pagehide", () => {
    app.visualSystem?.cancelMemoryRestore();
    sessionStorage.setItem(
      "yesterday:last-report",
      screen.chapterData?.chapterId ?? "chapter_01",
    );
  });
}
