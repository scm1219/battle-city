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
   * 绘制子弹（尖角朝飞行方向）
   */
  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const s = this.width / 2; // 半径

    // 发光层
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = COLORS.BULLET;
    this._drawArrow(ctx, cx, cy, s + 3);
    ctx.globalAlpha = 1.0;

    // 子弹本体
    ctx.fillStyle = COLORS.BULLET;
    this._drawArrow(ctx, cx, cy, s);
  }

  /**
   * 按方向绘制尖角三角形
   */
  _drawArrow(ctx, cx, cy, s) {
    ctx.beginPath();
    // 尖端和两侧根据方向旋转
    const tips = {
      0: [[0, -1], [-0.6, 0.8], [0.6, 0.8]],   // UP
      1: [[1, 0], [-0.8, -0.6], [-0.8, 0.6]],   // RIGHT
      2: [[0, 1], [-0.6, -0.8], [0.6, -0.8]],   // DOWN
      3: [[-1, 0], [0.8, -0.6], [0.8, 0.6]],    // LEFT
    };
    const points = tips[this.direction];
    ctx.moveTo(cx + points[0][0] * s, cy + points[0][1] * s);
    ctx.lineTo(cx + points[1][0] * s, cy + points[1][1] * s);
    ctx.lineTo(cx + points[2][0] * s, cy + points[2][1] * s);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 获取所有者
   */
  getOwner() {
    return this.owner;
  }
}
