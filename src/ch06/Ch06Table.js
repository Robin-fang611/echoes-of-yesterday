import { drawImageCover, drawPrompt, roundedRect } from '../utils/sceneUtils.js';
import { BOWL, COLLECTION_PANEL, SCENT_PARTICLES, GATING_CONFIG, hitBowl, distToTarget, attractRadius, targetLockRadius } from '../utils/tableLayout.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function vibe(ms) {
  try { navigator.vibrate(ms); } catch (e) { /* 不支持振动 */ }
}

export class Ch06Table {
  constructor(game) {
    this.game = game;
    this.phase = 'narrative';
    this.phaseTime = 0;
    this._complete = false;
    this.time = 0;

    // Gating 1 — 触觉感知
    this.comfortProgress = 0;
    this.fingerInBowl = false;

    // 蒸汽粒子
    this.steam = this._initSteam();

    // Gating 2 — 气味拼图
    this.particles = this._initParticles();
    this.collectedCount = 0;
    this.fingerX = -1;
    this.fingerY = -1;
    this.transformProgress = 0;  // 收集完成后几何体变形动画
    this.transformDone = false;
    // 收集完成时的目标光晕
    this.targetGlow = [0, 0, 0];

    // 叙事文本 — 用多行分段
    this.narrativeLines = [
      '终于进了家门。',
      '"爸，折腾一天饿了吧，快吃。"',
      '桌上是一碗热气腾腾的面条。',
      '可是……这白乎乎的东西是什么怪物？',
    ];
  }

  get isComplete() { return this._complete; }
  get completeTitle() { return '一碗热面，唤醒沉睡的味觉'; }
  get completeMessage() { return '记忆解锁 45%'; }

  _initSteam() {
    const s = [];
    for (let i = 0; i < GATING_CONFIG.steamCount; i++) {
      s.push({
        x: BOWL.cx + (Math.random() - 0.5) * 100,
        y: BOWL.cy - 50 + (Math.random() - 0.5) * 30,
        speed: 20 + Math.random() * 30,
        drift: (Math.random() - 0.5) * 30,
        life: Math.random(),
        phase: Math.random() * Math.PI * 2,
      });
    }
    return s;
  }

