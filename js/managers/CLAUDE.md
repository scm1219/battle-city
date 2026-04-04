[根目录](../../CLAUDE.md) > [js](../) > **managers**

# managers -- 管理器层

## 模块职责

提供游戏运行时的各类管理服务：输入捕获、碰撞检测、敌人生成调度、地图随机生成。所有管理器均为无状态或弱状态的纯逻辑类，不直接持有游戏实体（由 `Game.js` 统一管理）。

## 入口与启动

本模块无单一入口。各管理器由 `js/Game.js` 导入并在构造函数中实例化：
- `InputManager` -- 构造时立即注册键盘事件
- `SpawnManager` -- 构造时初始化计时器
- `CollisionManager` -- 纯静态方法类，无需实例化
- `MapGenerator` -- 纯静态方法类，无需实例化

## 对外接口

### InputManager -- `InputManager.js`
- `constructor()` -- 注册 `keydown`/`keyup` 事件，阻止方向键/空格的默认行为
- `isPressed(code)` -> `boolean` -- 查询指定按键是否当前按下
- `clear()` -- 清空按键状态

### CollisionManager -- `CollisionManager.js`
全部静态方法：

- `static checkTankObstacle(tank, obstacles)` -> `Obstacle | null`
- `static checkBulletObstacles(bullet, obstacles)` -> `Obstacle | null`
- `static checkBulletTanks(bullet, tanks)` -> `Tank | null` -- 自动跳过同阵营
- `static checkPlayerEnemy(player, enemies)` -> `Enemy | null`
- `static checkEnemyBase(enemies, obstacles)` -> `boolean` -- 敌人是否接触基地

### SpawnManager -- `SpawnManager.js`
- `constructor()` -- 初始化生成间隔与计时
- `shouldSpawn()` -> `boolean` -- 基于时间间隔判断是否该生成敌人
- `spawnEnemy()` -> `{x, y}` -- 随机选择生成点并返回像素坐标
- `updateDifficulty()` -- 根据游戏时间缩短生成间隔
  - 0-30s: 3 秒间隔
  - 30-60s: 2 秒间隔
  - 60s+: 1 秒间隔（最小值）
- `reset()` -- 重置所有状态

### MapGenerator -- `MapGenerator.js`
全部静态方法：

- `static generate()` -> `Obstacle[]` -- 生成完整地图
- `static generateBorderWalls(obstacles)` -- 四周钢墙边界
- `static generateRandomObstacles(obstacles)` -- 随机砖块（30%）和钢块（5%）
- `static isInBaseArea(x, y)` -> `boolean` -- 是否在基地保护区域
- `static generateBase(obstacles)` -- 底部中心基地及周围砖墙保护

## 关键依赖与配置

- 依赖 `../utils/constants.js`：`SPAWN_POINTS`、`SPAWN_INTERVAL_*`、`GRID_SIZE`、`GRID_COUNT`、`BRICK_DENSITY`、`STEEL_DENSITY`
- 依赖 `../utils/helpers.js`：`rectIntersect`、`randomInt`
- 依赖 `../entities/Obstacle.js`：`MapGenerator` 需要实例化障碍物

## 数据模型

- **生成点**: 左上(0,0)、中上(6,0)、右上(12,0) 三个格子坐标
- **地图**: 13x13 网格，四周钢墙，内部随机填充，底部中心(6,11)为基地
- **难度曲线**: 基于 `Date.now()` 的绝对时间差计算

## 测试与质量

当前无自动化测试。

可测试点：
- `CollisionManager` 各静态方法边界条件
- `SpawnManager.updateDifficulty()` 难度阈值切换
- `MapGenerator.generate()` 输出完整性（基地存在、边界闭合）

## 常见问题 (FAQ)

**Q: `CollisionManager` 为什么不检测同阵营子弹？**
A: 在 `checkBulletTanks()` 中通过 `bullet.getOwner() === tank.getOwner()` 过滤，避免敌人子弹误伤敌人。

**Q: 地图为什么每次都不同？**
A: `generateRandomObstacles` 使用 `Math.random()` 决定障碍物类型，概率由 `BRICK_DENSITY`(0.3) 和 `STEEL_DENSITY`(0.05) 控制。

**Q: 为什么用 `Date.now()` 而不是游戏帧数控制难度？**
A: 设计选择。基于真实时间确保游戏体验与帧率无关。

## 相关文件清单

| 文件 | 行数 | 说明 |
|-----|------|------|
| `InputManager.js` | 38 | 键盘输入捕获与查询 |
| `CollisionManager.js` | 81 | AABB 碰撞检测静态工具 |
| `SpawnManager.js` | 68 | 敌人生成调度与难度曲线 |
| `MapGenerator.js` | 93 | 随机地图生成 |

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-04-04 | 初始化 AI 上下文 | 首次生成模块文档 |
