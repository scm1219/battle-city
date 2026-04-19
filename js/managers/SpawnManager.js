// 敌人生成管理器
import { SPAWN_POINTS, SPAWN_INTERVAL_INITIAL, SPAWN_INTERVAL_MIN, GRID_SIZE, TANK_SIZE } from '../utils/constants.js';
import { randomInt, rectIntersect } from '../utils/helpers.js';

export class SpawnManager {
  constructor() {
    this.lastSpawnTime = 0;
    this.currentInterval = SPAWN_INTERVAL_INITIAL;
    this.gameStartTime = performance.now();
  }

  /**
   * 判断是否应该生成敌人
   */
  shouldSpawn() {
    const now = performance.now();
    const elapsed = now - this.lastSpawnTime;

    if (elapsed >= this.currentInterval) {
      this.lastSpawnTime = now;
      return true;
    }
    return false;
  }

  /**
   * 生成敌人
   * @param {Array} enemies - 当前敌人列表
   * @param {Object|null} player - 玩家对象，用于避免生成在玩家身上
   */
  spawnEnemy(enemies = [], player = null) {
    // 更新难度（随时间缩短生成间隔）
    this.updateDifficulty();

    // 用精确碰撞检测筛选可用生成点
    const availablePoints = SPAWN_POINTS.filter(point => {
      const px = point.x * GRID_SIZE + (GRID_SIZE - TANK_SIZE) / 2;
      const py = point.y * GRID_SIZE + (GRID_SIZE - TANK_SIZE) / 2;
      const spawnBounds = { x: px, y: py, width: TANK_SIZE, height: TANK_SIZE };

      // 检查与现有敌人的碰撞
      for (const e of enemies) {
        if (rectIntersect(spawnBounds, e.getBounds())) {
          return false;
        }
      }

      // 检查与玩家的碰撞
      if (player && !player.markedForDeletion) {
        if (rectIntersect(spawnBounds, player.getBounds())) {
          return false;
        }
      }

      return true;
    });

    if (availablePoints.length === 0) return null;

    // 随机选择一个可用生成点
    const spawnPoint = availablePoints[randomInt(0, availablePoints.length - 1)];

    // 转换为像素坐标（居中）
    const x = spawnPoint.x * GRID_SIZE + (GRID_SIZE - TANK_SIZE) / 2;
    const y = spawnPoint.y * GRID_SIZE + (GRID_SIZE - TANK_SIZE) / 2;

    return { x, y };
  }

  /**
   * 更新难度（根据游戏时间）
   */
  updateDifficulty() {
    const elapsed = performance.now() - this.gameStartTime;
    const seconds = Math.floor(elapsed / 1000);

    // 难度曲线
    if (seconds < 30) {
      this.currentInterval = SPAWN_INTERVAL_INITIAL; // 3秒
    } else if (seconds < 60) {
      this.currentInterval = 2000; // 2秒
    } else {
      this.currentInterval = SPAWN_INTERVAL_MIN; // 1秒
    }
  }

  /**
   * 重置生成器
   */
  reset() {
    this.lastSpawnTime = 0;
    this.currentInterval = SPAWN_INTERVAL_INITIAL;
    this.gameStartTime = performance.now();
  }
}
