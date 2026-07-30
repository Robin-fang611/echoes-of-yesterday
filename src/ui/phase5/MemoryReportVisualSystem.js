import { UIAssetManager } from "../core/UIAssetManager.js";
import { TextStyleManager } from "../core/TextStyleManager.js";
import { TextMaterialLayer } from "../materials/TextMaterialLayer.js";
import { PaperMaterial } from "../materials/PaperMaterial.js";
import { PhotoMaterial } from "../materials/PhotoMaterial.js";
import { UIPostProcess } from "../effects/UIPostProcess.js";
import { MemoryVisualSystem } from "./MemoryVisualSystem.js";
import { MemoryRestorationSequence } from "../animations/MemoryRestorationSequence.js";

function memoryBand(progress) {
  if (progress < 30) return "forgotten";
  if (progress < 70) return "recovering";
  return "complete";
}

export async function initializeMemoryReportVisualSystem(app, {
  initialProgress,
  restoreStateManager = null,
} = {}) {
  const screen = app.memoryReportScreen;
  const assetManager = new UIAssetManager();
  const textStyles = new TextStyleManager();
  const paperTexture = await assetManager.loadImageSource("paperNoise");
  const paperMaterial = new PaperMaterial({ textureUrl: paperTexture });
  const photoMaterial = new PhotoMaterial();
  const visualSystem = new MemoryVisualSystem({
    initialProgress:
      initialProgress ?? screen.chapterData?.clarity?.current ?? 0,
  });

  textStyles.applyRoot(screen.element);
  new TextMaterialLayer(screen.element).apply();
  new UIPostProcess(screen.element).apply(
    await assetManager.loadMaterial("postProcess"),
  );

  [
    screen.leftPanel.element,
    screen.centerPanel.element,
    screen.rightPanel.element,
  ].forEach((panel) => paperMaterial.apply(panel));

  screen.buttons.forEach((button) => {
    paperMaterial.apply(button.element, "paper-control");
  });

  const updateUI = (progressValue) => {
    const progress = Math.max(0, Math.min(100, Number(progressValue) || 0));
    screen.element.style.setProperty("--memory-clarity", String(progress / 100));
    screen.element.style.setProperty(
      "--ink-opacity",
      String(.72 + progress * .0024),
    );
    screen.element.style.setProperty(
      "--ink-contrast",
      String(.85 + progress * .002),
    );
    screen.element.style.setProperty(
      "--memory-glow-alpha",
      String(progress * .003),
    );
    screen.element.style.setProperty(
      "--memory-warm-alpha",
      String(Math.max(0, progress - 20) * .0025),
    );
    screen.element.dataset.memoryBand = memoryBand(progress);

    screen.memoryClarity.setCurrent(progress);
    photoMaterial.apply(screen.photoFrame.element, progress);

    screen.element.querySelectorAll(".memory-item").forEach((item) => {
      paperMaterial.apply(item, "paper-memory-strip");
    });
  };

  screen.bindVisualSystem(visualSystem, (progress) => {
    updateUI(progress);
  });
  visualSystem.emitProgressChange();

  screen.element.addEventListener("memory-report:update", (event) => {
    visualSystem.setMemoryProgress(event.detail?.memoryProgress ?? 0);
  });

  visualSystem.attachRestorationSequence(
    new MemoryRestorationSequence({
      visualSystem,
      screen,
      stateManager: restoreStateManager,
    }),
  );

  return Object.assign(visualSystem, {
    assetManager,
    textStyles,
    paperMaterial,
    photoMaterial,
  });
}
