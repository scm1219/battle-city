// 无敌防护罩效果
import { PowerUpEffect } from './PowerUpEffect.js';

export class ShieldEffect extends PowerUpEffect {
  /**
   * @param {number} duration - 效果持续时间（毫秒）
   */
  constructor(duration) {
    super(duration, 'shield');
  }

  apply(target) {
    target.invincible = true;
  }

  remove(target) {
    target.invincible = false;
  }
}
