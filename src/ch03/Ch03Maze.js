import { drawPrompt, roundedRect } from '../utils/sceneUtils.js';
import { MAZE_CONFIG, validatePath, hitStart } from './ch03_mazeLayout.js';
import { FlashbackActivity } from '../narrative/FlashbackActivity.js';

// 图片路径常量
const MAP_SRC = './assets/images/ch3_map_phone.png';
const FLASHBACK_SRCS = [
  './assets/images/ch3_cityup_01.jpg',
  './assets/images/ch3_cityup_02.jpg',
  './assets/images/ch3_cityup_03.jpg',
  './assets/images/ch3_cityup_04.jpg',
];
const CH3_CITY_FLASHBACK_FRAMES = ['ch3_cityup_01', 'ch3_cityup_02', 'ch3_cityup_03', 'ch3_cityup_04'];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export class Ch03Maze {
  constructor(game) {
    this.game = game;
    this.points = [];
    this.phase = 'idle';
    this.phaseTime = 0;
    this._completed = false;
    this.flashback = null;
    this.hoveredNode = null;
    this.debug = false;
    this.resetBtn = { x: 880, y: 620, w: 380, h: 80 };
  }

  get isComplete() { return this._completed; }
  get completeTitle() { return '路线找到了'; }
  get completeMessage() { return '记忆的碎片拼合在一起……'; }

  async onEnter() {
    // 加载图片
    if (!this._images) {
      try {
        const [map, ...flashbackImgs] = await Promise.all([
          loadImage(MAP_SRC),
          ...FLASHBACK_SRCS.map(loadImage),
        ]);
        this._images = {
          ch3_map_phone: map,
          flashback: flashbackImgs,
        };
      } catch (err) {
        console.error('Ch3 图片加载失败:', err);
      }
    }

    this.game.showHint('从起点画一条路线到希望小学');
    this.game.input.setHandlers({
      down: point => this.handleDown(point),
      move: point => this.handleMove(point),
      up: point => this.handleUp(point),
      cancel: () => this.handleCancel(),
    });
  }

  onExit() {
    this.game.input.setHandlers();
    this.game.showHint('');
  }

  handleDown(point) {
    if (this.hitResetBtn(point.x, point.y)) {
      this.resetRoute();
      return;
    }
    if (this.phase !== 'idle') return;
    if (!hitStart(point.x, point.y)) return;
    this.points = [point];
    this.phase = 'drawing';
  }

  handleMove(point) {
    this.updateHover(point);
    if (this.phase !== 'drawing') return;
    this.points.push(point);
    const result = validatePath(this.points);
    if (result.hitWrong) {
      this.phase = 'wrong';
      this.phaseTime = 0;
      try { navigator.vibrate?.(30); } catch {}
    }
  }

  handleUp(point) {
    if (this.phase === 'idle') return;
    if (this.phase !== 'drawing') return;
    if (this.points.length < 3) {
      this.points = [];
      this.phase = 'idle';
      return;
    }
    this.points.push(point);
    const result = validatePath(this.points);
    if (result.success) {
      this.phase = 'successHold';
      this.phaseTime = 0;
      try { navigator.vibrate?.(15); } catch {}
    } else if (!result.hitWrong) {
      this.phase = 'wrong';
      this.phaseTime = 0;
    }
  }

  handleCancel() {
    this.points = [];
    this.phase = 'idle';
    this.phaseTime = 0;
  }

  resetRoute() {
    this.points = [];
    this.phase = 'idle';
    this.phaseTime = 0;
    try { navigator.vibrate?.(10); } catch {}
  }

  hitResetBtn(x, y) {
    const b = this.resetBtn;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  updateHover(point) {
    if (this.phase !== 'drawing' && this.phase !== 'idle') {
      this.hoveredNode = null;
      return;
    }
    this.hoveredNode = null;
    for (const node of MAZE_CONFIG.nodes) {
      if (Math.hypot(point.x - node.x, point.y - node.y) <= MAZE_CONFIG.nodeRadius) {
        this.hoveredNode = node.id;
        return;
      }
    }
    for (const decoy of (MAZE_CONFIG.decoys || [])) {
      if (Math.hypot(point.x - decoy.x, point.y - decoy.y) <= MAZE_CONFIG.nodeRadius) {
        this.hoveredNode = decoy.id;
        return;
      }
    }
  }

  update(dt) {
    if (this.phase === 'wrong') {
      this.phaseTime += dt;
      if (this.phaseTime >= 0.8) {
        this.points = [];
        this.phase = 'idle';
        this.phaseTime = 0;
      }
    } else if (this.phase === 'successHold') {
      this.phaseTime += dt;
      if (this.phaseTime >= 1.8) {
        this.phase = 'routeFadeOut';
        this.phaseTime = 0;
      }
    } else if (this.phase === 'routeFadeOut') {
      this.phaseTime += dt;
      if (this.phaseTime >= 1.0) {
        this.phase = 'cityFlashback';
        this.phaseTime = 0;
        this.flashback = new FlashbackActivity(this.game);
        this.flashback.start({
          frames: CH3_CITY_FLASHBACK_FRAMES,
          perFrame: 1.0,
          crossfade: 0.45,
    // 闪回完成 → 跳转记忆报告
          onComplete: () => {
            this._completed = true;
            this.game.progress.markChapterComplete(3, 22);
            this.phase = 'complete';
            setTimeout(() => this.game.goMemoryReport('chapter_03'), 500);
          },
        });
      }
    } else if (this.phase === 'cityFlashback') {
      this.flashback?.update(dt);
    }
  }

  render(ctx) {
    const { width, height } = this.game;

    // 交互节点坐标按地图的 16:9 画布标注，地图本身就是关卡底图。
    const map = this.game.images.ch3_map_phone;
    if (map) {
      const scale = Math.max(width / map.width, height / map.height);
      ctx.drawImage(map, (width - map.width * scale) / 2, (height - map.height * scale) / 2, map.width * scale, map.height * scale);
    } else {
      ctx.fillStyle = '#1a1814';
      ctx.fillRect(0, 0, width, height);
    }

    // 金色路线淡出阶段：alpha 从 1 渐变到 0
    let routeAlpha = 1;
    if (this.phase === 'routeFadeOut') routeAlpha = Math.max(0, 1 - this.phaseTime / 1.0);

    // 城市闪回阶段由 FlashbackActivity 统一驱动（缓动交叉淡入，非硬切）
    if (this.phase === 'cityFlashback') {
      this.flashback?.render(ctx, width, height);
    } else {
      this.drawHoverNode(ctx);
      this.drawPlayerLine(ctx, routeAlpha);
    }

    if (this.phase === 'wrong') {
      const flash = Math.sin(this.phaseTime * 14) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(180, 40, 30, ${flash * 0.25})`;
      ctx.fillRect(0, 0, width, height);

      const lastPt = this.points[this.points.length - 1];
      if (lastPt) {
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, 24, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 50, 40, ${flash * 0.7})`;
        ctx.fill();
      }
    }

    if (this.phase === 'idle') {
      drawPrompt(ctx, '从起点画一条路线到希望小学', width / 2, height - 45, 0);
    } else if (this.phase === 'wrong') {
      drawPrompt(ctx, '再试试吧', width / 2, height - 45, 0.4);
    } else if (this.phase === 'successHold' || this.phase === 'routeFadeOut') {
      drawPrompt(ctx, '找到了！要赶紧去接她……', width / 2, height - 45, 0.4);
    } else if (this.phase === 'cityFlashback') {
      drawPrompt(ctx, '记忆的碎片拼合在一起……', width / 2, height - 45, 0.4);
    }
  }

  drawHoverNode(ctx) {
    if (!this.hoveredNode || this.phase === 'successHold' || this._completed) return;

    let node = MAZE_CONFIG.nodes.find(n => n.id === this.hoveredNode);
    let isDecoy = false;
    if (!node) {
      node = MAZE_CONFIG.decoys.find(d => d.id === this.hoveredNode);
      isDecoy = !!node;
    }
    if (!node) return;

    const isStart = node.type === 'start';
    const isEnd = node.type === 'end';

    ctx.save();
    ctx.shadowColor = isEnd ? '#e05545' : '#f0c040';
    ctx.shadowBlur = 22;

    ctx.beginPath();
    ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = isStart ? 'rgba(76,175,80,0.6)'
      : isEnd ? 'rgba(244,67,54,0.55)'
      : 'rgba(240,192,64,0.55)';
    ctx.fill();
    ctx.restore();

    const label = isStart ? '我的位置' : isEnd ? '希望小学' : '';
    if (label) {
      ctx.save();
      ctx.font = 'bold 14px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const tw = ctx.measureText(label).width;
      const pad = 8;
      const tx = node.x;
      const ty = node.y - 26;
      roundedRect(ctx, tx - tw / 2 - pad, ty - 24, tw + pad * 2, 28, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(label, tx, ty - 2);
      ctx.restore();
    }
  }

  drawPlayerLine(ctx, lineAlpha = 1) {
    if (this.points.length < 2) return;

    const isWrong = this.phase === 'wrong';
    const alpha = (isWrong ? Math.max(0, 1 - this.phaseTime / 0.8) : 1) * lineAlpha;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.shadowColor = isWrong ? '#c03020' : '#e8a840';
    ctx.shadowBlur = isWrong ? 10 : 14;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.strokeStyle = isWrong ? '#d04030' : '#f0b848';
    ctx.lineWidth = isWrong ? 5 : 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = isWrong ? '#e06050' : '#ffd070';
    ctx.lineWidth = isWrong ? 3 : 4;
    ctx.stroke();

    ctx.restore();
  }
}
