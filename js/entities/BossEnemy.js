// Boss 敌人（白色死神，智能 AI）
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
    // 基地目标坐标（像素，网格 8,15 居中）
    this.baseTargetX = 8 * GRID_SIZE + (GRID_SIZE - TANK_SIZE) / 2;
    this.baseTargetY = 15 * GRID_SIZE + (GRID_SIZE - TANK_SIZE) / 2;
    // 绕行计数器（交替尝试两个垂直方向）
    this.dodgeCounter = 0;
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
   * Boss 完整 update（完全覆盖 Enemy.update，加入绕行逻辑）
   */
  update(player, obstacles, allEnemies, deltaTime = TARGET_FRAME_TIME) {
    // 更新受击闪烁
    if (this.hitFlashTime > 0) {
      this.hitFlashTime -= deltaTime;
    }

    const scale = deltaTime / TARGET_FRAME_TIME;
    this.updateCooldown(deltaTime);

    // AI 决策（帧率无关计时）
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

      // 帧率无关位移
      switch (this.direction) {
        case DIRECTION.UP:    this.y -= this.speed * scale; break;
        case DIRECTION.RIGHT: this.x += this.speed * scale; break;
        case DIRECTION.DOWN:  this.y += this.speed * scale; break;
        case DIRECTION.LEFT:  this.x -= this.speed * scale; break;
      }

      // 碰撞检测（障碍物 + 其他坦克）
      if (this.checkCollision(obstacles) || this.checkTankCollision([player, ...allEnemies])) {
        this.x = prevX;
        this.y = prevY;
        // 碰撞后尝试绕行
        this._tryDodge();
      }

      this.constrainToBounds(CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 持续射击（冷却好即射）
    if (this.canShoot()) {
      return this.shoot();
    }

    return null;
  }

  /**
   * Boss 智能 AI 决策
   * 优先级：射击线上的玩家 > 向基地移动
   */
  makeDecision(player) {
    // 1. 检测玩家是否在射击线上
    if (player && !player.markedForDeletion) {
      const fireDir = this._getFiringDirection(player);
      if (fireDir !== null) {
        this.currentDecision = {
          direction: fireDir,
          shouldMove: false
        };
        return;
      }
    }

    // 2. 向基地移动
    const moveDir = this._getDirectionToBase();
    this.currentDecision = {
      direction: moveDir,
      shouldMove: true
    };
  }

  /**
   * 碰撞受阻后尝试绕行（交替尝试垂直方向）
   */
  _tryDodge() {
    this.dodgeCounter++;
    const baseDir = this._getDirectionToBase();
    // 根据基准方向选择两个垂直方向
    let dodgeDirs;
    if (baseDir === DIRECTION.UP || baseDir === DIRECTION.DOWN) {
      dodgeDirs = [DIRECTION.LEFT, DIRECTION.RIGHT];
    } else {
      dodgeDirs = [DIRECTION.UP, DIRECTION.DOWN];
    }
    const idx = this.dodgeCounter % 2;
    this.currentDecision = {
      direction: dodgeDirs[idx],
      shouldMove: true
    };
  }

  /**
   * 检测玩家是否在射击线上
   * @returns {number|null} 应朝向的方向，或 null
   */
  _getFiringDirection(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const range = GRID_SIZE * FIRE_LINE_RANGE;

    // X 轴对齐（同一水平线）
    if (Math.abs(dy) < TANK_SIZE && Math.abs(dx) <= range) {
      return dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    }

    // Y 轴对齐（同一垂直线）
    if (Math.abs(dx) < TANK_SIZE && Math.abs(dy) <= range) {
      return dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }

    return null;
  }

  /**
   * 计算向基地移动的方向
   */
  _getDirectionToBase() {
    const dx = this.baseTargetX - this.x;
    const dy = this.baseTargetY - this.y;

    // 已到达基地附近
    if (Math.abs(dx) < TANK_SIZE && Math.abs(dy) < TANK_SIZE) {
      return DIRECTION.DOWN;
    }

    // 选择距离更大的轴
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      return dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }
  }

  /**
   * 获取击毁分值
   */
  getScore() {
    return BOSS_SCORE;
  }

  /**
   * 绘制 Boss（受击闪烁 + 变色血条）
   */
  draw(ctx) {
    // 受击闪烁效果：红色闪烁
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

    // 绘制血条
    const barWidth = TANK_SIZE;
    const barHeight = 3;
    const barX = this.x;
    const barY = this.y - 6;

    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    // 血量颜色：>50% 绿色，>25% 黄色，<=25% 红色
    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? '#00FF00' : hpRatio > 0.25 ? '#FFFF00' : '#FF0000';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  }
}
