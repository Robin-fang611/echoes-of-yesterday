import { drawImageCover, drawPrompt, roundedRect } from '../utils/sceneUtils.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
import { drawArchiveButton, drawArchivePanel, drawArchiveStamp } from '../ui/ArchiveUI.js';
import { MontageActivity } from '../narrative/MontageActivity.js';

// Ch10 状态顺序（终章：porridge → montage → reunion → finalReport）
export const CH10_STATES = ['porridge', 'montage', 'reunion', 'finalReport'];

const CHAPTERS = [
  { id: 1, title: '序曲·镜前', memory: 5 },
  { id: 2, title: '接女儿放学', memory: 15 },
  { id: 3, title: '迷途', memory: 22 },
  { id: 4, title: '警局', memory: 30 },
  { id: 5, title: '归家迷途', memory: 40 },
  { id: 6, title: '餐桌上的博弈', memory: 52 },
  { id: 7, title: '惊悚夜醒', memory: 60 },
  { id: 8, title: '自我和解', memory: 72 },
  { id: 9, title: '风铃', memory: 85 },
  { id: 10, title: '认出·不迷路', memory: 100 },
];

// 蒙太奇用到的叙事帧（均为「叙事活动」解耦素材，队友可替换表现形式）
const MONTAGE_FRAMES = [
  'ch10_livingroom',
  'ch10_porridge',
  'ch10_daughter_porridge_closeup',
  'ch10_father_daughter_embrace',
];
const MONTAGE_CAPTIONS = [
  '很多年前，这间屋子也曾热闹过。',
  '一碗粥，等了很久。',
  '她终于认出了回家的路。',
  '这一次，没有再迷路。',
];

export class Ch10Report {
  constructor(game) {
    this.game = game;

    this.phase = 'comicIntro';  // comicIntro → porridge → montage → reunion → finalReport
    this.phaseTime = 0;
    this.totalTime = 0;

    this.steam = [];
    this.bowlCx = 640;
    this.bowlCy = 500;
    this.bowlRx = 140;
    this.bowlRy = 60;
    this.bowlHitRadius = 150;

    this.restartBtn = { x: 550, y: 660, w: 180, h: 42 };

    // 蒙太奇活动（叙事活动，可独立替换）
    this.montage = null;
  }

  get isComplete() { return false; } // 终章，永远不推进

  onEnter() {
    this._initSteam();
    this.phase = 'comicIntro';  // comicIntro → porridge → montage → reunion → finalReport
    this.phaseTime = 0;
    this.totalTime = 0;
    this.game.input.setHandlers({
      down: point => this.handleDown(point),
      move: () => {},
      up: () => {},
      cancel: () => {},
    });
  }

  onExit() {
    this.game.input.setHandlers();
    this.game.showHint('');
  }

  _initSteam() {
    const count = 10 + Math.floor(Math.random() * 6);
    this.steam = [];
    for (let i = 0; i < count; i++) {
      this.steam.push({
        x: this.bowlCx + (Math.random() - 0.5) * this.bowlRx * 1.2,
        y: this.bowlCy - 40 + (Math.random() - 0.5) * 30,
        speed: 25 + Math.random() * 35,
        drift: (Math.random() - 0.5) * 40,
        life: Math.random(),
        phase: Math.random() * Math.PI * 2,
        size: 5 + Math.random() * 8,
      });
    }
  }

  // 状态切换 + 进入初始化
  _go(next) {
    this.phase = next;
    this.phaseTime = 0;
    if (next === 'montage') {
      this.montage = new MontageActivity(this.game);
      this.montage.start({
        frames: MONTAGE_FRAMES,
        captions: MONTAGE_CAPTIONS,
        perFrame: 1.6,
        crossfade: 0.5,
        onComplete: () => this._go('reunion'),
      });
    } else if (next === 'finalReport') {
      // 终章闭合：持久化第 10 章 / 100% 记忆
      this.game.progress.markChapterComplete(10, 100);
        setTimeout(() => this.game.goMemoryReport('chapter_10'), 800);
    }
  }

