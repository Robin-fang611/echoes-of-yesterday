import { UIComponent } from "../core/UIComponent.js";
import { UILayer, UILayerLevel } from "../core/UILayer.js";
import { AssetCategory } from "../core/AssetRegistry.js";
import { MemoryPanel } from "../components/MemoryPanel.js";
import { MemoryButton } from "../components/MemoryButton.js";
import { TextBlock } from "../components/TextBlock.js";
import { PhotoFrame } from "../components/PhotoFrame.js";
import { RestoredMemoryList } from "../components/RestoredMemoryList.js";
import { ForgottenMemoryList } from "../components/ForgottenMemoryList.js";
import { EmotionText } from "../components/EmotionText.js";
import { DateStamp } from "../components/DateStamp.js";
import { MemorySummary } from "../components/MemorySummary.js";
import { MemoryClarity } from "../components/MemoryClarity.js";
import { MemoryItemDataSource } from "../data/MemoryItemDataSource.js";
import {
  UICanvas,
  UIColor,
  UITypography,
  MemoryReportLabels,
  MemoryReportLayout,
} from "../styles/ui_constants.js";

const CHAPTER_NUMERALS = Object.freeze({
  "01": "一",
  "02": "二",
  "03": "三",
  "04": "四",
  "05": "五",
  "06": "六",
  "07": "七",
  "08": "八",
  "09": "九",
  "10": "十",
});

function formatChapterHeading(data) {
  if (data.chapterLabel) {
    return `${data.chapterLabel} · ${data.title}`;
  }

  const chapterNumber = String(data.chapterId ?? "").match(/chapter_(\d+)/)?.[1];
  const numeral = CHAPTER_NUMERALS[chapterNumber];
  return numeral ? `第${numeral}章 · ${data.title}` : data.title ?? "";
}

function validateChapterData(data) {
  const requiredKeys = [
    "chapterId",
    "date",
    "title",
    "subtitle",
    "photo",
    "restoredMemory",
    "forgottenMemory",
    "emotionText",
    "reportSummary",
    "clarity",
  ];

  for (const key of requiredKeys) {
    if (data?.[key] === undefined) {
      throw new Error(`Chapter data is missing required field: ${key}`);
    }
  }

  if (!Array.isArray(data.restoredMemory)) {
    throw new TypeError("restoredMemory must be an array.");
  }
  if (!Array.isArray(data.forgottenMemory)) {
    throw new TypeError("forgottenMemory must be an array.");
  }
}

export class MemoryReportScreen extends UIComponent {
  constructor({ assetRegistry, fontManager }) {
    super({
      id: "memory-report-screen",
      className: "memory-report-screen",
      ariaLabel: "记忆恢复报告",
    });

    this.assetRegistry = assetRegistry;
    this.fontManager = fontManager;
    this.layers = new Map();
    this.regions = new Map();
    this.buttons = [];
    this.chapterData = null;
    this.memoryItemDataSource = new MemoryItemDataSource();

    this.setLayout({
      position: "relative",
      width: "min(100vw, calc(100svh * 16 / 9))",
      aspectRatio: UICanvas.aspectRatio,
      overflow: "hidden",
      isolation: "isolate",
      background: "#2A1B12",
    });

    this.element.style.setProperty(
      "--font-title",
      this.fontManager.resolveFamily("TitleFont"),
    );
    this.element.style.setProperty(
      "--font-chapter",
      this.fontManager.resolveFamily("ChapterFont"),
    );
    this.element.style.setProperty(
      "--font-body",
      this.fontManager.resolveFamily("BodyFont"),
    );
    this.element.style.setProperty(
      "--font-handwriting",
      this.fontManager.resolveFamily("HandwritingFont"),
    );
    this.element.style.setProperty(
      "--font-system",
      this.fontManager.resolveFamily("SystemFont"),
    );

    this.build();
  }

