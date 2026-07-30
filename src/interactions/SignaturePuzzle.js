function bounds(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { width: maxX - minX, height: maxY - minY };
}

function classify(points) {
  if (points.length < 2) return 'dot';
  const box = bounds(points);
  if (Math.max(box.width, box.height) < 20) return 'dot';
  if (box.width > box.height * 1.6) return 'horizontal';
  if (box.height > box.width * 1.6) return 'vertical';
  return 'diagonal';
}

export class SignaturePuzzle {
  constructor({ game = null, onComplete = () => {} } = {}) {
    this.game = game;
    this.onComplete = onComplete;
    this.strokes = [];
    this.currentStroke = [];
    this.pointerId = null;
    this.attempts = 0;
    this.completed = false;
    this.notice = '';
    this.noticeTime = 0;
    this.submitRect = { x: 1090, y: 650, width: 150, height: 46 };
    this.clearRect = { x: 920, y: 650, width: 140, height: 46 };
  }

  addStroke(points) {
    if (this.completed || points.length < 2) return;
    this.strokes.push(points.map(point => ({ x: point.x, y: point.y })));
  }

  handleDown(point) {
    if (this.completed) return true;
    if (this._contains(this.submitRect, point)) {
      this.submit();
      return true;
    }
    if (this._contains(this.clearRect, point)) {
      this.clear();
      return true;
    }
    this.pointerId = point.pointerId;
    this.currentStroke = [{ x: point.x, y: point.y }];
    return true;
  }

  handleMove(point) {
    if (this.pointerId !== point.pointerId || this.currentStroke.length === 0) return;
    const last = this.currentStroke[this.currentStroke.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) >= 2) {
      this.currentStroke.push({ x: point.x, y: point.y });
    }
  }

  handleUp(point = {}) {
    if (this.pointerId !== point.pointerId) return;
    this.addStroke(this.currentStroke);
    this.currentStroke = [];
    this.pointerId = null;
  }

  handleCancel() {
    this.currentStroke = [];
    this.pointerId = null;
  }

  clear() {
    this.strokes = [];
    this.currentStroke = [];
    this.notice = '重新写一遍也没关系。';
    this.noticeTime = 1.8;
  }

  submit() {
    if (this.completed) return;
    this.attempts += 1;
    if (this.matchesXiangYang() || this.attempts >= 3) {
      this.completed = true;
      this.notice = this.attempts >= 3 ? '熟悉的笔迹，终于被认出来了。' : '是“向阳”……这名字很熟悉。';
      this.noticeTime = 2.2;
      this.onComplete();
      return;
    }
    this.notice = `再试一次，慢慢写。（${this.attempts}/3）`;
    this.noticeTime = 2.2;
  }

  matchesXiangYang() {
    if (this.strokes.length < 4) return false;
    const zones = [[], []];
    for (const stroke of this.strokes) {
      const centerX = stroke.reduce((sum, point) => sum + point.x, 0) / stroke.length;
      zones[centerX < 640 ? 0 : 1].push(stroke);
    }
    return zones.every(zone => {
      if (zone.length < 2) return false;
      const types = zone.map(classify);
      const allPoints = zone.flat();
      const box = bounds(allPoints);
      return types.includes('horizontal') && types.includes('vertical') && box.width >= 40 && box.height >= 30;
    });
  }

  update(dt) {
    this.noticeTime = Math.max(0, this.noticeTime - dt);
  }

  render(ctx) {
    const { width = 1280, height = 720, images = {} } = this.game || {};
    const paper = images.paperBase;
    if (paper) ctx.drawImage(paper, 0, 0, width, height);
    else {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#fbf4e6');
      gradient.addColorStop(1, '#e9d7b0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = '#3d2a1d';
    ctx.font = '600 34px "PingFang SC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('请签下你的名字：向阳', width / 2, 74);
    ctx.fillStyle = '#806a53';
    ctx.font = '18px "PingFang SC", system-ui, sans-serif';
    ctx.fillText('不必工整，手记得就好。', width / 2, 108);

    ctx.save();
    ctx.strokeStyle = 'rgba(80, 53, 35, 0.28)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(92, 510);
    ctx.lineTo(width - 92, 510);
    ctx.stroke();
    ctx.restore();

    for (const stroke of this.strokes) this._drawStroke(ctx, stroke, '#2a170d');
    if (this.currentStroke.length > 1) this._drawStroke(ctx, this.currentStroke, 'rgba(42, 23, 13, 0.5)');

    this._drawButton(ctx, this.clearRect, '清除', '#a98562', '#fff8ec');
    this._drawButton(ctx, this.submitRect, '提交', '#4e3422', '#fff8ec');

    if (this.noticeTime > 0) {
      ctx.globalAlpha = Math.min(1, this.noticeTime * 2);
      ctx.fillStyle = this.completed ? '#536b3b' : '#805a3a';
      ctx.font = '20px "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.notice, width / 2, 590);
      ctx.globalAlpha = 1;
    }
  }

  _drawStroke(ctx, points, color) {
    if (points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index].x, points[index].y);
    ctx.stroke();
    ctx.restore();
  }

  _drawButton(ctx, rect, label, background, color) {
    ctx.save();
    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 10);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = '600 18px "PingFang SC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
    ctx.restore();
  }

  _contains(rect, point) {
    return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
  }
}