  handleDown(point) {
    if (this.phase === 'comicIntro') {
      this.phase = 'porridge';
      this.phaseTime = 0;
      return;
    }
    if (this.phase === 'porridge') {
      const dist = Math.hypot(point.x - this.bowlCx, point.y - this.bowlCy);
      if (dist <= this.bowlHitRadius) this._go('montage');
    } else if (this.phase === 'finalReport') {
      const btn = this.restartBtn;
      if (point.x >= btn.x && point.x <= btn.x + btn.w &&
          point.y >= btn.y && point.y <= btn.y + btn.h) {
        this.game.progress.reset();
        setTimeout(() => this.game.chapterManager.switchTo('ch01'), 100);
      }
    }
  }

  update(dt) {
    this.totalTime += dt;
    this.phaseTime += dt;
    if (this.phase === 'comicIntro') {
      this.renderComicIntro(ctx, width, height);
      return;
    }

    switch (this.phase) {
      case 'porridge':
        this._updateSteam(dt);
        break;
      case 'montage':
        this.montage?.update(dt);
        break;
      case 'reunion':
        // 白色淡入后短暂停留 → 进入报告
        if (this.phaseTime >= 3.0) this._go('finalReport');
        break;
      case 'finalReport':
        break;
    }
  }

  _updateSteam(dt) {
    for (const s of this.steam) {
      s.life += dt * 0.35;
      if (s.life > 1) {
        s.life = 0;
        s.x = this.bowlCx + (Math.random() - 0.5) * this.bowlRx * 1.2;
        s.y = this.bowlCy - 40;
      }
      s.y -= s.speed * dt;
      s.x += Math.sin(s.life * Math.PI * 2 + s.phase) * s.drift * dt;
    }
  }

  render(ctx) {
    if (this.phase === 'comicIntro') {
      this.renderComicIntro(ctx, width, height);
      return;
    }

    switch (this.phase) {
      case 'porridge': this._renderPorridge(ctx); break;
      case 'montage': this.montage?.render(ctx, this.game.width, this.game.height); break;
      case 'reunion': this._renderReunion(ctx); break;
      case 'finalReport': this._renderReport(ctx); break;
    }
  }

  // ===================== 阶段1：porridge =====================
  _renderPorridge(ctx) {
    const { width, height } = this.game;
    const bgImg = this._images?.ch10_livingroom;
    if (bgImg) {
      drawImageCover(ctx, bgImg, width, height);
      ctx.fillStyle = 'rgba(18, 10, 6, 0.38)';
      ctx.fillRect(0, 0, width, height);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#3d2018');
      bgGrad.addColorStop(1, '#1a0e06');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    const tableY = height - 80;
    ctx.fillStyle = '#2a1508';
    ctx.fillRect(0, tableY, width, 80);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let y = tableY + 6; y < height - 4; y += 9) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,240,220,0.04)';
    ctx.fillRect(0, tableY, width, 3);

