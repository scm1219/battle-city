// 玩家坦克类
import { Tank } from './Tank.js';
import { PLAYER_SPEED, PLAYER_COOLDOWN, COLORS, DIRECTION, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FRAME_TIME, TANK_SIZE, POWERUP_EFFECT_DURATION } from '../utils/constants.js';
import { directionToVector } from '../utils/helpers.js';
import { SpeedEffect } from './effects/SpeedEffect.js';
import { FireRateEffect } from './effects/FireRateEffect.js';
import { ShieldEffect } from './effects/ShieldEffect.js';

export class Player extends Tank {
  constructor(x, y) {
    super(x, y, DIRECTION.UP, PLAYER_SPEED, 0, PLAYER_COOLDOWN);
    this.color = COLORS.PLAYER;
    this.treadColor = COLORS.PLAYER_TREAD;
    this.effects = [];
    this.invincible = false;
  }

  /**
   * 响应输入更新（帧率无关）
   * @param {Object} input - 输入管理器
   * @param {Array} obstacles - 障碍物数组
   * @param {number} deltaTime - 距上一帧的毫秒数
   */
  update(input, obstacles, enemies, deltaTime = TARGET_FRAME_TIME) {
    this.updateCooldown(deltaTime);
    this.updateEffects(deltaTime);

    // 移动控制
    let moved = false;
    const prevX = this.x;
    const prevY = this.y;

    if (input.isPressed('KeyW') || input.isPressed('ArrowUp')) {
      this.move(DIRECTION.UP);
      moved = true;
    } else if (input.isPressed('KeyS') || input.isPressed('ArrowDown')) {
      this.move(DIRECTION.DOWN);
      moved = true;
    } else if (input.isPressed('KeyA') || input.isPressed('ArrowLeft')) {
      this.move(DIRECTION.LEFT);
      moved = true;
    } else if (input.isPressed('KeyD') || input.isPressed('ArrowRight')) {
      this.move(DIRECTION.RIGHT);
      moved = true;
    }

    if (moved) {
      // 帧率无关位移
      const scale = deltaTime / TARGET_FRAME_TIME;
      const vector = directionToVector(this.direction, this.speed);
      this.x += vector.vx * scale;
      this.y += vector.vy * scale;

      // 碰撞检测 - 障碍物和敌方坦克
      if (this.checkCollision(obstacles) || this.checkTankCollision(enemies)) {
        this.x = prevX;
        this.y = prevY;
      }

      // 边界限制
      this.constrainToBounds(CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 射击控制
    if (input.isPressed('Space')) {
      return this.shoot();
    }

    return null;
  }

  /**
   * 应用道具效果
   * @param {import('./PowerUp.js').PowerUp} powerUp - 拾取的道具
   */
  applyPowerUp(powerUp) {
    // 同类型效果先移除旧的再添加新的（刷新持续时间）
    this.removeEffectByType(powerUp.type);

    let effect;
    switch (powerUp.type) {
      case 'speed':
        effect = new SpeedEffect(POWERUP_EFFECT_DURATION);
        break;
      case 'fireRate':
        effect = new FireRateEffect(POWERUP_EFFECT_DURATION);
        break;
      case 'shield':
        effect = new ShieldEffect(POWERUP_EFFECT_DURATION);
        break;
      default:
        return;
    }

    effect.apply(this);
    this.effects.push(effect);
  }

  /**
   * 更新所有生效中的效果
   * @param {number} deltaTime - 距上一帧的毫秒数
   */
  updateEffects(deltaTime) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.update(deltaTime);

      if (effect.isExpired()) {
        effect.remove(this);
        this.effects.splice(i, 1);
      }
    }
  }

  /**
   * 移除指定类型的效果
   * @param {string} type - 效果类型
   */
  removeEffectByType(type) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      if (this.effects[i].type === type) {
        this.effects[i].remove(this);
        this.effects.splice(i, 1);
      }
    }
  }

  /**
   * 绘制玩家坦克
   */
  draw(ctx) {
    // 先绘制坦克本体
    super.draw(ctx);

    // 无敌护罩效果
    if (this.invincible) {
      this._drawShield(ctx);
    }
  }

  /**
   * 绘制无敌护罩
   */
  _drawShield(ctx) {
    const half = TANK_SIZE / 2;
    const cx = this.x + half;
    const cy = this.y + half;
    const radius = half + 4;

    // 闪烁效果：每 300ms 切换
    const blink = Math.floor(performance.now() / 300) % 2 === 0;
    const alpha = blink ? 0.4 : 0.2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = COLORS.POWERUP_SHIELD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 内圈
    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 获取所有者类型
   */
  getOwner() {
    return 'player';
  }
}
