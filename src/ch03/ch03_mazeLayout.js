// Ch3 迷宫连线 — 地图配置 & 路径校验
// 节点数据由标注工具生成

const NODES = [
  { id: 'start',  x: 225,  y: 268, label: '我的位置',  type: 'start' },
  { id: 'node_1', x: 375,  y: 278, label: '',           type: 'correct' },
  { id: 'node_3', x: 574,  y: 173, label: '',           type: 'correct' },
  { id: 'node_4', x: 693,  y: 203, label: '',           type: 'correct' },
  { id: 'node_5', x: 688,  y: 293, label: '',           type: 'correct' },
  { id: 'node_6', x: 698,  y: 358, label: '',           type: 'correct' },
  { id: 'node_7', x: 758,  y: 387, label: '',           type: 'correct' },
  { id: 'node_8', x: 888,  y: 358, label: '',           type: 'correct' },
  { id: 'node_9', x: 893,  y: 243, label: '',           type: 'correct' },
  { id: 'node_10', x: 1047, y: 293, label: '',          type: 'correct' },
  { id: 'end',    x: 1062, y: 353, label: '希望小学',    type: 'end' },
];

// 误导路径节点 — 走这条路线最终到不了终点
const DECOY_NODES = [
  { id: 'node_2', x: 370,  y: 353 },
  { id: 'node_11', x: 265,  y: 358 },
  { id: 'node_12', x: 255,  y: 482 },
  { id: 'node_13', x: 325,  y: 487 },
  { id: 'node_14', x: 449,  y: 447 },
  { id: 'node_15', x: 539,  y: 497 },
  { id: 'node_16', x: 643,  y: 562 },
  { id: 'node_17', x: 793,  y: 542 },
];

const DEAD_ENDS = [
  { id: 'dead_1', x: 569, y: 358 },
  { id: 'dead_2', x: 728, y: 477 },
  { id: 'dead_3', x: 813, y: 442 },
  { id: 'dead_4', x: 942, y: 402 },
  { id: 'dead_5', x: 967, y: 552 },
  { id: 'dead_6', x: 370, y: 353 },
];

const CORRECT_PATH = NODES.map(n => n.id);

// 自动从 correctPath 生成 edges
const EDGES = [];
for (let i = 0; i < CORRECT_PATH.length - 1; i++) {
  EDGES.push({ from: CORRECT_PATH[i], to: CORRECT_PATH[i + 1], isCorrect: true });
}

export const MAZE_CONFIG = Object.freeze({
  nodeRadius: 50,
  nodes: NODES,
  deadEnds: DEAD_ENDS,
  decoys: DECOY_NODES,
  edges: EDGES,
  correctPath: CORRECT_PATH,
});

/**
 * 根据触摸点序列校验路线
 * @param {Array<{x:number,y:number}>} points — 玩家触摸点
 * @returns {{ success: boolean, checkpointIndex: number, hitWrong: boolean }}
 */
export function validatePath(points) {
  const cfg = MAZE_CONFIG;
  let checkpointIndex = 0;
  let hitWrong = false;

  for (const pt of points) {
    // 检测死胡同
    for (const dead of cfg.deadEnds) {
      if (Math.hypot(pt.x - dead.x, pt.y - dead.y) <= cfg.nodeRadius) {
        hitWrong = true;
        break;
      }
    }
    if (hitWrong) break;

    // 检测是否到达下一个正确节点
    while (checkpointIndex < cfg.correctPath.length - 1) {
      const nextId = cfg.correctPath[checkpointIndex + 1];
      const nextNode = cfg.nodes.find(n => n.id === nextId);
      if (nextNode && Math.hypot(pt.x - nextNode.x, pt.y - nextNode.y) <= cfg.nodeRadius) {
        checkpointIndex++;
      } else {
        break;
      }
    }
  }

  return {
    success: checkpointIndex >= cfg.correctPath.length - 1 && !hitWrong,
    checkpointIndex,
    hitWrong,
  };
}

/**
 * 通过节点 ID 查找节点（含误导节点）
 */
export function getNode(id) {
  const node = MAZE_CONFIG.nodes.find(n => n.id === id);
  if (node) return node;
  const decoy = MAZE_CONFIG.decoys.find(d => d.id === id);
  if (decoy) return decoy;
  return MAZE_CONFIG.deadEnds.find(d => d.id === id);
}

/**
 * 获取所有死胡同节点的 id 集合
 */
export function getDeadEndIds() {
  return MAZE_CONFIG.deadEnds.map(d => d.id);
}

/**
 * 判断屏幕坐标是否在起点附近
 */
export function hitStart(x, y) {
  const start = MAZE_CONFIG.nodes.find(n => n.id === 'start');
  if (!start) return false;
  return Math.hypot(x - start.x, y - start.y) <= MAZE_CONFIG.nodeRadius;
}

/**
 * 判断屏幕坐标是否在终点附近
 */
export function hitEnd(x, y) {
  const end = MAZE_CONFIG.nodes.find(n => n.id === 'end');
  if (!end) return false;
  return Math.hypot(x - end.x, y - end.y) <= MAZE_CONFIG.nodeRadius;
}