    const bowlImg = this._images?.ch10_porridge;
    if (bowlImg) {
      const bw = bowlImg.width, bh = bowlImg.height;
      const scB = Math.min(250 / bw, 180 / bh);
      ctx.drawImage(bowlImg, this.bowlCx - bw * scB / 2, this.bowlCy - bh * scB / 2, bw * scB, bh * scB);
    } else {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#f5ecd7';
      ctx.beginPath();
      ctx.ellipse(this.bowlCx, this.bowlCy, this.bowlRx, this.bowlRy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(this.bowlCx, this.bowlCy - 2, this.bowlRx - 4, this.bowlRy - 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#e8d5b0';
      ctx.beginPath();
      ctx.ellipse(this.bowlCx, this.bowlCy - 6, this.bowlRx - 16, this.bowlRy - 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    for (const s of this.steam) {
      const alpha = Math.sin(s.life * Math.PI) * 0.25;
      if (alpha <= 0) continue;
      ctx.fillStyle = `rgba(240, 230, 210, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (0.6 + 0.4 * Math.sin(s.life * Math.PI * 3)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    drawPrompt(ctx, '桌上有一碗热粥……喝下去吧。', width / 2, 620, 0);
  }

  // ===================== 阶段3：reunion（拥抱定格 + 白场过渡） =====================
  _renderReunion(ctx) {
    const { width, height } = this.game;
    const embrace = this._images?.ch10_father_daughter_embrace;
    if (embrace) {
      drawImageCover(ctx, embrace, width, height);
    } else {
      ctx.fillStyle = '#1a0e06';
      ctx.fillRect(0, 0, width, height);
    }
    // 白色淡入定格
    const a = Math.min(1, this.phaseTime / 1.2);
    if (a < 1) {
      ctx.fillStyle = `rgba(255,255,255,${1 - a})`;
      ctx.fillRect(0, 0, width, height);
    }
    if (this.phaseTime > 1.4) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (this.phaseTime - 1.4) / 0.8);
      ctx.fillStyle = '#f4e2bd';
      ctx.font = '500 30px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('这一次，没有再迷路。', width / 2, height - 90);
      ctx.restore();
    }
  }

  // ===================== 阶段4：finalReport（记忆报告页） =====================
  _renderReport(ctx) {
    const { width, height } = this.game;
    const baseImg = this._images?.reportBase;
    if (baseImg && !baseImg._placeholder) {
      drawImageCover(ctx, baseImg, width, height);
    } else {
      ctx.fillStyle = '#f5ecd7';
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      const seed = 42;
      for (let i = 0; i < 60; i++) {
        const nx = ((i * 137 + seed * 73) % width);
        const ny = ((i * 251 + seed * 97) % height);
        const opacity = 0.03 + (i % 6) * 0.01;
        ctx.fillStyle = `rgba(212, 196, 160, ${opacity})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawArchivePanel(ctx, 120, 24, width - 240, 82, '记忆恢复档案');
    drawArchiveStamp(ctx, width - 165, 65, '已归档');

    const progress = this.game.progress.load() || { chapter: 1, memory: 0, completed: [] };
    const completed = progress.completed || [];

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const listStartY = 130;
    const lineHeight = 48;
    for (let i = 0; i < CHAPTERS.length; i++) {
      const ch = CHAPTERS[i];
      const y = listStartY + i * lineHeight;
      const isCompleted = completed.includes(ch.id);
      if (isCompleted) {
        ctx.save();
        ctx.fillStyle = 'rgba(196, 168, 120, 0.2)';
        roundedRect(ctx, 180, y - lineHeight / 2 + 2, 860, lineHeight - 4, 6);
        ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.fillStyle = isCompleted ? '#2a1a0c' : '#b8a488';
      ctx.font = '500 20px "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${String(ch.id).padStart(2, '0')} ${ch.title}`, 200, y);
      ctx.textAlign = 'right';
      ctx.font = '500 20px "PingFang SC", system-ui, sans-serif';
      if (isCompleted) {
        ctx.fillStyle = '#2a1a0c';
        ctx.fillText('✅', 1000, y);
      } else {
        ctx.fillStyle = '#b8a488';
        ctx.fillText('◻', 1000, y);
      }
      ctx.restore();
      ctx.save();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isCompleted ? '#8a7a60' : '#d0c0a0';
      ctx.font = '14px "PingFang SC", system-ui, sans-serif';
      ctx.fillText(`${ch.memory}%`, 170, y);
      ctx.restore();
    }
    ctx.restore();

    // 记忆值进度条
    ctx.save();
    const memory = progress.memory || 0;
    const barX = 340, barY = 610, barW = 600, barH = 20, barR = 10;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a1a0c';
    ctx.font = '500 18px "PingFang SC", system-ui, sans-serif';
    ctx.fillText('记忆恢复进度', 200, barY + barH / 2);
    ctx.fillStyle = '#e0d0b0';
    roundedRect(ctx, barX, barY, barW, barH, barR);
    ctx.fill();
    const fillW = Math.min(barW, (barW * memory) / 100);
    if (fillW > 0) {
      const fillGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      fillGrad.addColorStop(0, '#c4a060');
      fillGrad.addColorStop(1, '#8B6914');
      ctx.fillStyle = fillGrad;
      roundedRect(ctx, barX, barY, fillW, barH, barR);
      ctx.fill();
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a1a0c';
    ctx.font = 'bold 22px "PingFang SC", system-ui, sans-serif';
    ctx.fillText(`${memory}%`, barX + barW + 15, barY + barH / 2);
    ctx.restore();

    ctx.save();
    const btn = this.restartBtn;
    drawArchiveButton(ctx, btn.x, btn.y, btn.w, btn.h, '重新开始');
    ctx.restore();
  }
}
