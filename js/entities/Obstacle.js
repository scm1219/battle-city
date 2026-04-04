// 障碍物类
import { Entity } from './Entity.js';
import { GRID_SIZE, COLORS } from '../utils/constants.js';

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
   * 绘制障碍物
   */
  draw(ctx) {
    const size = GRID_SIZE;

    switch (this.type) {
      case 'brick':
        this.drawBrick(ctx, size);
        break;
      case 'steel':
        this.drawSteel(ctx, size);
        break;
      case 'base':
        this.drawBase(ctx, size);
        break;
      case 'river':
        this.drawRiver(ctx, size);
        break;
      case 'forest':
        this.drawForest(ctx, size);
        break;
    }
  }

  /**
   * 绘制砖块
   */
  drawBrick(ctx, size) {
    ctx.fillStyle = COLORS.BRICK;

    // 绘制砖块纹理（4x4小格子）
    const brickSize = size / 4;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        // 交错砖块效果
        if ((row + col) % 2 === 0) {
          ctx.fillStyle = '#FF8C00';
        } else {
          ctx.fillStyle = '#FF7F00';
        }
        ctx.fillRect(
          this.x + col * brickSize,
          this.y + row * brickSize,
          brickSize - 1,
          brickSize - 1
        );
      }
    }

    // 边框
    ctx.strokeStyle = '#CC7000';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, size, size);
  }

  /**
   * 绘制钢块
   */
  drawSteel(ctx, size) {
    // 金属渐变效果
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x + size, this.y + size);
    gradient.addColorStop(0, '#A0A0A0');
    gradient.addColorStop(0.5, '#808080');
    gradient.addColorStop(1, '#606060');

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, size, size);

    // 铆钉效果
    ctx.fillStyle = '#505050';
    const rivetSize = 6;
    const offset = 8;
    ctx.fillRect(this.x + offset, this.y + offset, rivetSize, rivetSize);
    ctx.fillRect(this.x + size - offset - rivetSize, this.y + offset, rivetSize, rivetSize);
    ctx.fillRect(this.x + offset, this.y + size - offset - rivetSize, rivetSize, rivetSize);
    ctx.fillRect(this.x + size - offset - rivetSize, this.y + size - offset - rivetSize, rivetSize, rivetSize);

    // 边框
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, size, size);
  }

  /**
   * 绘制基地
   */
  drawBase(ctx, size) {
    // 蓝色背景
    ctx.fillStyle = COLORS.BASE;
    ctx.fillRect(this.x, this.y, size, size);

    // 鹰标（简化版）
    ctx.fillStyle = '#FFFFFF';
    const centerX = this.x + size / 2;
    const centerY = this.y + size / 2;

    // 鹰的轮廓（简单三角形）
    ctx.beginPath();
    ctx.moveTo(centerX, this.y + 8);
    ctx.lineTo(this.x + size - 8, this.y + size - 8);
    ctx.lineTo(this.x + 8, this.y + size - 8);
    ctx.closePath();
    ctx.fill();

    // 内部细节
    ctx.fillStyle = COLORS.BASE;
    ctx.beginPath();
    ctx.moveTo(centerX, this.y + 14);
    ctx.lineTo(this.x + size - 14, this.y + size - 8);
    ctx.lineTo(this.x + 14, this.y + size - 8);
    ctx.closePath();
    ctx.fill();

    // 边框
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, size, size);
  }

  /**
   * 绘制河流
   */
  drawRiver(ctx, size) {
    // 水面渐变
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x + size, this.y);
    gradient.addColorStop(0, '#1565C0');
    gradient.addColorStop(0.3, '#1E90FF');
    gradient.addColorStop(0.7, '#42A5F5');
    gradient.addColorStop(1, '#1565C0');

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, size, size);

    // 水波纹
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    const waveCount = 3;
    for (let i = 0; i < waveCount; i++) {
      const offsetY = size * (i + 1) / (waveCount + 1);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + offsetY);
      ctx.quadraticCurveTo(
        this.x + size / 4, this.y + offsetY - 3,
        this.x + size / 2, this.y + offsetY
      );
      ctx.quadraticCurveTo(
        this.x + size * 3 / 4, this.y + offsetY + 3,
        this.x + size, this.y + offsetY
      );
      ctx.stroke();
    }

    // 边框
    ctx.strokeStyle = '#0D47A1';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, size, size);
  }

  /**
   * 绘制森林
   */
  drawForest(ctx, size) {
    // 深绿色底色
    ctx.fillStyle = '#1a5c1a';
    ctx.fillRect(this.x, this.y, size, size);

    // 绘制树木（3x3 排列的小圆）
    const treeSize = size / 3;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = this.x + col * treeSize + treeSize / 2;
        const cy = this.y + row * treeSize + treeSize / 2;

        // 树冠（圆形）
        ctx.fillStyle = (row + col) % 2 === 0 ? '#2d8b2d' : '#228B22';
        ctx.beginPath();
        ctx.arc(cx, cy, treeSize / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // 树干（中心小点）
        ctx.fillStyle = '#5c3a1a';
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
      }
    }
  }
}
