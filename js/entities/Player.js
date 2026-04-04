// 玩家坦克类
import { Tank } from './Tank.js';
import { PLAYER_SPEED, PLAYER_COOLDOWN, COLORS, DIRECTION, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FRAME_TIME } from '../utils/constants.js';
import { directionToVector } from '../utils/helpers.js';

export class Player extends Tank {
  constructor(x, y) {
    super(x, y, DIRECTION.UP, PLAYER_SPEED, 0, PLAYER_COOLDOWN);
    this.color = COLORS.PLAYER;
    this.treadColor = COLORS.PLAYER_TREAD;
  }

  /**
   * 响应输入更新（帧率无关）
   * @param {Object} input - 输入管理器
   * @param {Array} obstacles - 障碍物数组
   * @param {number} deltaTime - 距上一帧的毫秒数
   */
  update(input, obstacles, enemies, deltaTime = TARGET_FRAME_TIME) {
    this.updateCooldown(deltaTime);

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
   * 获取所有者类型
   */
  getOwner() {
    return 'player';
  }
}
