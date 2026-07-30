/**
 * 游戏主入口
 * 职责：Canvas 初始化、场景注册、主循环、进度管理
 */

import { InputManager } from './InputManager.js';
import { SceneManager } from './SceneManager.js';
import { ProgressStore } from './ProgressStore.js';

// ── 常量 ──
const DESIGN_W = 1280;
const DESIGN_H = 720;

// ── DOM 引用 ──
const stageEl = document.getElementById('stage');
const canvas = document.getElementById('interact-canvas');
const ctx = canvas.getContext('2d');
const sceneLayer = document.getElementById('scene-layer');
const hintLayer = document.getElementById('hint-layer');
const blackout = document.getElementById('blackout');

// ── 全局游戏状态 ──
let scale = 1, offsetX = 0, offsetY = 0, dpr = 1;
let game = null;
let rafId = null;

// ── Canvas DPR 适配 ──
function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  const stageRect = stageEl.getBoundingClientRect();
  const w = stageRect.width;
  const h = stageRect.height;

  canvas.width = Math.round(DESIGN_W * dpr);
  canvas.height = Math.round(DESIGN_H * dpr);

  // CSS 显示尺寸（填满 stage）
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // scale factors for coordinate transform
  scale = w / DESIGN_W;
  offsetX = 0;
  offsetY = 0;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 300));
resizeCanvas();

// ── 创建游戏上下文 ──
const progress = new ProgressStore();
const input = new InputManager(canvas, DESIGN_W, DESIGN_H);
const sceneManager = new SceneManager();

const gameCtx = {
  canvas, ctx,
  width: DESIGN_W,
  height: DESIGN_H,
  input,
  progress,
  sceneManager,
  sceneLayer,
  hintLayer,
  blackout,
  /** 显示提示文字 */
  showHint(text) {
    hintLayer.innerHTML = text ? `<span class="hint">${text}</span>` : '';
  },
  /** 跳转到记忆报告页 */
  goMemoryReport(chapterId) {
    const url = new URL('./memory-report-artwork.html', window.location.href);
    url.searchParams.set('chapter', chapterId);
    window.location.assign(url.href);
  },
  /** 回到主菜单 */
  goMainMenu() {
    window.location.assign('./main-menu.html');
  },
};

window.__game__ = gameCtx;

// ── 主循环 ──
let lastTime = 0;

function loop(timestamp) {
  rafId = requestAnimationFrame(loop);
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  // 清空 Canvas
  ctx.clearRect(0, 0, DESIGN_W, DESIGN_H);

  // 更新 + 渲染当前场景
  sceneManager.update(dt);
  sceneManager.render(ctx, gameCtx);

  // 黑场过渡
  renderBlackout();
}

function renderBlackout() {
  const t = sceneManager.transition;
  if (t.alpha <= 0) {
    blackout.style.opacity = '0';
    return;
  }
  blackout.style.opacity = String(t.alpha);
}

// ── 动态加载场景模块 ──
const sceneModules = {
  ch01: () => import('../ch01/Ch01Mirror.js'),
  ch02: () => import('../ch02/Ch02Puzzle.js'),
  ch03: () => import('../ch03/Ch03Maze.js'),
  ch04: () => import('../ch04/Ch04Police.js'),
  ch05: () => import('../ch05/Ch05Door.js'),
};

// ── 场景类名映射 ──
const SCENE_CLASS_NAMES = {
  ch01: 'Ch01Mirror',
  ch02: 'Ch02Puzzle',
  ch03: 'Ch03Maze',
  ch04: 'Ch04Police',
  ch05: 'Ch05Door',
};

// ── 启动 ──
function getChapterFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('chapter')) || 1;
}

async function boot() {
  const chapterNum = getChapterFromURL();

  try {
    // 注册场景
    for (const [name, loader] of Object.entries(sceneModules)) {
      const mod = await loader();
      const className = SCENE_CLASS_NAMES[name];
      const SceneClass = mod[className] || mod.default || Object.values(mod)[0];
      sceneManager.register(name, SceneClass);
    }

    // 进入对应章节
    const sceneName = `ch${String(chapterNum).padStart(2, '0')}`;
    if (sceneManager.registry.has(sceneName)) {
      sceneManager.switchTo(sceneName, gameCtx);
    } else {
      gameCtx.showHint(`章节 ${chapterNum} 尚未接入`);
    }

    // 启动主循环
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  } catch (err) {
    console.error('游戏启动失败:', err);
    gameCtx.showHint('画面加载失败');
  }
}

boot();
