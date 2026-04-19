// 重装敌人（绿色坦克，需击中2次）
import { Enemy } from './Enemy.js';
import { ENEMY_SPEED, ENEMY_COOLDOWN, COLORS, DIRECTION, TARGET_FRAME_TIME } from '../utils/constants.js';

// 受击闪烁持续时间（毫秒）
const HIT_FLASH_DURATION = 167;

export class HeavyEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.hp = 2;
    this.color = COLORS.HEAVY_ENEMY;
    this.treadColor = COLORS.HEAVY_ENEMY_TREAD;
    this.hitFlashTime = 0; // 受击闪烁剩余时间（毫秒）
  }

  /**
   * 受击，返回是否被摧毁
   */
  hit() {
    this.hp--;
    this.hitFlashTime = HIT_FLASH_DURATION;
    return this.hp <= 0;
  }

  /**
   * 更新受击闪烁计时器（帧率无关）
   */
  update(player, obstacles, allEnemies, deltaTime = TARGET_FRAME_TIME) {
    if (this.hitFlashTime > 0) {
      this.hitFlashTime -= deltaTime;
    }
    super.update(player, obstacles, allEnemies, deltaTime);
  }

  /**
   * 绘制重装敌人（覆盖父类以添加受击闪烁和血条）
   */
  draw(ctx) {
    // 受击闪烁效果：白色闪烁
    if (this.hitFlashTime > 0) {
      const savedColor = this.color;
      const savedTread = this.treadColor;
      this.color = '#FFFFFF';
      this.treadColor = '#CCCCCC';
      super.draw(ctx);
      this.color = savedColor;
      this.treadColor = savedTread;
    } else {
      super.draw(ctx);
    }

    // 绘制血条
    const barWidth = 36;
    const barHeight = 3;
    const barX = this.x;
    const barY = this.y - 6;

    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(barX, barY, barWidth * (this.hp / 2), barHeight);
  }
}
