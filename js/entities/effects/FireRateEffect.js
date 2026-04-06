// 子弹射速加倍效果
import { PowerUpEffect } from './PowerUpEffect.js';

export class FireRateEffect extends PowerUpEffect {
  /**
   * @param {number} duration - 效果持续时间（毫秒）
   */
  constructor(duration) {
    super(duration);
  }

  apply(target) {
    this._originalMaxCooldown = target.maxCooldown;
    target.maxCooldown /= 2;
  }

  remove(target) {
    target.maxCooldown = this._originalMaxCooldown;
  }
}
