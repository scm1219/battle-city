// 工具函数

/**
 * 矩形碰撞检测
 * @param {Object} r1 - 矩形1 {x, y, width, height}
 * @param {Object} r2 - 矩形2 {x, y, width, height}
 * @returns {boolean} 是否碰撞
 */
export function rectIntersect(r1, r2) {
  return r1.x < r2.x + r2.width &&
         r1.x + r1.width > r2.x &&
         r1.y < r2.y + r2.height &&
         r1.y + r1.height > r2.y;
}

/**
 * 限制数值在范围内
 * @param {number} val - 待限制值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * 生成随机整数 [min, max]
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @returns {number} 随机整数
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机浮点数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机浮点数
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 计算两点距离
 * @param {number} x1 - 点1 x坐标
 * @param {number} y1 - 点1 y坐标
 * @param {number} x2 - 点2 x坐标
 * @param {number} y2 - 点2 y坐标
 * @returns {number} 距离
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 将方向转换为速度向量
 * @param {number} direction - 方向 (0-3)
 * @param {number} speed - 速度
 * @returns {Object} {vx, vy}
 */
export function directionToVector(direction, speed) {
  switch (direction) {
    case 0: return { vx: 0, vy: -speed };      // UP
    case 1: return { vx: speed, vy: 0 };      // RIGHT
    case 2: return { vx: 0, vy: speed };      // DOWN
    case 3: return { vx: -speed, vy: 0 };     // LEFT
    default: return { vx: 0, vy: 0 };
  }
}
