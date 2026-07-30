import { UIManager } from "./core/UIManager.js";
import { FontManager, FontRole } from "./core/FontManager.js";
import { AssetRegistry, AssetCategory } from "./core/AssetRegistry.js";
import { MemoryReportScreen } from "./screens/MemoryReportScreen.js";
import {
  TypographyConfig,
  TypographyToken,
  getTypographyFamily,
} from "./typography/TypographyConfig.js";

export function createMemoryReportApp({
  root,
  assets,
  fonts = {},
}) {
  const assetRegistry = new AssetRegistry();
  assetRegistry.register(
    AssetCategory.IMAGES,
    "memoryReportTemplate",
    assets.memoryReportTemplate,
    {
      role: "BackgroundLayer",
      crop: false,
      filter: false,
      preserveAspectRatio: true,
    },
  );

  const fontManager = new FontManager();
  const fontTokens = [
    [FontRole.TITLE, TypographyToken.TITLE_FONT],
    [FontRole.CHAPTER, TypographyToken.CHAPTER_FONT],
    [FontRole.BODY, TypographyToken.BODY_FONT],
    [FontRole.HANDWRITING, TypographyToken.HANDWRITING_FONT],
    [FontRole.SYSTEM, TypographyToken.SYSTEM_FONT],
  ];
  fontTokens.forEach(([role, token]) => {
    const config = TypographyConfig[token];
    fontManager.register(role, {
      ...config,
      name: config.role,
      family: fonts[config.role] ?? getTypographyFamily(token),
    });
  });

  const uiManager = new UIManager({
    root,
    assetRegistry,
    fontManager,
  });

  const memoryReportScreen = new MemoryReportScreen({
    assetRegistry,
    fontManager,
  });

  uiManager.registerScreen("MemoryReport", memoryReportScreen);
  uiManager.showScreen("MemoryReport");

  return {
    uiManager,
    assetRegistry,
    fontManager,
    memoryReportScreen,
  };
}
