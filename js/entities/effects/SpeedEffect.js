// 移动速度加倍效果
import { PowerUpEffect } from './PowerUpEffect.js';

export class SpeedEffect extends PowerUpEffect {
  /**
   * @param {number} duration - 效果持续时间（毫秒）
   */
  constructor(duration) {
    super(duration, 'speed');
  }

  apply(target) {
    this._originalSpeed = target.speed;
    target.speed *= 1.5;
  }

  remove(target) {
    target.speed = this._originalSpeed;
  }
}
