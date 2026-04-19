// 坦克基类
import { Entity } from './Entity.js';
import { TANK_SIZE, BULLET_SIZE, TARGET_FRAME_TIME } from '../utils/constants.js';
import { rectIntersect } from '../utils/helpers.js';

export class Tank extends Entity {
  constructor(x, y, direction, speed, cooldown, maxCooldown) {
    super(x, y, TANK_SIZE, TANK_SIZE, direction, speed);
    this.cooldown = cooldown;
    this.maxCooldown = maxCooldown;
    this.hp = 1;
    this.color = '#FFFFFF';  // 子类应设置
    this.treadColor = '#888888';  // 子类应设置
  }

  /**
   * 尝试发射子弹
   * @returns {Object|null} 返回子弹配置对象或null
   */
  shoot() {
    if (this.canShoot()) {
      this.cooldown = this.maxCooldown;
      return this.createBullet();
    }
    return null;
  }

  /**
   * 检查是否可以射击
   */
  canShoot() {
    return this.cooldown <= 0;
  }

  /**
   * 创建子弹配置（子类可覆盖）
   */
  createBullet() {
    const offset = (TANK_SIZE - BULLET_SIZE) / 2;
    let bx, by;

    // 根据方向计算子弹起始位置
    switch (this.direction) {
      case 0: // UP
        bx = this.x + offset;
        by = this.y - BULLET_SIZE;
        break;
      case 1: // RIGHT
        bx = this.x + TANK_SIZE;
        by = this.y + offset;
        break;
      case 2: // DOWN
        bx = this.x + offset;
        by = this.y + TANK_SIZE;
        break;
      case 3: // LEFT
        bx = this.x - BULLET_SIZE;
        by = this.y + offset;
        break;
    }

    return {
      x: bx,
      y: by,
      direction: this.direction,
      owner: this.getOwner()
    };
  }

  /**
   * 获取所有者类型（子类实现）
   */
  getOwner() {
    return 'unknown';
  }

  /**
   * 更新冷却时间（帧率无关）
   * @param {number} deltaTime - 距上一帧的毫秒数
   */
  updateCooldown(deltaTime = TARGET_FRAME_TIME) {
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime / TARGET_FRAME_TIME;
    }
  }

  /**
   * 移动坦克
   */
  move(direction) {
    this.direction = direction;
  }

  /**
   * 检查与障碍物的碰撞（共享方法）
   */
  checkCollision(obstacles) {
    const bounds = this.getBounds();
    for (const obstacle of obstacles) {
      // 森林不阻挡坦克
      if (obstacle.isPassableByTank && obstacle.isPassableByTank()) continue;
      if (rectIntersect(bounds, obstacle.getBounds())) {
        return true;
      }
    }
    return false;
  }

  /**
   * 检查与其他坦克的碰撞
   */
  checkTankCollision(tanks) {
    const bounds = this.getBounds();
    for (const tank of tanks) {
      if (tank === this || tank.markedForDeletion) continue;
      if (rectIntersect(bounds, tank.getBounds())) {
        return true;
      }
    }
    return false;
  }

  /**
   * 绘制坦克（共享方法）
   */
  draw(ctx) {
    const size = TANK_SIZE || 36;
    const half = size / 2;
    const quarter = size / 4;

    ctx.save();
    ctx.translate(this.x + half, this.y + half);

    // 根据方向旋转
    const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    ctx.rotate(angles[this.direction]);

    // 履带
    ctx.fillStyle = this.treadColor;
    ctx.fillRect(-half + 2, -half + 2, quarter - 2, size - 4);
    ctx.fillRect(half - quarter + 2, -half + 2, quarter - 2, size - 4);

    // 车身
    ctx.fillStyle = this.color;
    ctx.fillRect(-quarter, -quarter, half, half);

    // 炮管
    ctx.fillStyle = this.treadColor;
    ctx.fillRect(-2, -half, 4, half);

    // 炮塔
    ctx.fillStyle = this.treadColor;
    ctx.beginPath();
    ctx.arc(0, 0, quarter / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
