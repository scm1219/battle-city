// 敌人类
import { Tank } from './Tank.js';
import { ENEMY_SPEED, ENEMY_COOLDOWN, COLORS, DIRECTION, ENEMY_AI_UPDATE_INTERVAL, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FRAME_TIME, SCORE_PER_ENEMY } from '../utils/constants.js';

export class Enemy extends Tank {
  constructor(x, y) {
    super(x, y, DIRECTION.DOWN, ENEMY_SPEED, 0, ENEMY_COOLDOWN);
    this.color = COLORS.ENEMY;
    this.treadColor = COLORS.ENEMY_TREAD;
    this.aiTimer = 0;
    this.currentDecision = null; // { direction, shouldMove }
    this.killType = 'normal';
  }

  /**
   * AI更新（帧率无关）
   * @param {Object} player - 玩家对象
   * @param {Array} obstacles - 障碍物数组
   * @param {Array} allEnemies - 所有敌人数组
   * @param {number} deltaTime - 距上一帧的毫秒数
   */
  update(player, obstacles, allEnemies, deltaTime = TARGET_FRAME_TIME) {
    const scale = deltaTime / TARGET_FRAME_TIME;
    this.updateCooldown(deltaTime);

    // AI决策（帧率无关计时）
    this.aiTimer += scale;
    if (this.aiTimer >= ENEMY_AI_UPDATE_INTERVAL || !this.currentDecision) {
      this.aiTimer = 0;
      this.makeDecision(player);
    }

    // 执行决策
    if (this.currentDecision && this.currentDecision.shouldMove) {
      const prevX = this.x;
      const prevY = this.y;

      this.move(this.currentDecision.direction);
      super.update(deltaTime);

      // 碰撞检测（障碍物 + 玩家 + 其他敌人）
      if (this.checkCollision(obstacles) || this.checkTankCollision([player, ...allEnemies])) {
        this.x = prevX;
        this.y = prevY;
        // 碰到障碍物后重新决策
        this.aiTimer = ENEMY_AI_UPDATE_INTERVAL;
      }

      // 边界限制
      this.constrainToBounds(CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 尝试射击
    if (this.canShoot()) {
      return this.shoot();
    }

    return null;
  }

  /**
   * AI决策逻辑
   */
  makeDecision(player) {
    const rand = Math.random();

    if (rand < 0.3 && player) {
      // 30% 朝向玩家移动
      this.currentDecision = {
        direction: this.getDirectionToPlayer(player),
        shouldMove: true
      };
    } else if (rand < 0.8) {
      // 50% 随机方向移动
      this.currentDecision = {
        direction: Math.floor(Math.random() * 4),
        shouldMove: true
      };
    } else {
      // 20% 停止移动
      this.currentDecision = {
        direction: this.direction,
        shouldMove: false
      };
    }
  }

  /**
   * 获取朝向玩家的方向
   */
  getDirectionToPlayer(player) {
    if (!player) return DIRECTION.DOWN;

    const dx = player.x - this.x;
    const dy = player.y - this.y;

    // 选择距离更大的轴向
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      return dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }
  }

  /**
   * 受击，返回是否被摧毁（默认一击必杀，HeavyEnemy 覆盖为 HP 机制）
   * @returns {boolean}
   */
  hit() {
    return true;
  }

  /**
   * 获取击毁分值（子类可覆盖）
   * @returns {number}
   */
  getScore() {
    return SCORE_PER_ENEMY;
  }

  /**
   * 获取所有者类型
   */
  getOwner() {
    return 'enemy';
  }
}
