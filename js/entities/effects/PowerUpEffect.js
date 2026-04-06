// 道具效果基类
export class PowerUpEffect {
  /**
   * @param {number} duration - 效果持续时间（毫秒）
   */
  constructor(duration) {
    this.remainingTime = duration;
    this.expired = false;
  }

  /**
   * 应用效果到目标
   * @param {import('../Player.js').Player} target - 玩家实体
   */
  apply(target) {
    // 子类实现
  }

  /**
   * 从目标移除效果
   * @param {import('../Player.js').Player} target - 玩家实体
   */
  remove(target) {
    // 子类实现
  }

  /**
   * 更新效果计时
   * @param {number} deltaTime - 距上一帧的毫秒数
   */
  update(deltaTime) {
    this.remainingTime -= deltaTime;
    if (this.remainingTime <= 0) {
      this.remainingTime = 0;
      this.expired = true;
    }
  }

  /**
   * 效果是否已过期
   */
  isExpired() {
    return this.expired;
  }

  /**
   * 获取效果剩余时间（毫秒）
   */
  getRemainingTime() {
    return this.remainingTime;
  }
}
