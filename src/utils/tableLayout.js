// Ch6 餐桌上的博弈 — 布局参数和配置常量

// ====== Gating 1：触觉与热量感知 ======

/** 碗的椭圆绘制参数 */
export const BOWL = Object.freeze({
  cx: 640, cy: 400,
  rx: 180, ry: 90,
  innerRx: 150, innerRy: 70,
});

/** 面板收集进度显示 */
export const COLLECTION_PANEL = Object.freeze({
  x: 40, y: 40,
  iconSize: 28,
  gap: 12,
});

// ====== Gating 2：气味拼图 ======

/** 三种香气粒子的配置 */
export const SCENT_PARTICLES = [
  {
    id: 'soy',
    label: '酱油香',
    color: '#8B4513',
    glowColor: 'rgba(139,69,19,0.3)',
    count: 18,
    sourceX: 960, sourceY: 120,
    targetX: 500, targetY: 360,
    collected: false,
  },
  {
    id: 'onion',
    label: '葱花香',
    color: '#4CAF50',
    glowColor: 'rgba(76,175,80,0.3)',
    count: 15,
    sourceX: 180, sourceY: 100,
    targetX: 640, targetY: 340,
    collected: false,
  },
  {
    id: 'egg',
    label: '煎蛋香',
    color: '#FFD700',
    glowColor: 'rgba(255,215,0,0.3)',
    count: 20,
    sourceX: 640, sourceY: 640,
    targetX: 780, targetY: 380,
    collected: false,
  },
];

export const GATING_CONFIG = Object.freeze({
  comfortTime: 3.0,        // Gating1 抚摸所需总秒数
  comfortDecay: 0.3,       // 离开时每秒衰减
  magnetRadius: 70,        // Gating2 粒子吸附半径（旧）
  targetRadius: 45,        // 目标残影判定半径（旧）
  particleSpeed: 100,      // 粒子吸附移动速度
  steamCount: 12,          // 蒸汽粒子数
  velocityDamping: 0.86,   // 被吸引粒子的速度阻尼系数
});

/**
 * 粒子吸附（吸引）半径：手指进入此半径内粒子开始被牵引。
 * 需 ≥ 110，比旧 magnetRadius 更大，提升交互宽容度。
 */
export const attractRadius = 120;

/**
 * 命中后锁定半径：粒子进入目标此半径即被锁定（targetLock），
 * 吸附后不再漂走，避免暴露碗底棕色。需 ≥ 55。
 */
export const targetLockRadius = 60;

/**
 * 检测点是否在碗的椭圆热区内
 */
export function hitBowl(x, y) {
  const dx = (x - BOWL.cx) / BOWL.rx;
  const dy = (y - BOWL.cy) / BOWL.ry;
  return dx * dx + dy * dy <= 1;
}

/**
 * 计算粒子与目标中心距离
 */
export function distToTarget(px, py, target) {
  return Math.hypot(px - target.targetX, py - target.targetY);
}
