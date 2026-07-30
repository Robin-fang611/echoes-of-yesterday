import { MemoryButton } from "./components/Button.js";
import { PaperLayer } from "./components/PaperLayer.js";
import { HoverEffects } from "./animations/HoverEffects.js";
import { MemoryPageTransition } from "./animations/PageTransition.js";

const transition = new MemoryPageTransition();
new HoverEffects(document).mount();

const stage = document.getElementById("stage");
const settingsSheet = document.getElementById("settingsSheet");
const debugToggle = document.getElementById("debugToggle");
const debugPanel = document.getElementById("debugPanel");
const debugUIEnabled =
  new URLSearchParams(window.location.search).get("debugUI") === "true";
debugToggle.hidden = !debugUIEnabled;
debugPanel.hidden = !debugUIEnabled;
const useDirectNavigation = stage.dataset.directNavigation === "true";
const startTarget =
  stage.dataset.startTarget ?? "./memory-report.html";

function navigate(url) {
  if (useDirectNavigation) {
    sessionStorage.removeItem("yesterday:page-transition");
    window.location.assign(url);
    return;
  }
  transition.navigate(url);
}

new PaperLayer(settingsSheet, { depth: "sticky", rotation: 1.2, zIndex: 24 });

const chapterSheet = document.createElement("section");
chapterSheet.className = "chapter-archive-sheet";
chapterSheet.setAttribute("aria-hidden", "true");
chapterSheet.innerHTML = `
  <header>
    <small>MEMORY CHAPTER ARCHIVE</small>
    <h2>章节档案</h2>
    <button type="button" class="chapter-archive-sheet__close" aria-label="合上章节档案">×</button>
  </header>
  <div class="chapter-archive-grid">
    <button type="button" class="chapter-card is-completed" data-chapter="chapter_01">
      <img data-ui-asset="chapter01Photo" alt="">
      <span>第一章 · 送你上学</span><i>已完成</i>
    </button>
    <button type="button" class="chapter-card is-current" data-chapter="chapter_test">
      <img data-ui-asset="chapter02Photo" alt="">
      <span>第二章 · 风铃响起</span><i>当前记忆</i>
    </button>
    <button type="button" class="chapter-card is-locked" disabled>
      <span class="chapter-card__lock">旧锁</span>
      <span>第三章 · 尚未想起</span><i>未解锁</i>
    </button>
  </div>`;
stage.appendChild(chapterSheet);
new PaperLayer(chapterSheet, { depth: "content", rotation: -0.2, zIndex: 27 });

const debug = {
  id: document.getElementById("debugId"),
  state: document.getElementById("debugState"),
  motion: document.getElementById("debugMotion"),
  target: document.getElementById("debugTarget"),
};

function report(element, state, motion) {
  debug.id.textContent = element.id;
  debug.state.textContent = state;
  debug.motion.textContent = motion;
  debug.target.textContent = `#${element.id}`;
}

document.querySelectorAll(".asset-button").forEach((element) => {
  const special = element.id === "BTN_START_MEMORY";
  new MemoryButton(element, {
    special,
    stateKey: element.id,
    onActivate: () => {
      report(
        element,
        "Activated",
        special ? "MOTION_MEMORY_AWAKEN" : "MOTION_BUTTON_RELEASE",
      );
      if (special) navigate(startTarget);
      if (element.id === "BTN_SETTINGS") {
        const open = !settingsSheet.classList.contains("open");
        settingsSheet.classList.toggle("open", open);
        settingsSheet.setAttribute("aria-hidden", String(!open));
      }
      if (element.id === "BTN_CHAPTERS") {
        window.location.assign('./chapter-select.html');
      }
      if (element.id === "BTN_CONTINUE") {
        const saved = JSON.parse(localStorage.getItem('ye_v1_progress') || '{}');
        const next = saved.chapter ? Math.min(saved.chapter + 1, 10) : 1;
        window.location.assign(`./game.html?chapter=${next}`);
      }
    },
  });
});

const savedChapter =
  sessionStorage.getItem("yesterday:chapter-selection") ?? "chapter_test";
chapterSheet.querySelectorAll(".chapter-card[data-chapter]").forEach((card) => {
  card.classList.toggle("is-current", card.dataset.chapter === savedChapter);
});

// ── 根据存档启用/禁用「继续昨日」按钮 ──
(function wireContinueButton() {
  const btn = document.getElementById('BTN_CONTINUE');
  if (!btn) return;
  try {
    const saved = JSON.parse(localStorage.getItem('ye_v1_progress') || '{}');
    if (saved.chapter && saved.chapter >= 1) {
      btn.disabled = false;
    }
  } catch {}
})();

chapterSheet.querySelectorAll(".chapter-card:not(:disabled)").forEach((card) => {
  new PaperLayer(card, {
    depth: card.classList.contains("is-current") ? "photo" : "middle",
    rotation: card.classList.contains("is-current") ? 0.5 : -0.35,
  });
  new MemoryButton(card, {
    special: card.classList.contains("is-current"),
    stateKey: `CHAPTER_${card.dataset.chapter}`,
    onActivate: () => {
      sessionStorage.setItem("yesterday:chapter-selection", card.dataset.chapter);
      navigate(
        `./memory-report.html?chapter=${encodeURIComponent(card.dataset.chapter)}`,
      );
    },
  });
});
new PaperLayer(chapterSheet.querySelector(".chapter-card.is-locked"), {
  depth: "background",
  rotation: -0.5,
});

chapterSheet
  .querySelector(".chapter-archive-sheet__close")
  .addEventListener("click", () => {
    chapterSheet.classList.remove("is-open");
    chapterSheet.setAttribute("aria-hidden", "true");
  });

const savedControl = sessionStorage.getItem("yesterday:last-control");
if (savedControl) {
  document.getElementById(savedControl)?.classList.add("is-persisted-selection");
}

debugToggle.addEventListener("click", () => {
  const enabled = !stage.classList.contains("debug-on");
  stage.classList.toggle("debug-on", enabled);
  debugPanel.classList.toggle("visible", enabled);
  debugToggle.textContent = enabled ? "DEBUG ON" : "DEBUG OFF";
  debugToggle.setAttribute("aria-pressed", String(enabled));
});

document.getElementById("closeSettings").addEventListener("click", () => {
  settingsSheet.classList.remove("open");
  settingsSheet.setAttribute("aria-hidden", "true");
});
