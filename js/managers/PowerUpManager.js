// 道具生成管理器
import { PowerUp } from '../entities/PowerUp.js';
import { POWERUP_TYPES, POWERUP_SPAWN_INTERVAL, POWERUP_MAX_COUNT, GRID_SIZE, GRID_COUNT } from '../utils/constants.js';

export class PowerUpManager {
  /**
   * 判断是否应该生成道具
   * @param {PowerUp[]} powerUps - 当前场景中的道具数组
   * @param {number} lastSpawnTime - 上次生成时间戳
   * @returns {boolean}
   */
  static shouldSpawn(powerUps, lastSpawnTime) {
    if (powerUps.length >= POWERUP_MAX_COUNT) return false;
    return Date.now() - lastSpawnTime >= POWERUP_SPAWN_INTERVAL;
  }

  /**
   * 查找地图空位
   * @param {import('../entities/Obstacle.js').Obstacle[]} obstacles
   * @param {import('../entities/Player.js').Player} player
   * @param {import('../entities/Enemy.js').Enemy[]} enemies
   * @returns {{x: number, y: number} | null} 网格像素坐标或 null
   */
  static findSpawnPosition(obstacles, player, enemies) {
    // 收集已占用的网格坐标
    const occupied = new Set();

    // 障碍物占据的网格
    for (const obs of obstacles) {
      const gx = Math.round(obs.x / GRID_SIZE);
      const gy = Math.round(obs.y / GRID_SIZE);
      occupied.add(`${gx},${gy}`);
    }

    // 玩家占据的网格（含周围一格安全区）
    const addTankGrid = (tank) => {
      const gx = Math.round(tank.x / GRID_SIZE);
      const gy = Math.round(tank.y / GRID_SIZE);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          occupied.add(`${gx + dx},${gy + dy}`);
        }
      }
    };
    addTankGrid(player);
    for (const enemy of enemies) {
      if (!enemy.markedForDeletion) addTankGrid(enemy);
    }

    // 收集所有可用空位
    const candidates = [];
    for (let y = 3; y < GRID_COUNT - 2; y++) {
      for (let x = 1; x < GRID_COUNT - 1; x++) {
        if (!occupied.has(`${x},${y}`)) {
          candidates.push({ x, y });
        }
      }
    }

    if (candidates.length === 0) return null;

    // 随机选择一个空位
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    // 居中放置道具
    const offset = (GRID_SIZE - 32) / 2;
    return {
      x: chosen.x * GRID_SIZE + offset,
      y: chosen.y * GRID_SIZE + offset
    };
  }

  /**
   * 创建一个道具
   * @param {import('../entities/Obstacle.js').Obstacle[]} obstacles
   * @param {import('../entities/Player.js').Player} player
   * @param {import('../entities/Enemy.js').Enemy[]} enemies
   * @returns {PowerUp | null}
   */
  static createPowerUp(obstacles, player, enemies) {
    const pos = this.findSpawnPosition(obstacles, player, enemies);
    if (!pos) return null;

    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    return new PowerUp(pos.x, pos.y, type);
  }
}
