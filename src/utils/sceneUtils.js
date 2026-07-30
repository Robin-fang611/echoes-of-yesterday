export function drawImageCover(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

export function drawImageContain(ctx, image, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

export function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

export function drawPrompt(ctx, text, x, y, emphasis = 0) {
  ctx.save();
  const fontSize = 22 + emphasis * 5;
  ctx.font = `500 ${fontSize}px system-ui, "PingFang SC", sans-serif`;
  const paddingX = 24;
  const textWidth = ctx.measureText(text).width;
  const bgWidth = textWidth + paddingX * 2;
  const bgHeight = 44 + emphasis * 6;
  roundedRect(ctx, x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight, bgHeight / 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${0.75 + emphasis * 0.2})`;
  ctx.fill();
  ctx.fillStyle = '#23170d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 测量文字宽度的工具函数
export function measureText(ctx, text, fontSize = 24) {
  ctx.save();
  ctx.font = `500 ${fontSize}px system-ui, "PingFang SC", sans-serif`;
  const w = ctx.measureText(text).width;
  ctx.restore();
  return w;
}
