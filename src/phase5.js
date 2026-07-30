import { UIAssetManager } from "./ui/core/UIAssetManager.js";
import { TextStyleManager } from "./ui/core/TextStyleManager.js";
import { PaperMaterial } from "./ui/materials/PaperMaterial.js";
import { UIPostProcess } from "./ui/effects/UIPostProcess.js";
import { FontManager } from "./ui/core/FontManager.js";
import {
  TypographyConfig,
  getTypographyFamily,
} from "./ui/typography/TypographyConfig.js";

const assetManager = new UIAssetManager();
const fontManager = new FontManager();
Object.values(TypographyConfig).forEach((config) => {
  fontManager.register(config.role, {
    ...config,
    name: config.role,
    family: getTypographyFamily(
      Object.keys(TypographyConfig).find(
        (token) => TypographyConfig[token] === config,
      ),
    ),
  });
});
await fontManager.loadFonts();
const stage = document.getElementById("stage");
const paperTexture = await assetManager.loadImageSource("paperNoise");
const paperMaterial = new PaperMaterial({ textureUrl: paperTexture });

stage.style.setProperty("--memory-clarity", ".35");
stage.style.setProperty("--memory-temperature", ".08");
stage.style.setProperty("--ink-opacity", ".9");
stage.style.setProperty("--ink-contrast", ".98");
stage.style.setProperty("--memory-glow-alpha", ".06");
stage.style.setProperty("--memory-warm-alpha", ".04");
new TextStyleManager().applyRoot(stage);
new UIPostProcess(stage).apply(await assetManager.loadMaterial("postProcess"));

stage.style.setProperty(
  "--ui-button-frame",
  `url("${await assetManager.loadImageSource("buttonFrame")}")`,
);
stage.style.setProperty(
  "--ui-book-page",
  `url("${await assetManager.loadImageSource("bookPage")}")`,
);
stage.style.setProperty(
  "--ui-main-background",
  `url("${await assetManager.loadImageSource("mainMenuBackground")}")`,
);

const sceneArt = stage.querySelector("[data-ui-asset='mainMenuBackground']");
sceneArt.src = await assetManager.loadImageSource("mainMenuBackground");

for (const image of stage.querySelectorAll("img[data-ui-asset]")) {
  const source = await assetManager.loadImageSource(image.dataset.uiAsset);
  image.src = source;
}

stage.querySelectorAll(
  ".settings-sheet, .chapter-archive-sheet, .chapter-card",
).forEach((element) => paperMaterial.apply(element));

window.YesterdayPhase5 = {
  assetManager,
  fontManager,
  setTextStyle(role, style) {
    const manager = new TextStyleManager();
    manager.register(role, style).applyRoot(stage);
  },
};
