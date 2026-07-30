import { roundedRect } from '../utils/sceneUtils.js';

export function drawArchivePanel(ctx, x, y, w, h, title = '') {
  ctx.save();
  ctx.fillStyle = 'rgba(250, 240, 214, 0.94)';
  roundedRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(91, 63, 32, 0.42)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(105, 72, 35, 0.12)';
  ctx.fillRect(x + 14, y + 44, w - 28, 1);
  if (title) {
    ctx.fillStyle = '#4d3420';
    ctx.font = '600 17px "PingFang SC", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, x + 20, y + 25);
  }
  ctx.restore();
}

export function drawArchiveStamp(ctx, x, y, text) {
  ctx.save();
  ctx.strokeStyle = 'rgba(142, 57, 43, 0.78)';
  ctx.fillStyle = 'rgba(142, 57, 43, 0.07)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8e392b';
  ctx.font = '600 13px "PingFang SC", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawArchiveButton(ctx, x, y, w, h, text) {
  ctx.save();
  ctx.fillStyle = '#4d3420';
  roundedRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = '#c8a66a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#fff7e7';
  ctx.font = '600 16px "PingFang SC", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.restore();
  return { x, y, w, h };
}
