// Ch5 归家迷途 — 布局参数和配置常量

// ====== Gating 1：声相定位（寻找单元门） ======

/**
 * 三个声源配置
 * angle: 在 360° 全景中的角度（0=正中偏左, 180=右）
 * screenBaseX: 在屏幕上大致的基准 X 位置（用于渲染波形）
 * y: 在屏幕上的 Y 位置
 */
export const SOUND_SOURCES = [
  {
    id: 'chopping',
    angle: 45,
    screenBaseX: 220,
    y: 280,
    label: '切菜声',
    hint: '咚咚咚……像是有人在切菜',
    color: '#ffa94d',
    found: false,
    lockProgress: 0,
    wavePhase: 0,
  },
  {
    id: 'tv',
    angle: 150,
    screenBaseX: 640,
    y: 250,
    label: '电视声',
    hint: '新闻联播的前奏曲……',
    color: '#74c0fc',
    found: false,
    lockProgress: 0,
    wavePhase: 1.2,
  },
  {
    id: 'chat',
    angle: 290,
    screenBaseX: 1020,
    y: 310,
    label: '聊天声',
    hint: '熟悉的乡音在夜空中飘荡……',
    color: '#b197fc',
    found: false,
    lockProgress: 0,
    wavePhase: 2.5,
  },
];

export const GATING1_CONFIG = Object.freeze({
  focusRadius: 60,        // 像素 — 距离声源多远算"对准"
  dwellTime: 1.8,         // 秒 — 对准后需要按住多长时间锁定
  waveBars: 24,           // 波形条数量
  maxBarHeight: 70,       // 波形条最大高度
  scanSpeed: 0.8,         // 每像素移动的角度变化系数
  dragDeadZone: 4,        // 拖拽死区（像素）
});

// ====== Gating 2：电梯按钮迷宫 ======

export const ELEVATOR_CONFIG = Object.freeze({
  panelX: 440,
  panelY: 130,
  panelWidth: 400,
  panelHeight: 460,
  cols: 3,
  rows: 2,
  btnW: 100,
  btnH: 80,
  btnGap: 24,
  correctIndex: 5,        // 正确答案在 buttons 数组中的索引（0-based），与 hasSunflower 对应
  sunflowerPetals: 8,
  sunflowerRadius: 42,
  petalLen: 12,
  petalWidth: 5,
});

/**
 * 六个电梯按钮的扭曲参数
 * label: 数字
 * rotation: 旋转角度（度）
 * scaleX/Y: 非均匀缩放
 * offsetX/Y: 位置偏移
 * hasSunflower: 是否有向日葵花瓣线索
 */
export const ELEVATOR_BUTTONS = [
  { label: '1', rotation: 35,  scaleX: 1.3, scaleY: 0.7,  offsetX: 8,  offsetY: -5,  hasSunflower: false },
  { label: '2', rotation: -28, scaleX: 0.7, scaleY: 1.4,  offsetX: -6, offsetY: 8,   hasSunflower: false },
  { label: '3', rotation: 12,  scaleX: 1.1, scaleY: 1.1,  offsetX: 3,  offsetY: 3,   hasSunflower: false },
  { label: '4', rotation: -40, scaleX: 1.3, scaleY: 0.65, offsetX: -8, offsetY: -7,  hasSunflower: false },
  { label: '5', rotation: 22,  scaleX: 0.6, scaleY: 1.3,  offsetX: 4,  offsetY: -4,  hasSunflower: false },
  { label: '6', rotation: -15, scaleX: 1.2, scaleY: 0.8,  offsetX: -3, offsetY: 5,   hasSunflower: true },
];

/**
 * 计算 Gating 1 中声源在屏幕上的活跃度
 * @param {number} scanPos — 当前扫描位置 (0-1280)
 * @param {number} sourceX — 声源基准 X
 * @returns {number} 0~1 的活跃度
 */
export function getSourceLoudness(scanPos, sourceX) {
  const dist = Math.abs(scanPos - sourceX);
  if (dist < GATING1_CONFIG.focusRadius) {
    return 1 - dist / GATING1_CONFIG.focusRadius;
  }
  return 0;
}

/**
 * 计算 Gating 2 中每个按钮在屏幕上的矩形区域
 * @param {number} i — 按钮索引
 * @returns {{ x, y, w, h }}
 */
export function getButtonRect(i) {
  const cfg = ELEVATOR_CONFIG;
  const col = i % cfg.cols;
  const row = Math.floor(i / cfg.cols);
  const x = cfg.panelX + col * (cfg.btnW + cfg.btnGap) + cfg.btnGap / 2;
  const y = cfg.panelY + row * (cfg.btnH + cfg.btnGap) + cfg.btnGap / 2;
  return { x, y, w: cfg.btnW, h: cfg.btnH };
}
