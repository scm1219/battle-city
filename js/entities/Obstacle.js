// 障碍物类
import { Entity } from './Entity.js';
import { GRID_SIZE, COLORS } from '../utils/constants.js';

// 离屏 Canvas 缓存：每种障碍物类型只渲染一次
const _cache = {};

/**
 * 获取指定类型的离屏缓存 Canvas
 */
function getCacheCanvas(type) {
  if (_cache[type]) return _cache[type];

  const size = GRID_SIZE;
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d');

  switch (type) {
    case 'brick':
      renderBrick(ctx, size);
      break;
    case 'steel':
      renderSteel(ctx, size);
      break;
    case 'base':
      renderBase(ctx, size);
      break;
    case 'river':
      renderRiver(ctx, size);
      break;
    case 'forest':
      renderForest(ctx, size);
      break;
  }

  _cache[type] = offscreen;
  return offscreen;
}

/** 离屏渲染砖块 */
function renderBrick(ctx, size) {
  const brickSize = size / 4;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#FF8C00' : '#FF7F00';
      ctx.fillRect(col * brickSize, row * brickSize, brickSize - 1, brickSize - 1);
    }
  }
  ctx.strokeStyle = '#CC7000';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
}

/** 离屏渲染钢块 */
function renderSteel(ctx, size) {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#A0A0A0');
  gradient.addColorStop(0.5, '#808080');
  gradient.addColorStop(1, '#606060');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // 铆钉
  ctx.fillStyle = '#505050';
  const rivetSize = 6;
  const offset = 8;
  ctx.fillRect(offset, offset, rivetSize, rivetSize);
  ctx.fillRect(size - offset - rivetSize, offset, rivetSize, rivetSize);
  ctx.fillRect(offset, size - offset - rivetSize, rivetSize, rivetSize);
  ctx.fillRect(size - offset - rivetSize, size - offset - rivetSize, rivetSize, rivetSize);

  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
}

/** 离屏渲染基地 */
function renderBase(ctx, size) {
  ctx.fillStyle = COLORS.BASE;
  ctx.fillRect(0, 0, size, size);

  // 鹰标轮廓
  const centerX = size / 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(centerX, 8);
  ctx.lineTo(size - 8, size - 8);
  ctx.lineTo(8, size - 8);
  ctx.closePath();
  ctx.fill();

  // 内部细节
  ctx.fillStyle = COLORS.BASE;
  ctx.beginPath();
  ctx.moveTo(centerX, 14);
  ctx.lineTo(size - 14, size - 8);
  ctx.lineTo(14, size - 8);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#1E40AF';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
}

/** 离屏渲染河流 */
function renderRiver(ctx, size) {
  const gradient = ctx.createLinearGradient(0, 0, size, 0);
  gradient.addColorStop(0, '#1565C0');
  gradient.addColorStop(0.3, '#1E90FF');
  gradient.addColorStop(0.7, '#42A5F5');
  gradient.addColorStop(1, '#1565C0');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // 水波纹
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const offsetY = size * (i + 1) / 4;
    ctx.beginPath();
    ctx.moveTo(0, offsetY);
    ctx.quadraticCurveTo(size / 4, offsetY - 3, size / 2, offsetY);
    ctx.quadraticCurveTo(size * 3 / 4, offsetY + 3, size, offsetY);
    ctx.stroke();
  }

  ctx.strokeStyle = '#0D47A1';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, size, size);
}

/** 离屏渲染森林 */
function renderForest(ctx, size) {
  ctx.fillStyle = '#1a5c1a';
  ctx.fillRect(0, 0, size, size);

  const treeSize = size / 3;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = col * treeSize + treeSize / 2;
      const cy = row * treeSize + treeSize / 2;

      ctx.fillStyle = (row + col) % 2 === 0 ? '#2d8b2d' : '#228B22';
      ctx.beginPath();
      ctx.arc(cx, cy, treeSize / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#5c3a1a';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
    }
  }
}

export class Obstacle extends Entity {
  constructor(x, y, type) {
    super(x, y, GRID_SIZE, GRID_SIZE, 0, 0);
    this.type = type; // 'brick', 'steel', 'base', 'river', 'forest'
    // 砖块按方向追踪命中次数，同一方向需2次才摧毁
    this.hitCounts = type === 'brick' ? { 0: 0, 1: 0, 2: 0, 3: 0 } : null;
  }

  /**
   * 受到伤害（按方向追踪）
   * @param {number} direction 子弹飞行方向
   * @returns {boolean} 是否被摧毁
   */
  hit(direction) {
    if (this.type === 'steel' || this.type === 'river' || this.type === 'forest') {
      return false;
    }

    if (this.type === 'brick') {
      this.hitCounts[direction]++;
      if (this.hitCounts[direction] >= 2) {
        this.markedForDeletion = true;
        return true;
      }
      return false;
    }

    // base 及其他类型：一击摧毁
    this.markedForDeletion = true;
    return true;
  }

  /**
   * 是否可破坏
   */
  isDestructible() {
    return this.type !== 'steel' && this.type !== 'river' && this.type !== 'forest';
  }

  /**
   * 是否可被子弹穿过
   */
  isPassableByBullet() {
    return this.type === 'river' || this.type === 'forest';
  }

  /**
   * 是否可被坦克穿过
   */
  isPassableByTank() {
    return this.type === 'forest';
  }

  /**
   * 是否是基地
   */
  isBase() {
    return this.type === 'base';
  }

  /**
   * 绘制障碍物（使用离屏缓存贴图）
   */
  draw(ctx) {
    const cached = getCacheCanvas(this.type);
    ctx.drawImage(cached, this.x, this.y);
  }
}
