/**
 * 通用漫画章节组件
 * 纯叙事漫画，点击翻页/自动翻页，支持进度指示器
 * 使用方式: new ComicChapter(gameCtx, 'ch06', [图片数组], 记忆值)
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export class ComicChapter {
  /**
   * @param {object} gameCtx - 游戏上下文
   * @param {string} chapterId - 章节 ID，如 'chapter_06'
   * @param {string[]} pages - 漫画图片路径数组
   * @param {number} memoryValue - 记忆值，如 45 / 55 / 65
   * @param {string} chapterNum - 章节编号，如 '6' / '8' / '9'
   */
  constructor(gameCtx, chapterId, pages, memoryValue, chapterNum) {
    this.game = gameCtx;
    this.chapterId = chapterId;       // e.g. 'chapter_06'
    this.pages = pages;               // ['assets/images/ch6_comic_01.png', ...]
    this.memoryValue = memoryValue;   // e.g. 45
    this.chapterNum = chapterNum;     // e.g. 6
    this.currentPage = 0;
    this._completed = false;
    this._progressSaved = false;
    this._images = null;              // [Image, Image, ...]
    this.phaseTime = 0;
    this.nextPageTimer = 0;
    this.AUTO_ADVANCE_SEC = 3600;     // 手动翻页（禁用自动翻页
    this.transitionAlpha = 0;
    this.prevPage = -1;
  }

  get isComplete() { return this._completed; }

  async onEnter() {
    this.game.showHint('');
    this.game.sceneLayer.innerHTML = '';

    // 加载所有漫画图
    if (!this._images) {
      try {
        this._images = await Promise.all(this.pages.map(loadImage));
      } catch (err) {
        console.error(`Comic ${this.chapterId} load error:`, err);
        this._images = [];
      }
    }

    this.currentPage = 0;
    this.phaseTime = 0;
    this.nextPageTimer = 0;
    this._completed = false;
    this._progressSaved = false;
    this.prevPage = -1;

    this.game.input.setHandlers({
      down: (point) => this.handleDown(point),
      move: () => {},
      up: () => {},
      cancel: () => {},
    });
  }

  onExit() {
    this.game.input.setHandlers();
    this.game.showHint('');
  }

  handleDown(point) {
    if (this._completed) return;

    // 点左半边：上一页
    if (point.x < 640 && this.currentPage > 0) {
      this.prevPage = this.currentPage;
      this.currentPage--;
      this.nextPageTimer = 0;
      return;
    }

    // 点右半边或中间：下一页
    if (this.currentPage < this._images.length - 1) {
      this.prevPage = this.currentPage;
      this.currentPage++;
      this.nextPageTimer = 0;
    } else {
      // 最后一页，点击完成
      this.markComplete();
    }
  }

  markComplete() {
    if (this._progressSaved) return;
    this._progressSaved = true;
    this._completed = true;
    this.game.progress.markChapterComplete(this.chapterNum, this.memoryValue);
    setTimeout(() => this.game.goMemoryReport(this.chapterId), 300);
  }

  update(dt) {
    if (this._completed) return;

    this.phaseTime += dt;

    // 自动翻页
    if (this._images.length > 0 && this.currentPage < this._images.length - 1) {
      this.nextPageTimer += dt;
      if (this.nextPageTimer >= this.AUTO_ADVANCE_SEC) {
        this.prevPage = this.currentPage;
        this.currentPage++;
        this.nextPageTimer = 0;
      }
    } // 最后一页手动点击完成，不自动跳转

    // 翻页过渡
    if (this.prevPage >= 0) {
      this.transitionAlpha = Math.min(1, this.transitionAlpha + dt * 4);
    }
  }

  render(ctx, gameCtx) {
    const { width, height } = gameCtx;

    // 背景
    ctx.fillStyle = '#0a0806';
    ctx.fillRect(0, 0, width, height);

    if (!this._images || this._images.length === 0) {
      ctx.fillStyle = '#d4b896';
      ctx.font = '24px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('记忆正在加载……', width / 2, height / 2);
      return;
    }

    // 当前页
    const img = this._images[this.currentPage];
    if (img) {
      const scale = Math.max(width / img.width, height / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.drawImage(img, (width - iw) / 2, (height - ih) / 2, iw, ih);
    }

    // 翻页过渡
    // if (this.prevPage >= 0 && this.transitionAlpha < 1) {
    //   ... skip for simplicity
    // }

    // 底部半透明条
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, height - 60, width, 60);

    // 页码指示器
    const dots = this._images.length;
    const dotR = 4;
    const dotGap = 18;
    const totalW = dots * dotGap * 2;
    const startX = (width - totalW) / 2;

    for (let i = 0; i < dots; i++) {
      const dx = startX + i * dotGap * 2 + dotGap;
      const dy = height - 30;
      ctx.beginPath();
      ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
      if (i === this.currentPage) {
        ctx.fillStyle = '#f0c040';
      } else if (i < this.currentPage) {
        ctx.fillStyle = 'rgba(180,160,130,0.5)';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
      }
      ctx.fill();
    }

    // 页码文字
    ctx.fillStyle = '#d4b896';
    ctx.font = '14px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${this.currentPage + 1} / ${this._images.length}`,
      width / 2 + totalW / 2 + 30,
      height - 30
    );

    // 左右翻页提示（第一页隐藏左箭头，最后一页显示"继续"）
    if (this.currentPage > 0) {
      ctx.fillStyle = 'rgba(212,184,150,0.4)';
      ctx.font = '28px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('‹', 30, height / 2);
    }
    if (this.currentPage < dots - 1) {
      ctx.fillStyle = 'rgba(212,184,150,0.4)';
      ctx.font = '28px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText('›', width - 30, height / 2);
    } else {
      ctx.fillStyle = 'rgba(240,192,64,0.6)';
      ctx.font = '16px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('点击继续 ›', width / 2, height - 80);
    }
  }
}
