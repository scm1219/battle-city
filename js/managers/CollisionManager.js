// 碰撞检测管理器
import { rectIntersect } from '../utils/helpers.js';

export class CollisionManager {
  /**
   * 检测坦克与障碍物的碰撞
   */
  static checkTankObstacle(tank, obstacles) {
    const tankBounds = tank.getBounds();

    for (const obstacle of obstacles) {
      // 森林不阻挡坦克
      if (obstacle.isPassableByTank && obstacle.isPassableByTank()) continue;
      if (rectIntersect(tankBounds, obstacle.getBounds())) {
        return obstacle;
      }
    }
    return null;
  }

  /**
   * 检测子弹与障碍物的碰撞
   */
  static checkBulletObstacles(bullet, obstacles) {
    const bulletBounds = bullet.getBounds();

    for (const obstacle of obstacles) {
      if (obstacle.isPassableByBullet()) continue;
      if (rectIntersect(bulletBounds, obstacle.getBounds())) {
        return obstacle;
      }
    }
    return null;
  }

  /**
   * 检测子弹与坦克的碰撞
   */
  static checkBulletTanks(bullet, tanks) {
    const bulletBounds = bullet.getBounds();

    for (const tank of tanks) {
      // 不检测与自己所有者相同的坦克
      if (bullet.getOwner() === tank.getOwner()) {
        continue;
      }

      if (rectIntersect(bulletBounds, tank.getBounds())) {
        return tank;
      }
    }
    return null;
  }

  /**
   * 检测子弹之间的碰撞（不同所有者）
   * @param {Bullet[]} bullets - 所有子弹数组
   * @returns {Array<{a: Bullet, b: Bullet}>} 对撞的子弹对
   */
  static checkBulletBullet(bullets) {
    const pairs = [];
    for (let i = 0; i < bullets.length; i++) {
      const a = bullets[i];
      if (a.markedForDeletion) continue;

      for (let j = i + 1; j < bullets.length; j++) {
        const b = bullets[j];
        if (b.markedForDeletion) continue;
        // 只有不同阵营的子弹才对撞
        if (a.getOwner() === b.getOwner()) continue;

        if (rectIntersect(a.getBounds(), b.getBounds())) {
          pairs.push({ a, b });
          // 标记删除，避免同一子弹被多次匹配
          a.markedForDeletion = true;
          b.markedForDeletion = true;
        }
      }
    }
    return pairs;
  }

  /**
   * 检测玩家与敌人的碰撞
   */
  static checkPlayerEnemy(player, enemies) {
    const playerBounds = player.getBounds();

    for (const enemy of enemies) {
      if (rectIntersect(playerBounds, enemy.getBounds())) {
        return enemy;
      }
    }
    return null;
  }

  /**
   * 检测敌人与基地的碰撞
   */
  static checkEnemyBase(enemies, obstacles) {
    for (const enemy of enemies) {
      const enemyBounds = enemy.getBounds();

      for (const obstacle of obstacles) {
        if (obstacle.isBase() && rectIntersect(enemyBounds, obstacle.getBounds())) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 检测玩家与道具的碰撞
   * @param {import('../entities/Player.js').Player} player
   * @param {import('../entities/PowerUp.js').PowerUp[]} powerUps
   * @returns {import('../entities/PowerUp.js').PowerUp|null}
   */
  static checkPlayerPowerUp(player, powerUps) {
    const playerBounds = player.getBounds();

    for (const powerUp of powerUps) {
      if (rectIntersect(playerBounds, powerUp.getBounds())) {
        return powerUp;
      }
    }
    return null;
  }
}
