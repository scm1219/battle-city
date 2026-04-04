// 地图生成器
import { Obstacle } from '../entities/Obstacle.js';
import { GRID_COUNT, GRID_SIZE, BRICK_DENSITY, STEEL_DENSITY, RIVER_DENSITY, FOREST_DENSITY } from '../utils/constants.js';
import { randomInt } from '../utils/helpers.js';

// 基地中心列（网格中心）
const CENTER_COL = Math.floor(GRID_COUNT / 2);
// 基地所在行（倒数第二行）
const BASE_ROW = GRID_COUNT - 2;

export class MapGenerator {
  /**
   * 生成随机地图
   */
  static generate() {
    const obstacles = [];

    // 生成随机障碍物
    this.generateRandomObstacles(obstacles);

    // 生成基地
    this.generateBase(obstacles);

    return obstacles;
  }

  /**
   * 生成边界钢墙
   */
  static generateBorderWalls(obstacles) {
    // 上下边界
    for (let x = 0; x < GRID_COUNT; x++) {
      obstacles.push(new Obstacle(x * GRID_SIZE, 0, 'steel'));
      obstacles.push(new Obstacle(x * GRID_SIZE, (GRID_COUNT - 1) * GRID_SIZE, 'steel'));
    }

    // 左右边界
    for (let y = 0; y < GRID_COUNT; y++) {
      obstacles.push(new Obstacle(0, y * GRID_SIZE, 'steel'));
      obstacles.push(new Obstacle((GRID_COUNT - 1) * GRID_SIZE, y * GRID_SIZE, 'steel'));
    }
  }

  /**
   * 生成随机障碍物
   */
  static generateRandomObstacles(obstacles) {
    // 保留出生点区域（顶部3行）
    // 保留基地区域（底部中心）

    for (let y = 3; y < GRID_COUNT - 2; y++) {
      for (let x = 1; x < GRID_COUNT - 1; x++) {
        // 跳过基地区域
        if (this.isInBaseArea(x, y)) {
          continue;
        }

        const rand = Math.random();

        if (rand < BRICK_DENSITY) {
          // 生成砖块
          obstacles.push(new Obstacle(x * GRID_SIZE, y * GRID_SIZE, 'brick'));
        } else if (rand < BRICK_DENSITY + STEEL_DENSITY) {
          // 生成钢块
          obstacles.push(new Obstacle(x * GRID_SIZE, y * GRID_SIZE, 'steel'));
        } else if (rand < BRICK_DENSITY + STEEL_DENSITY + RIVER_DENSITY) {
          // 生成河流
          obstacles.push(new Obstacle(x * GRID_SIZE, y * GRID_SIZE, 'river'));
        } else if (rand < BRICK_DENSITY + STEEL_DENSITY + RIVER_DENSITY + FOREST_DENSITY) {
          // 生成森林
          obstacles.push(new Obstacle(x * GRID_SIZE, y * GRID_SIZE, 'forest'));
        }
      }
    }
  }

  /**
   * 检查是否在基地区域
   */
  static isInBaseArea(x, y) {
    // 基地保护区域：基地所在行及以上一行，横向 ±1 列
    // 确保基地周围不会出现森林/河流，只有砖墙
    return y >= GRID_COUNT - 3 && x >= CENTER_COL - 1 && x <= CENTER_COL + 1;
  }

  /**
   * 保证基地正上方直线通道至少有一块钢板
   */
  static ensureSteelInBaseLine(obstacles) {
    const baseCol = CENTER_COL;
    const startRow = 3; // 随机障碍物起始行
    const endRow = BASE_ROW - 2; // 基地保护行上方

    // 检查基地所在列中是否已有钢块
    const hasSteel = obstacles.some(o =>
      o.type === 'steel' &&
      o.x === baseCol * GRID_SIZE &&
      o.y >= startRow * GRID_SIZE &&
      o.y <= endRow * GRID_SIZE
    );

    if (!hasSteel) {
      const steelRow = randomInt(startRow, endRow);
      // 移除该位置已有的障碍物
      const idx = obstacles.findIndex(o =>
        o.x === baseCol * GRID_SIZE &&
        o.y === steelRow * GRID_SIZE
      );
      if (idx !== -1) {
        obstacles.splice(idx, 1);
      }
      obstacles.push(new Obstacle(baseCol * GRID_SIZE, steelRow * GRID_SIZE, 'steel'));
    }
  }

  /**
   * 生成基地
   */
  static generateBase(obstacles) {
    // 基地在底部中心
    const baseX = CENTER_COL * GRID_SIZE;
    const baseY = BASE_ROW * GRID_SIZE;

    // 基地周围砖墙的位置（上方及两侧共 5 格，底部留空）
    const brickPositions = [
      { x: baseX - GRID_SIZE, y: baseY - GRID_SIZE },  // 左上
      { x: baseX, y: baseY - GRID_SIZE },              // 上
      { x: baseX + GRID_SIZE, y: baseY - GRID_SIZE },  // 右上
      { x: baseX - GRID_SIZE, y: baseY },              // 左
      { x: baseX + GRID_SIZE, y: baseY },              // 右
    ];

    // 清除砖墙位置上已有的随机障碍物（防止森林/河流重叠）
    for (const pos of brickPositions) {
      const idx = obstacles.findIndex(o => o.x === pos.x && o.y === pos.y);
      if (idx !== -1) {
        obstacles.splice(idx, 1);
      }
    }

    // 基地周围的砖墙保护
    for (const pos of brickPositions) {
      obstacles.push(new Obstacle(pos.x, pos.y, 'brick'));
    }

    // 保证正上方直线通道至少有一块钢板
    this.ensureSteelInBaseLine(obstacles);

    // 基地本身
    obstacles.push(new Obstacle(baseX, baseY, 'base'));
  }
}
