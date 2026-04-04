// 子弹类
import { Entity } from './Entity.js';
import { BULLET_SPEED, BULLET_SIZE, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FRAME_TIME } from '../utils/constants.js';

export class Bullet extends Entity {
  constructor(x, y, direction, owner) {
    super(x, y, BULLET_SIZE, BULLET_SIZE, direction, BULLET_SPEED);
    this.owner = owner; // 'player' 或 'enemy'
  }

  /**
   * 更新子弹位置（帧率无关）
   * @param {number} deltaTime - 距上一帧的毫秒数
   */
  update(deltaTime = TARGET_FRAME_TIME) {
    super.update(deltaTime);
  }

  /**
   * 检查是否超出边界
   */
  isOutOfBounds() {
    return this.x < 0 ||
           this.y < 0 ||
           this.x + this.width > CANVAS_WIDTH ||
           this.y + this.height > CANVAS_HEIGHT;
  }

  /**
   * 绘制子弹
   */
  draw(ctx) {
    ctx.fillStyle = COLORS.BULLET;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 添加发光效果
    ctx.shadowColor = COLORS.BULLET;
    ctx.shadowBlur = 5;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }

  /**
   * 获取所有者
   */
  getOwner() {
    return this.owner;
  }
}
