// 快速敌人（粉色坦克，速度是普通敌人的2倍）
import { Enemy } from './Enemy.js';
import { FAST_ENEMY_SPEED, COLORS, SCORE_PER_FAST } from '../utils/constants.js';

export class FastEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.speed = FAST_ENEMY_SPEED;
    this.color = COLORS.FAST_ENEMY;
    this.treadColor = COLORS.FAST_ENEMY_TREAD;
    this.killType = 'fast';
  }

  /**
   * 获取击毁分值
   */
  getScore() {
    return SCORE_PER_FAST;
  }
}
