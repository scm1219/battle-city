// 粒子类（爆炸效果）
import { Entity } from './Entity.js';
import { PARTICLE_SIZE, TARGET_FRAME_TIME } from '../utils/constants.js';
import { randomFloat, randomInt } from '../utils/helpers.js';

export class Particle extends Entity {
  constructor(x, y, color) {
    super(
      x,
      y,
      PARTICLE_SIZE,
      PARTICLE_SIZE,
      0,
      0
    );
    this.color = color;
    this.life = 1.0; // 生命值 1.0 -> 0
    this.decay = randomFloat(0.02, 0.05); // 衰减速度

    // 随机速度
    const angle = randomFloat(0, Math.PI * 2);
    const speed = randomFloat(1, 4);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  /**
   * 更新粒子（帧率无关）
   * @param {number} deltaTime - 距上一帧的毫秒数
   */
  update(deltaTime = TARGET_FRAME_TIME) {
    const scale = deltaTime / TARGET_FRAME_TIME;
    this.x += this.vx * scale;
    this.y += this.vy * scale;
    this.life -= this.decay * scale;

    if (this.life <= 0) {
      this.markedForDeletion = true;
    }
  }

  /**
   * 检查是否死亡
   */
  isDead() {
    return this.life <= 0;
  }

  /**
   * 绘制粒子
   */
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }

  /**
   * 创建爆炸效果
   */
  static createExplosion(x, y, count = 10, colors = ['#FF4500', '#FF6347', '#FFD700']) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const color = colors[randomInt(0, colors.length - 1)];
      particles.push(new Particle(x, y, color));
    }
    return particles;
  }

  /**
   * 创建小型爆炸（砖块）
   */
  static createSmallExplosion(x, y) {
    return this.createExplosion(x, y, 5, ['#FF8C00', '#FF7F00']);
  }

  /**
   * 创建大型爆炸（坦克）
   */
  static createLargeExplosion(x, y) {
    return this.createExplosion(x, y, 20, ['#FF4500', '#FF6347', '#FFD700', '#FF0000']);
  }
}