  _initParticles() {
    const list = [];
    for (const scent of SCENT_PARTICLES) {
      for (let i = 0; i < scent.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 60;
        list.push({
          scentId: scent.id,
          x: scent.sourceX + Math.cos(angle) * dist,
          y: scent.sourceY + Math.sin(angle) * dist,
          vx: 0, vy: 0,
          locked: false,
          collected: false,
          size: 3 + Math.random() * 4,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    return list;
  }

  async onEnter() {
    if (!this._images) {
      try {
        this._images = {
          ch6_bg_diningroom: await loadImage('./assets/images/ch6_bg_diningroom.jpg'),
          ch6_bowl_noodles: await loadImage('./assets/images/ch6_bowl_noodles.png'),
        };
      } catch (err) { console.error('Ch6 images:', err); }
    }
    this.game.showHint('它冒着热气……试着摸摸碗壁');
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

  // ============ 输入处理 ============

  handleDown(point) {
    try {
      if (this.phase === 'narrative') {
        if (this.phaseTime > 1.5) { this.phase = 'gating1'; this.phaseTime = 0; }
      } else if (this.phase === 'gating1') {
        if (hitBowl(point.x, point.y)) {
          this.fingerInBowl = true;
        }
      }
      // Gating 2 不依赖 down
    } catch (e) { console.error('Ch06 handleDown:', e); }
  }

  handleMove(point) {
    try {
      this.fingerX = point.x;
      this.fingerY = point.y;

      if (this.phase === 'gating1') {
        if (this.fingerInBowl) {
          if (!hitBowl(point.x, point.y)) {
            this.fingerInBowl = false;
          }
        } else if (hitBowl(point.x, point.y)) {
          this.fingerInBowl = true;
        }
      }
    } catch (e) { console.error('Ch06 handleMove:', e); }
  }

  handleUp(_point) {
    if (this.phase === 'gating1') {
      this.fingerInBowl = false;
    }
  }

  handleCancel() {
    this.fingerInBowl = false;
  }

  // ============ update ============

  update(dt) {
    this.time += dt;
    this.phaseTime += dt;

    switch (this.phase) {
      case 'narrative':
        if (this.phaseTime >= 4) { this.phase = 'gating1'; this.phaseTime = 0; }
        break;

      case 'gating1':
        this._updateGating1(dt);
        break;

      case 'gating1_done':
        if (this.phaseTime >= 1.5) {
          this.phase = 'gating2';
          this.phaseTime = 0;
        }
        break;

      case 'gating2':
        this._updateGating2(dt);
        break;

      case 'gating2_celebrate':
        this.transformProgress = Math.min(1, this.phaseTime / 1.5);
        if (this.phaseTime >= 2 && !this._complete) {
          this._complete = true;
          this.phase = 'complete';
          this.phaseTime = 0;
        }
        break;

      case 'complete':
        if (this.phaseTime >= 1 && !this._progressSaved) {
          this._progressSaved = true;
          this.game.progress.markChapterComplete(6, 52);
          setTimeout(() => this.game.goMemoryReport('chapter_06'), 500);
        }
        break;
    }
  }

  _updateGating1(dt) {
    // 蒸汽动画
    for (const s of this.steam) {
      s.life += dt * 0.4;
      if (s.life > 1) { s.life = 0; s.x = BOWL.cx + (Math.random() - 0.5) * 100; s.y = BOWL.cy - 50; }
      s.y -= s.speed * dt;
      s.x += Math.sin(s.life * Math.PI * 2 + s.phase) * s.drift * dt;
    }

    if (this.fingerInBowl && this.comfortProgress < 1) {
      this.comfortProgress = Math.min(1, this.comfortProgress + dt / GATING_CONFIG.comfortTime);
      if (this.comfortProgress >= 1) {
        vibe(20);
        this.phase = 'gating1_done';
        this.phaseTime = 0;
      }
    } else if (!this.fingerInBowl && this.comfortProgress > 0) {
      this.comfortProgress = Math.max(0, this.comfortProgress - GATING_CONFIG.comfortDecay * dt);
    }
  }

  _updateGating2(dt) {
    // 更新粒子（速度阻尼 + 命中锁定，避免漂走/暴露碗底棕色）
    const damp = GATING_CONFIG.velocityDamping;
    for (const p of this.particles) {
      if (p.locked) continue;

      const scent = SCENT_PARTICLES.find(s => s.id === p.scentId);
      if (!scent || scent.collected) continue;

      // 布朗运动：微小随机速度扰动
      p.vx += (Math.random() - 0.5) * 22 * dt;
      p.vy += (Math.random() - 0.5) * 22 * dt;

      // 吸附逻辑：手指进入 attractRadius 即被牵引（速度驱动）
      if (this.fingerX >= 0) {
        const dx = this.fingerX - p.x;
        const dy = this.fingerY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < attractRadius) {
          const strength = 1 - dist / attractRadius;
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          p.vx += nx * GATING_CONFIG.particleSpeed * strength * dt;
          p.vy += ny * GATING_CONFIG.particleSpeed * strength * dt;
        }
      }

      // 速度阻尼（velocity damping）
      p.vx *= damp;
      p.vy *= damp;

      // 积分位置
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // 命中锁定：进入 targetLockRadius 即锁定，吸附到目标中心不漂走
      const d = distToTarget(p.x, p.y, scent);
      if (d < targetLockRadius) {
        p.x = scent.targetX;
        p.y = scent.targetY;
        p.vx = 0;
        p.vy = 0;
        p.locked = true;
        p.collected = true;
        vibe(8);
      }
    }

    // 检查每种香气是否已收集足够粒子
    for (const scent of SCENT_PARTICLES) {
      if (scent.collected) continue;
      const locked = this.particles.filter(p => p.scentId === scent.id && p.locked).length;
      if (locked >= scent.count * 0.7) {
        scent.collected = true;
        this.collectedCount++;
        vibe(15);
      }
    }

    // 目标发光动画
    for (let i = 0; i < 3; i++) {
      const scent = SCENT_PARTICLES[i];
      this.targetGlow[i] += (scent.collected ? 1 - this.targetGlow[i] : 0 - this.targetGlow[i]) * Math.min(1, dt * 4);
    }

    // 全部收集完成
    if (this.collectedCount >= 3 && !this.transformDone) {
      this.transformDone = true;
      this.phase = 'gating2_celebrate';
      this.phaseTime = 0;
    }
  }

  // ============ render ============

  render(ctx) {
    try {
      this._renderSafe(ctx);
    } catch (e) {
      console.error('Ch06 render error:', e);
      ctx.fillStyle = '#0a0806';
      ctx.fillRect(0, 0, this.game.width, this.game.height);
      ctx.fillStyle = '#d4b896';
      ctx.font = '20px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('画面加载异常，请重试', this.game.width / 2, this.game.height / 2);
    }
  }

  _renderSafe(ctx) {
    const { width, height } = this.game;
    switch (this.phase) {
      case 'narrative': this.renderNarrative(ctx); break;
      case 'gating1':
      case 'gating1_done': this.renderGating1(ctx); break;
      case 'gating2': this.renderGating2(ctx); break;
      case 'gating2_celebrate': this.renderGating2Celebrate(ctx); break;
      case 'complete': /* overlay 处理 */ break;
      default:
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(0, 0, width, height);
    }
  }

  // ---------- 叙事开场 ----------

  renderNarrative(ctx) {
    const { width, height } = this.game;
    ctx.fillStyle = '#0a0806';
    ctx.fillRect(0, 0, width, height);

    const alpha = Math.min(1, this.phaseTime / 1.5);
    const textIdx = Math.min(Math.floor(this.phaseTime / 0.9), this.narrativeLines.length - 1);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#d4b896';
    ctx.font = '500 26px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = Math.floor((this.phaseTime - textIdx * 0.9) / 0.035);
    ctx.fillText(this.narrativeLines[textIdx].slice(0, Math.min(chars, this.narrativeLines[textIdx].length)), width / 2, height / 2 - 20);

    if (this.phaseTime > 2.5) {
      ctx.globalAlpha = Math.min(1, (this.phaseTime - 2.5) / 0.8);
      ctx.fillStyle = '#8a7a6a';
      ctx.font = '16px system-ui, "PingFang SC", sans-serif';
      ctx.fillText('点击或触摸继续……', width / 2, height - 60);
    }
    ctx.restore();
  }

  // ---------- Gating 1：触觉与热量感知 ----------

  renderGating1(ctx) {
    const { width, height } = this.game;

    // 1. 餐桌背景
    this._drawTableBg(ctx, width, height);

    // 2. 蒸汽
    this._drawSteam(ctx);

    // 3. 焦虑光晕 + 进度过渡
    this._drawAnxietyVignette(ctx, width, height);

    // 4. 碗 + 荷包蛋怪物
    this._drawBowl(ctx);

    // 5. 温度光晕
    this._drawWarmGlow(ctx);

    // 6. 进度环
    this._drawComfortRing(ctx);

    // 7. 提示文字
    if (this.phase === 'gating1') {
      if (this.fingerInBowl) {
        drawPrompt(ctx, '它是温热的，没有危险……', width / 2, height - 40, 0.2);
      } else if (this.comfortProgress > 0) {
        drawPrompt(ctx, '继续抚摸碗壁……', width / 2, height - 40, 0);
      } else {
        drawPrompt(ctx, '它冒着热气……试着摸摸碗壁', width / 2, height - 40, 0);
      }
    } else if (this.phase === 'gating1_done') {
      const a = Math.min(1, this.phaseTime / 0.8);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#f0c040';
      ctx.font = 'bold 22px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('感觉安全了一些……', width / 2, height - 45);
      ctx.restore();
    }
  }

  _drawTableBg(ctx, width, height) {
    // 优先使用真实餐桌场景底图，加载失败回退程序化渐变
    const bgImg = this._images?.ch6_bg_diningroom || this.game.images.deskBg;
    if (bgImg) {
      drawImageCover(ctx, bgImg, width, height);
      // 暖色遮罩保持文字和互动元素可读性
      ctx.fillStyle = 'rgba(30, 20, 15, 0.35)';
      ctx.fillRect(0, 0, width, height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#2a2018');
      grad.addColorStop(0.5, '#3a2e20');
      grad.addColorStop(1, '#1e1812');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 桌面（叠在背景上）
    ctx.fillStyle = 'rgba(74, 58, 40, 0.6)';
    ctx.beginPath();
    ctx.ellipse(width / 2, height - 60, 500, 120, 0, Math.PI, 0);
    ctx.fill();

    // 桌面高光
    ctx.fillStyle = 'rgba(255, 240, 200, 0.06)';
    ctx.beginPath();
    ctx.ellipse(width / 2, height - 90, 350, 50, 0, Math.PI, 0);
    ctx.fill();
  }

  _drawSteam(ctx) {
    ctx.save();
    for (const s of this.steam) {
      const alpha = Math.sin(s.life * Math.PI) * 0.2;
      ctx.fillStyle = `rgba(240, 230, 210, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4 + Math.sin(s.life * Math.PI * 3) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawAnxietyVignette(ctx, width, height) {
    const p = this.comfortProgress;
    // 红色 → 暖橘色渐变
    const r = Math.round(180 * (1 - p));
    const g = Math.round(50 + 80 * p);
    const b = Math.round(40 + 60 * p);
    const alpha = 0.3 * (1 - p * 0.7);
    const grad = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, 450);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    grad.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 边缘闪烁线条（焦虑特效）
    if (p < 0.8) {
      const flicker = (1 - p) * 0.15 * (0.5 + 0.5 * Math.sin(this.time * 6));
      ctx.save();
      ctx.strokeStyle = `rgba(180, 40, 30, ${flicker})`;
      ctx.lineWidth = 2;
      // 上下边缘不规则线条
      for (let i = 0; i < 8; i++) {
        const lx = Math.random() * width;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx + 20, Math.random() * 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lx, height);
        ctx.lineTo(lx + 20, height - Math.random() * 30);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawBowl(ctx) {
    const cx = BOWL.cx, cy = BOWL.cy;

    ctx.save();

    // 碗的外沿
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#d4c8b0';
    ctx.beginPath();
    ctx.ellipse(cx, cy, BOWL.rx, BOWL.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // 碗内壁（深色）
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#b8a88a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, BOWL.innerRx, BOWL.innerRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 碗内汤底
    ctx.fillStyle = '#8a6a3a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, BOWL.innerRx - 10, BOWL.innerRy - 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 面条（曲线）
    ctx.strokeStyle = '#c8b88a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const baseAngle = i * Math.PI / 2 + this.time * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(baseAngle) * 40, cy - 10 + Math.sin(baseAngle) * 20);
      ctx.quadraticCurveTo(cx + Math.cos(baseAngle + 0.5) * 70, cy - 30, cx + Math.cos(baseAngle + 1) * 40, cy - 15);
      ctx.stroke();
    }

    // 荷包蛋 — 在主角眼中是"怪物"形状
    if (this.phase === 'gating1' || this.phase === 'gating1_done') {
      // 蛋白 = 白色扭曲椭圆（像怪物的眼白）
      ctx.fillStyle = '#f0ece0';
      ctx.beginPath();
      ctx.ellipse(cx + 10, cy - 25, 50, 30, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // 蛋黄 = 黄色圆形（像瞳孔）
      ctx.fillStyle = '#f0a030';
      ctx.beginPath();
      ctx.arc(cx + 5, cy - 28, 12, 0, Math.PI * 2);
      ctx.fill();

      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(cx, cy - 33, 4, 0, Math.PI * 2);
      ctx.fill();

      // 怪物化细节：三叉触须
      ctx.strokeStyle = 'rgba(200,100,80,0.3)';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 20, cy - 12);
        ctx.lineTo(cx + i * 30, cy + 5);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  _drawRealBowl(ctx) {
    // 真实碗层（ch6_bowl_noodles）仅放置一次，作为底层覆盖程序化的棕色汤底
    const img = this._images?.ch6_bowl_noodles;
    if (!img) return;

    const cx = BOWL.cx, cy = BOWL.cy;
    const w = BOWL.rx * 2.2, h = BOWL.ry * 2.2;

    ctx.save();
    // 居中正方形裁剪，避免拉伸变形
    const sw = Math.min(img.width, img.height);
    ctx.drawImage(
      img,
      (img.width - sw) / 2, (img.height - sw) / 2, sw, sw,
      cx - w / 2, cy - h / 2, w, h,
    );
    ctx.restore();
  }

  _drawWarmGlow(ctx) {
    if (this.comfortProgress <= 0) return;
    const alpha = this.comfortProgress * 0.2;
    const grad = ctx.createRadialGradient(BOWL.cx, BOWL.cy, 20, BOWL.cx, BOWL.cy, BOWL.rx + 60);
    grad.addColorStop(0, `rgba(255, 200, 100, ${alpha})`);
    grad.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(BOWL.cx, BOWL.cy, BOWL.rx + 60, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawComfortRing(ctx) {
    if (this.comfortProgress <= 0) return;
    const cx = BOWL.cx, cy = BOWL.cy - BOWL.ry - 30;
    const ringR = 22;

    ctx.save();

    // 背景环
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // 进度环
    ctx.strokeStyle = '#f0c040';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.comfortProgress);
    ctx.stroke();

    // 百分比
    ctx.fillStyle = '#f0c040';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.7;
    ctx.fillText(`${Math.round(this.comfortProgress * 100)}%`, cx, cy);

    ctx.restore();
  }

  // ---------- Gating 2：气味拼图 ----------

  renderGating2(ctx) {
    const { width, height } = this.game;

    // 1. 背景（保持餐桌）
    this._drawTableBg(ctx, width, height);

    // 2. 真实碗层（只放置一次，覆盖碗底棕色）
    this._drawRealBowl(ctx);

    // 3. 抽象化食物（几何体）
    this._drawAbstractFood(ctx);

    // 3. 目标残影区域
    this._drawTargetZones(ctx);

    // 4. 香气粒子
    this._drawParticles(ctx);

    // 5. 手指拖拽光晕
    this._drawFingerGlow(ctx);

    // 6. 收集进度面板
    this._drawCollectionPanel(ctx);

    // 7. 提示文字
    drawPrompt(ctx, '用手指将香气引导到食物上', width / 2, height - 35, 0);
  }

  _drawAbstractFood(ctx) {
    const cx = BOWL.cx, cy = BOWL.cy - 15;

    ctx.save();

    // 面条 = 混乱纠缠的灰色曲线
    ctx.strokeStyle = '#6a6a6a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const t = this.time * 0.8 + i * 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.sin(t) * 30, cy + Math.cos(t * 0.7) * 20);
      ctx.quadraticCurveTo(
        cx + Math.sin(t + 1) * 60, cy + Math.cos(t * 0.5 + 1) * 40,
        cx + Math.sin(t + 2) * 40, cy + Math.cos(t * 0.8 + 2) * 25,
      );
      ctx.stroke();
    }

    // 荷包蛋怪物 = 扭曲的白色几何体 + 黄色圆形
    ctx.fillStyle = '#a0a0a0';
    ctx.beginPath();
    ctx.ellipse(cx + 15, cy - 15, 45, 28, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(cx + 8, cy - 18, 10, 0, Math.PI * 2);
    ctx.fill();

    // 诡异线条
    ctx.strokeStyle = 'rgba(100,80,80,0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = this.time * 1.5 + i * 1.3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 45, cy - 15 + Math.sin(a) * 25);
      ctx.lineTo(cx + Math.cos(a + 0.5) * 55, cy - 15 + Math.sin(a + 0.5) * 35);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawTargetZones(ctx) {
    for (let i = 0; i < SCENT_PARTICLES.length; i++) {
      const scent = SCENT_PARTICLES[i];
      const glow = this.targetGlow[i];

      ctx.save();

      // 外圈发光
      const grad = ctx.createRadialGradient(scent.targetX, scent.targetY, 5, scent.targetX, scent.targetY, GATING_CONFIG.targetRadius + 10);
      grad.addColorStop(0, scent.glowColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(scent.targetX, scent.targetY, GATING_CONFIG.targetRadius + 10, 0, Math.PI * 2);
      ctx.fill();

      // 虚线圆
      ctx.strokeStyle = scent.collected ? scent.color : `rgba(200,200,200,0.3)`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(scent.targetX, scent.targetY, GATING_CONFIG.targetRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 标签
      if (!scent.collected) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '14px system-ui, "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(scent.label, scent.targetX, scent.targetY - GATING_CONFIG.targetRadius - 8);
      } else {
        // 勾号
        ctx.fillStyle = scent.color;
        ctx.font = '20px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.time * 2);
        ctx.fillText('✓', scent.targetX, scent.targetY);
      }

      ctx.restore();
    }
  }

  _drawParticles(ctx) {
    for (let i = 0; i < SCENT_PARTICLES.length; i++) {
      const scent = SCENT_PARTICLES[i];
      if (scent.collected) continue;

      const particles = this.particles.filter(p => p.scentId === scent.id && !p.collected);
      for (const p of particles) {
        ctx.save();

        // 发光
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grad.addColorStop(0, scent.color + '60');
        grad.addColorStop(1, scent.color + '00');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // 粒子本身
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this.time * 2 + p.phase);
        ctx.fillStyle = scent.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  _drawFingerGlow(ctx) {
    if (this.fingerX < 0 || this.fingerY < 0) return;

    ctx.save();
    const grad = ctx.createRadialGradient(this.fingerX, this.fingerY, 0, this.fingerX, this.fingerY, GATING_CONFIG.magnetRadius);
    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.fingerX, this.fingerY, GATING_CONFIG.magnetRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawCollectionPanel(ctx) {
    const cfg = COLLECTION_PANEL;

    ctx.save();

    // 面板背景
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundedRect(ctx, cfg.x - 8, cfg.y - 8, 180, 44, 10);
    ctx.fill();

    for (let i = 0; i < SCENT_PARTICLES.length; i++) {
      const scent = SCENT_PARTICLES[i];
      const bx = cfg.x + i * (cfg.iconSize + cfg.gap);
      const by = cfg.y;

      // 圆圈
      ctx.fillStyle = scent.collected ? scent.color : 'rgba(100,100,100,0.5)';
      ctx.globalAlpha = scent.collected ? 0.9 : 0.4;
      ctx.beginPath();
      ctx.arc(bx + cfg.iconSize / 2, by + cfg.iconSize / 2, cfg.iconSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // 收集后的勾
      if (scent.collected) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', bx + cfg.iconSize / 2, by + cfg.iconSize / 2 + 1);
      }
    }

    ctx.restore();
  }

  // ---------- Gating 2：庆祝过渡动画 ----------

  renderGating2Celebrate(ctx) {
    const { width, height } = this.game;

    this._drawTableBg(ctx, width, height);

    // 真实碗层（只放置一次，覆盖碗底棕色）
    this._drawRealBowl(ctx);

    // 食物从抽象恢复真实的过渡
    const tp = this.transformProgress;
    this._drawTransformingFood(ctx, tp);

    // 目标区域光晕
    for (let i = 0; i < SCENT_PARTICLES.length; i++) {
      const scent = SCENT_PARTICLES[i];
      ctx.save();
      const g = ctx.createRadialGradient(scent.targetX, scent.targetY, 5, scent.targetX, scent.targetY, 40 + tp * 30);
      g.addColorStop(0, scent.color + '80');
      g.addColorStop(1, scent.color + '00');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(scent.targetX, scent.targetY, 40 + tp * 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 蒸汽增多
    ctx.save();
    for (let i = 0; i < 20; i++) {
      const t = this.time * 3 + i * 2.1;
      const sx = BOWL.cx + Math.sin(t) * 60;
      const sy = BOWL.cy - 40 - (t % 60);
      const alpha = Math.sin(t * 0.5) * 0.15;
      ctx.fillStyle = `rgba(240, 230, 210, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 5 + Math.sin(t) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 金色粒子
    ctx.save();
    for (let i = 0; i < 12; i++) {
      const t = this.phaseTime * 8 + i * 2.5;
      const px = width / 2 + Math.cos(t) * (80 + Math.sin(t * 0.7) * 40);
      const py = height / 2 + Math.sin(t * 0.8) * 60;
      ctx.fillStyle = `rgba(240, 192, 64, ${0.3 + 0.2 * Math.sin(t)})`;
      ctx.beginPath();
      ctx.arc(px, py, 2 + Math.sin(t * 2) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 文字
    ctx.save();
    ctx.fillStyle = '#f0c040';
    ctx.font = 'bold 28px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = Math.min(1, tp);
    ctx.fillText('这味道……好熟悉。', width / 2, height / 2 - 30);

    ctx.fillStyle = '#d4b896';
    ctx.font = '18px system-ui, "PingFang SC", sans-serif';
    ctx.globalAlpha = Math.min(1, tp);
    ctx.fillText('是记忆中的味道。', width / 2, height / 2 + 20);

    ctx.restore();
  }

  _drawTransformingFood(ctx, tp) {
    const cx = BOWL.cx, cy = BOWL.cy - 15;

    ctx.save();

    // 面条：从灰色纠缠 → 暖色自然曲线
    const lineColor = tp < 0.5 ? '#6a6a6a' : '#c8b88a';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 4 + (1 - tp) * 2;
    ctx.lineCap = 'round';

    const chaos = 1 - tp;  // 混乱度递减
    for (let i = 0; i < 5; i++) {
      const t = this.time * 0.5 + i * 1.5;
      ctx.beginPath();
      ctx.moveTo(
        cx + Math.sin(t) * 30 * chaos,
        cy + Math.cos(t * 0.7) * 20 * chaos,
      );
      ctx.quadraticCurveTo(
        cx + Math.sin(t + 1) * (40 + tp * 30) * chaos,
        cy + Math.cos(t * 0.5 + 1) * (20 + tp * 15) * chaos,
        cx + Math.sin(t + 2) * (25 + tp * 20),
        cy + Math.cos(t * 0.8 + 2) * (15 + tp * 10),
      );
      ctx.stroke();
    }

    // 荷包蛋：从灰色怪物 → 正常白色蛋白+金黄蛋黄
    const eggGray = Math.round(160 * (1 - tp));
    ctx.fillStyle = `rgb(${240 - eggGray}, ${236 - eggGray * 0.5}, ${224 - eggGray * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(cx + 15 - tp * 5, cy - 15 + tp * 5, 45 - chaos * 10, 28 - chaos * 8, 0.3 * chaos, 0, Math.PI * 2);
    ctx.fill();

    const yolkR = Math.round(240 * tp + 160 * (1 - tp));
    const yolkG = Math.round(160 * tp + 80 * (1 - tp));
    const yolkB = Math.round(48 * tp + 60 * (1 - tp));
    ctx.fillStyle = `rgb(${yolkR}, ${yolkG}, ${yolkB})`;
    ctx.beginPath();
    ctx.arc(cx + 8 - tp * 3, cy - 18 + tp * 3, 10 + tp * 2, 0, Math.PI * 2);
    ctx.fill();

    // 高光恢复
    if (tp > 0.3) {
      ctx.fillStyle = `rgba(255,255,255,${(tp - 0.3) * 0.6})`;
      ctx.beginPath();
      ctx.arc(cx + 5 - tp * 2, cy - 23 + tp * 3, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
