// Boss 敌人（白色死神）
// 移动策略与普通敌人相同，但前方有我方单位时必定朝向开火
import { Enemy } from './Enemy.js';
import {
  BOSS_SPEED, BOSS_COOLDOWN, BOSS_HP, BOSS_SCORE,
  COLORS, DIRECTION, TARGET_FRAME_TIME,
  TANK_SIZE, GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT,
  ENEMY_AI_UPDATE_INTERVAL
} from '../utils/constants.js';

// 受击闪烁持续时间（毫秒）
const HIT_FLASH_DURATION = 167;

// 射击线检测范围（格子数）
const FIRE_LINE_RANGE = 10;

export class BossEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.speed = BOSS_SPEED;
    this.maxCooldown = BOSS_COOLDOWN;
    this.cooldown = 0;
    this.hp = BOSS_HP;
    this.maxHp = BOSS_HP;
    this.color = COLORS.BOSS_ENEMY;
    this.treadColor = COLORS.BOSS_ENEMY_TREAD;
    this.hitFlashTime = 0;
    this.killType = 'boss';
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
   * Boss update：与 Enemy 相同的移动逻辑，但前方有玩家时必定朝向开火
   */
  update(player, obstacles, allEnemies, deltaTime = TARGET_FRAME_TIME) {
    // 更新受击闪烁
    if (this.hitFlashTime > 0) {
      this.hitFlashTime -= deltaTime;
    }

    const scale = deltaTime / TARGET_FRAME_TIME;
    this.updateCooldown(deltaTime);

    // 前方有玩家 → 面朝玩家，边移动边开火
    const fireDir = this._getFiringDirection(player);
    if (fireDir !== null) {
      this.move(fireDir);

      const prevX = this.x;
      const prevY = this.y;
      switch (fireDir) {
        case DIRECTION.UP:    this.y -= this.speed * scale; break;
        case DIRECTION.RIGHT: this.x += this.speed * scale; break;
        case DIRECTION.DOWN:  this.y += this.speed * scale; break;
        case DIRECTION.LEFT:  this.x -= this.speed * scale; break;
      }

      if (this.checkCollision(obstacles) || this.checkTankCollision([player, ...allEnemies])) {
        this.x = prevX;
        this.y = prevY;
      }

      this.constrainToBounds(CANVAS_WIDTH, CANVAS_HEIGHT);

      if (this.canShoot()) {
        return this.shoot();
      }
      return null;
    }

    // 常规 AI 决策（与 Enemy 相同）
    this.aiTimer += scale;
    if (this.aiTimer >= ENEMY_AI_UPDATE_INTERVAL || !this.currentDecision) {
      this.aiTimer = 0;
      this.makeDecision(player);
    }

    // 执行移动决策
    if (this.currentDecision && this.currentDecision.shouldMove) {
      const prevX = this.x;
      const prevY = this.y;

      this.move(this.currentDecision.direction);

      switch (this.direction) {
        case DIRECTION.UP:    this.y -= this.speed * scale; break;
        case DIRECTION.RIGHT: this.x += this.speed * scale; break;
        case DIRECTION.DOWN:  this.y += this.speed * scale; break;
        case DIRECTION.LEFT:  this.x -= this.speed * scale; break;
      }

      if (this.checkCollision(obstacles) || this.checkTankCollision([player, ...allEnemies])) {
        this.x = prevX;
        this.y = prevY;
        this.aiTimer = ENEMY_AI_UPDATE_INTERVAL;
      }

      this.constrainToBounds(CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 冷却好就射
    if (this.canShoot()) {
      return this.shoot();
    }

    return null;
  }

  /**
   * 检测玩家是否在前方射击线上
   * @returns {number|null} 应朝向的方向，或 null
   */
  _getFiringDirection(player) {
    if (!player || player.markedForDeletion) return null;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const range = GRID_SIZE * FIRE_LINE_RANGE;

    // 同一水平线
    if (Math.abs(dy) < TANK_SIZE && Math.abs(dx) <= range) {
      return dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    }

    // 同一垂直线
    if (Math.abs(dx) < TANK_SIZE && Math.abs(dy) <= range) {
      return dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }

    return null;
  }

  /**
   * 获取击毁分值
   */
  getScore() {
    return BOSS_SCORE;
  }

  /**
   * 绘制 Boss（受击闪烁 + 血条）
   */
  draw(ctx) {
    if (this.hitFlashTime > 0) {
      const savedColor = this.color;
      const savedTread = this.treadColor;
      this.color = '#FF0000';
      this.treadColor = '#CC0000';
      super.draw(ctx);
      this.color = savedColor;
      this.treadColor = savedTread;
    } else {
      super.draw(ctx);
    }

    // 血条
    const barWidth = TANK_SIZE;
    const barHeight = 3;
    const barX = this.x;
    const barY = this.y - 6;

    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? '#00FF00' : hpRatio > 0.25 ? '#FFFF00' : '#FF0000';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  }
}