  createLayer(key, name, level) {
    const layer = new UILayer({
      id: `memory-report-${key}-layer`,
      name,
      level,
      className: `memory-report-layer memory-report-layer--${key}`,
    });
    this.layers.set(key, layer);
    return this.addChild(layer);
  }

  build() {
    const backgroundLayer = this.createLayer(
      "background",
      "BackgroundLayer",
      UILayerLevel.BACKGROUND,
    );
    const paperFrameLayer = this.createLayer(
      "paper-frame",
      "PaperFrameLayer",
      UILayerLevel.PAPER_FRAME,
    );
    const decorationLayer = this.createLayer(
      "decoration",
      "DecorationLayer",
      UILayerLevel.STATIC_DECORATION,
    );
    const contentLayer = this.createLayer(
      "content",
      "ContentLayer",
      UILayerLevel.DYNAMIC_CONTENT,
    );
    const headerLayer = this.createLayer(
      "header",
      "HeaderLayer",
      UILayerLevel.TEXT,
    );
    const chapterLayer = this.createLayer(
      "chapter",
      "ChapterLayer",
      UILayerLevel.TEXT,
    );
    const bottomButtonLayer = this.createLayer(
      "bottom-button",
      "BottomButtonLayer",
      UILayerLevel.INTERACTION,
    );

    const backgroundAsset = this.assetRegistry.image("memoryReportTemplate");
    const background = document.createElement("img");
    background.src = backgroundAsset.source;
    background.alt = "";
    background.draggable = false;
    background.dataset.assetKey = backgroundAsset.key;
    Object.assign(background.style, {
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: "contain",
      objectPosition: "center",
    });
    backgroundLayer.element.appendChild(background);

    paperFrameLayer.element.dataset.role = "fixed-paper-frame";
    decorationLayer.element.dataset.role = "static-decoration";

    this.photoFrame = new PhotoFrame({
      id: "memory-report-photo-frame",
      layout: MemoryReportLayout.photoFrame,
    });
    contentLayer.addChild(this.photoFrame);
    this.regions.set("PhotoFrame", this.photoFrame);

    this.leftPanel = new MemoryPanel({
      id: "memory-report-left-panel",
      region: "left",
      ariaLabel: "情感文字区域",
      layout: MemoryReportLayout.leftPanel,
    });
    this.centerPanel = new MemoryPanel({
      id: "memory-report-center-panel",
      region: "center",
      ariaLabel: "已恢复记忆列表区域",
      layout: MemoryReportLayout.centerPanel,
    });
    this.rightPanel = new MemoryPanel({
      id: "memory-report-right-panel",
      region: "right",
      ariaLabel: "尚未想起内容区域",
      layout: MemoryReportLayout.rightPanel,
    });
    contentLayer.addChild(this.leftPanel);
    contentLayer.addChild(this.centerPanel);
    contentLayer.addChild(this.rightPanel);
    this.regions.set("LeftPanel", this.leftPanel);
    this.regions.set("CenterPanel", this.centerPanel);
    this.regions.set("RightPanel", this.rightPanel);

    this.memorySummary = new MemorySummary({
      id: "memory-report-summary",
    });
    this.memoryClarity = new MemoryClarity({
      id: "memory-report-clarity",
      label: MemoryReportLabels.clarity,
    });
    this.emotionText = new EmotionText({
      id: "memory-report-emotion-text",
      label: MemoryReportLabels.emotion,
    });
    this.leftPanel.addChild(this.memorySummary);
    this.leftPanel.addChild(this.memoryClarity);
    this.leftPanel.addChild(this.emotionText);

    this.restoredList = new RestoredMemoryList({
      id: "memory-report-restored-list",
      heading: MemoryReportLabels.restored,
      archiveLabel: MemoryReportLabels.archived,
    });
    this.centerPanel.addChild(this.restoredList);

    this.forgottenList = new ForgottenMemoryList({
      id: "memory-report-forgotten-list",
      heading: MemoryReportLabels.forgotten,
    });
    this.rightPanel.addChild(this.forgottenList);

    this.headerRegion = new MemoryPanel({
      id: "memory-report-header-region",
      region: "header",
      ariaLabel: "章节英文档案标题区域",
      layout: MemoryReportLayout.header,
    });
    this.chapterRegion = new MemoryPanel({
      id: "memory-report-chapter-region",
      region: "chapter",
      ariaLabel: "章节标题区域",
      layout: MemoryReportLayout.chapter,
    });
    headerLayer.addChild(this.headerRegion);
    chapterLayer.addChild(this.chapterRegion);
    this.regions.set("HeaderLayer", this.headerRegion);
    this.regions.set("ChapterLayer", this.chapterRegion);

    this.chapterSubtitle = new TextBlock({
      id: "memory-report-chapter-subtitle",
      role: "SystemFont",
    });
    this.chapterSubtitle.element.classList.add("chapter-subtitle");
    this.headerRegion.addChild(this.chapterSubtitle);

    this.chapterTitle = new TextBlock({
      id: "memory-report-chapter-title",
      role: "ChapterFont",
    });
    this.chapterTitle.element.classList.add("chapter-heading");
    this.chapterRegion.addChild(this.chapterTitle);

    this.dateStamp = new DateStamp({
      id: "memory-report-date-stamp",
      layout: MemoryReportLayout.stamp,
    });
    decorationLayer.addChild(this.dateStamp);
    this.regions.set("DateStamp", this.dateStamp);

    MemoryReportLabels.buttons.forEach((label, index) => {
      const button = new MemoryButton({
        id: `memory-report-button-${index + 1}`,
        label,
        layout: MemoryReportLayout.buttons[index],
        typography: {
          ...UITypography.ButtonFont,
          family: this.fontManager.resolveFamily("ChapterFont"),
        },
        colors: {
          control: UIColor.controlInk,
        },
      });
      bottomButtonLayer.addChild(button);
      this.buttons.push(button);
    });

    bottomButtonLayer.element.dataset.phase = "no-interaction";
  }

