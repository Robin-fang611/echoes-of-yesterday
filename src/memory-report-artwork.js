import { Button } from "./components/Button.js";
import {
  getArtworkMemoryReportConfig,
  getNextArtworkChapter,
} from "./memory-report-artwork-config.js";

const PROGRESS_DURATION = 1800;
function applyRect(element, rect) {
  element.style.left = `${rect.x}%`;
  element.style.top = `${rect.y}%`;
  element.style.width = `${rect.width}%`;
  element.style.height = `${rect.height}%`;
}

function applyImageCrop(image, crop) {
  image.style.left = `${-crop.x / crop.width * 100}%`;
  image.style.top = `${-crop.y / crop.height * 100}%`;
  image.style.width = `${10000 / crop.width}%`;
  image.style.height = `${10000 / crop.height}%`;
}

function createProgressScale() {
  const scale = document.createElement("div");
  scale.className = "artwork-progress__scale";
  [0, 25, 50, 75, 100].forEach((value) => {
    const mark = document.createElement("span");
    mark.textContent = `${value}%`;
    scale.appendChild(mark);
  });
  return scale;
}

class ArtworkMemoryProgress {
  constructor(config) {
    this.config = config;
    this.element = document.createElement("section");
    this.element.className = "artwork-progress";
    this.element.setAttribute("aria-label", "记忆清晰度");
    applyRect(this.element, config.progressArea);

    this.title = document.createElement("h2");
    this.title.textContent = "记忆清晰度";

    this.values = document.createElement("div");
    this.values.className = "artwork-progress__values";
    this.before = this.createValue("之前", config.memoryFrom, "before");
    this.arrow = document.createElement("span");
    this.arrow.className = "artwork-progress__arrow";
    this.arrow.textContent = "→";
    this.current = this.createValue("现在", config.memoryFrom, "current");
    const position = config.percentagePosition;
    this.values.style.setProperty("--percentage-left-x", `${position.leftX}%`);
    this.values.style.setProperty("--percentage-left-y", `${position.leftY}%`);
    this.values.style.setProperty("--percentage-right-x", `${position.rightX}%`);
    this.values.style.setProperty("--percentage-right-y", `${position.rightY}%`);
    this.values.append(
      this.before.element,
      this.arrow,
      this.current.element,
    );

    this.track = document.createElement("div");
    this.track.className = "artwork-progress__track";
    this.fill = document.createElement("div");
    this.fill.className = "artwork-progress__fill";
    this.fill.style.width = `${config.memoryFrom}%`;
    this.track.appendChild(this.fill);

    this.element.append(
      this.title,
      this.values,
      this.track,
      createProgressScale(),
    );
  }

  createValue(caption, value, variant) {
    const element = document.createElement("div");
    element.className =
      `artwork-progress__value artwork-progress__value--${variant}`;
    const strong = document.createElement("strong");
    strong.textContent = `${value}%`;
    const label = document.createElement("span");
    label.textContent = caption;
    element.append(strong, label);
    return { element, strong };
  }

  async play() {
    const { memoryFrom, memoryTo } = this.config;
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (memoryFrom === memoryTo || reducedMotion) {
      this.current.strong.textContent = `${memoryTo}%`;
      this.fill.style.width = `${memoryTo}%`;
      this.element.dataset.progressState =
        memoryFrom === memoryTo ? "stable" : "complete";
      return memoryFrom !== memoryTo;
    }

    this.element.dataset.progressState = "restoring";
    await new Promise((resolve) => requestAnimationFrame(resolve));
    this.fill.style.width = `${memoryTo}%`;

    const startedAt = performance.now();
    await new Promise((resolve) => {
      const update = (now) => {
        const ratio = Math.min(1, (now - startedAt) / PROGRESS_DURATION);
        const eased = 1 - Math.pow(1 - ratio, 3);
        const value = Math.round(
          memoryFrom + (memoryTo - memoryFrom) * eased,
        );
        this.current.strong.textContent = `${value}%`;
        if (ratio < 1) {
          requestAnimationFrame(update);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(update);
    });
    this.element.dataset.progressState = "complete";
    return true;
  }
}

export class ArtworkMemoryReportApp {
  constructor({ root, chapterId, config = null }) {
    this.root = root;
    this.config = config ?? getArtworkMemoryReportConfig(chapterId);
    sessionStorage.removeItem("yesterday:page-transition");
    this.buttons = [];
    this.build();
  }

  build() {
    this.stage = document.createElement("main");
    this.stage.className = "artwork-memory-report";
    this.stage.dataset.chapterId = this.config.chapterId;

    this.artwork = document.createElement("img");
    this.artwork.className = "artwork-memory-report__image";
    this.artwork.src = this.config.backgroundImage;
    this.artwork.alt = "";
    this.artwork.draggable = false;

    this.progress = new ArtworkMemoryProgress(this.config);
    this.stage.append(this.artwork, this.progress.element);
    if (this.config.coverImageOverlay) {
      const coverImage = document.createElement("img");
      coverImage.className = "artwork-memory-report__cover-overlay";
      coverImage.src = this.config.coverImageOverlay;
      coverImage.alt = "";
      coverImage.setAttribute("aria-hidden", "true");
      this.stage.appendChild(coverImage);
    }
    this.buildButtons();
    this.root.replaceChildren(this.stage);
  }

  buildButtons() {
    this.config.buttonAreas.forEach((area) => {
      const element = document.createElement("div");
      element.id = `artwork-report-button-${area.id}`;
      element.className = "artwork-report-image-button";
      element.setAttribute("role", "button");
      element.setAttribute("aria-label", area.label);
      applyRect(element, area);

      const image = document.createElement("img");
      image.className = "artwork-report-image-button__image";
      image.src = area.image;
      image.alt = "";
      image.draggable = false;
      image.setAttribute("aria-hidden", "true");
      applyImageCrop(image, area.crop);
      element.appendChild(image);
      this.stage.appendChild(element);

      const button = new Button(element, {
        type: "artwork-image",
        special: area.action === "continue",
        stateKey: element.id,
        onActivate: () => this.handleButton(area.action),
      });
      this.buttons.push(button);
    });
  }

  handleButton(action) {
    if (action === "continue") {
      // 根据章节 ID 跳到对应的游戏关卡
      const chapterMap = {
        'chapter_01': '2',
        'chapter_02': '3',
        'chapter_03': '4',
        'chapter_04': '5',
        'chapter_05': '6',
        'chapter_07': '8',
        'chapter_10': '1',
      };
      const nextNum = chapterMap[this.config.chapterId] || '1';
      window.location.assign(`./game.html?chapter=${nextNum}`);
    }
    if (action === "archive") {
      const chNum = (this.config.chapterId || '').replace('chapter_', '');
      window.location.assign(`./medical-notes.html?chapter=${chNum}`);
    }
    if (action === "home") window.location.assign("./main-menu.html");
  }

  async start() {
    await this.artwork.decode().catch(() => {});
    this.stage.classList.add("is-artwork-ready");
    this.buttons.forEach((button) => button.disable());
    await this.progress.play();
    this.buttons.forEach((button) => button.enable());
    this.stage.dataset.renderState = "complete";
    return this;
  }
}

export function createArtworkMemoryReportApp(options) {
  return new ArtworkMemoryReportApp(options);
}
