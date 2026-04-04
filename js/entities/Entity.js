// 实体基类
import { directionToVector } from '../utils/helpers.js';
import { TARGET_FRAME_TIME } from '../utils/constants.js';

export class Entity {
  constructor(x, y, width, height, direction = 0, speed = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.direction = direction;
    this.speed = speed;
    this.markedForDeletion = false;
  }

  /**
   * 更新实体位置（帧率无关）
   * @param {number} deltaTime - 距上一帧的毫秒数
   */
  update(deltaTime = TARGET_FRAME_TIME) {
    const scale = deltaTime / TARGET_FRAME_TIME;
    const vector = directionToVector(this.direction, this.speed);
    this.x += vector.vx * scale;
    this.y += vector.vy * scale;
  }

  /**
   * 绘制实体（子类需实现）
   */
  draw(ctx) {
    // 子类实现
  }

  /**
   * 获取边界矩形（用于碰撞检测）
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  /**
   * 设置位置
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * 检查是否在画布边界内
   */
  isInBounds(canvasWidth, canvasHeight) {
    return this.x >= 0 &&
           this.y >= 0 &&
           this.x + this.width <= canvasWidth &&
           this.y + this.height <= canvasHeight;
  }

  /**
   * 限制在画布边界内
   */
  constrainToBounds(canvasWidth, canvasHeight) {
    this.x = Math.max(0, Math.min(this.x, canvasWidth - this.width));
    this.y = Math.max(0, Math.min(this.y, canvasHeight - this.height));
  }
}