  async loadChapterData(source) {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(
        `Unable to load chapter data (${response.status}): ${source}`,
      );
    }

    const data = await response.json();
    validateChapterData(data);
    data.restoredMemory = await this.memoryItemDataSource.load(
      data.memoryItemsSource,
      data.restoredMemory,
    );
    this.updateUI(data);
    return this.render();
  }

  updateUI(data) {
    validateChapterData(data);
    this.chapterData = structuredClone(data);

    const photoKey = `chapterPhoto:${data.chapterId}`;
    this.assetRegistry.register(
      AssetCategory.IMAGES,
      photoKey,
      data.photo.image,
      {
        role: "ChapterPhoto",
        preserveAspectRatio: true,
      },
    );
    const photoAsset = this.assetRegistry.image(photoKey);

    this.chapterTitle.setText(formatChapterHeading(data));
    this.chapterSubtitle.setText(data.subtitle);
    this.photoFrame.setImage(photoAsset.source, data.photo.alt ?? data.title);
    this.restoredList.setItems(data.restoredMemory);
    this.forgottenList.setItems(data.forgottenMemory);
    this.memorySummary.setData(data.reportSummary);
    this.memoryClarity.setData(data.clarity);
    this.emotionText.setText(data.emotionText);
    this.dateStamp.setDate(data.date);
    this.element.dispatchEvent(
      new CustomEvent("memory-report:update", {
        detail: {
          chapterId: data.chapterId,
          memoryProgress: data.clarity?.current ?? 0,
        },
      }),
    );
    return this;
  }

  render() {
    if (!this.chapterData) {
      return this;
    }

    this.element.dataset.chapterId = this.chapterData.chapterId;
    this.element.dataset.renderState = "ready";
    return this;
  }

  bindVisualSystem(visualSystem, onProgressChange) {
    this.releaseVisualSystem?.();
    this.releaseVisualSystem = visualSystem.subscribe((value) => {
      onProgressChange(value);
    });
    this.visualSystem = visualSystem;
    return this;
  }
}
