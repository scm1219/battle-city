// 道具实体类
import { Entity } from './Entity.js';
import { POWERUP_SIZE, POWERUP_LIFETIME, POWERUP_BLINK_START, COLORS } from '../utils/constants.js';

export class PowerUp extends Entity {
  /**
   * @param {number} x - 像素坐标 X
   * @param {number} y - 像素坐标 Y
   * @param {string} type - 道具类型: 'speed' | 'fireRate' | 'shield'
   */
  constructor(x, y, type) {
    super(x, y, POWERUP_SIZE, POWERUP_SIZE);
    this.type = type;
    this.createdAt = Date.now();
  }

  /**
   * 更新道具状态
   */
  update(deltaTime) {
    // 超时自动消失
    if (this.isExpired()) {
      this.markedForDeletion = true;
    }
  }

  /**
   * 是否已超时
   */
  isExpired() {
    return Date.now() - this.createdAt >= POWERUP_LIFETIME;
  }

  /**
   * 是否正在闪烁（即将消失）
   */
  isBlinking() {
    const remaining = POWERUP_LIFETIME - (Date.now() - this.createdAt);
    return remaining <= POWERUP_BLINK_START && remaining > 0;
  }

  /**
   * 获取道具剩余时间（毫秒）
   */
  getRemainingTime() {
    return Math.max(0, POWERUP_LIFETIME - (Date.now() - this.createdAt));
  }

  /**
   * 绘制道具
   */
  draw(ctx) {
    // 闪烁阶段：每 200ms 切换可见性
    if (this.isBlinking()) {
      const remaining = this.getRemainingTime();
      if (Math.floor(remaining / 200) % 2 === 0) return;
    }

    const color = this._getColor();
    const size = POWERUP_SIZE;
    const x = this.x;
    const y = this.y;

    // 底色背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x, y, size, size);

    // 边框
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

    // 图标
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    switch (this.type) {
      case 'speed':
        this._drawSpeedIcon(ctx, size);
        break;
      case 'fireRate':
        this._drawFireRateIcon(ctx, size);
        break;
      case 'shield':
        this._drawShieldIcon(ctx, size);
        break;
    }

    ctx.restore();
  }

  /**
   * 获取道具颜色
   */
  _getColor() {
    switch (this.type) {
      case 'speed': return COLORS.POWERUP_SPEED;
      case 'fireRate': return COLORS.POWERUP_FIRERATE;
      case 'shield': return COLORS.POWERUP_SHIELD;
      default: return '#FFFFFF';
    }
  }

  /**
   * 绘制加速图标（闪电）
   */
  _drawSpeedIcon(ctx, size) {
    const s = size * 0.35;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s);
    ctx.lineTo(-s * 0.6, s * 0.1);
    ctx.lineTo(-s * 0.05, s * 0.1);
    ctx.lineTo(-s * 0.3, s);
    ctx.lineTo(s * 0.6, -s * 0.1);
    ctx.lineTo(s * 0.05, -s * 0.1);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 绘制射速图标（双子弹）
   */
  _drawFireRateIcon(ctx, size) {
    const s = size * 0.3;
    // 左子弹
    ctx.fillRect(-s * 0.9, -s * 0.3, s * 1.2, s * 0.6);
    ctx.fillRect(-s * 0.3, -s * 0.15, s * 0.3, s * 0.3);
    // 右子弹
    ctx.fillRect(-s * 0.2, s * 0.1, s * 1.2, s * 0.6);
    ctx.fillRect(s * 0.5, s * 0.25, s * 0.3, s * 0.3);
  }

  /**
   * 绘制护盾图标（盾牌）
   */
  _drawShieldIcon(ctx, size) {
    const s = size * 0.35;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, -s * 0.4);
    ctx.lineTo(s, s * 0.2);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, s * 0.2);
    ctx.lineTo(-s, -s * 0.4);
    ctx.closePath();
    ctx.fill();

    // 盾牌内部线条
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.lineTo(0, s * 0.6);
    ctx.stroke();
  }
}
