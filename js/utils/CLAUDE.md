[根目录](../../CLAUDE.md) > [js](../) > **utils**

# utils -- 工具层（常量与辅助函数）

## 模块职责

为全项目提供集中式的常量配置和纯函数工具集。所有文件均无副作用、无状态，仅导出常量或函数。

## 入口与启动

被 `js/entities/` 和 `js/managers/` 下的所有模块广泛导入，无自身启动逻辑。

## 对外接口

### constants.js -- 游戏常量配置

| 常量名 | 值 | 说明 |
|--------|---|------|
| `CANVAS_WIDTH` | 520 | 画布宽度（像素） |
| `CANVAS_HEIGHT` | 520 | 画布高度（像素） |
| `GRID_SIZE` | 40 | 单个网格边长 |
| `GRID_COUNT` | 13 | 网格数量（13x13） |
| `DIRECTION` | `{UP:0, RIGHT:1, DOWN:2, LEFT:3}` | 方向枚举 |
| `TANK_SIZE` | 36 | 坦克边长 |
| `BULLET_SIZE` | 8 | 子弹边长 |
| `PARTICLE_SIZE` | 4 | 粒子边长 |
| `PLAYER_SPEED` | 3 | 玩家移动速度（像素/帧） |
| `ENEMY_SPEED` | 2 | 敌人移动速度 |
| `BULLET_SPEED` | 6 | 子弹飞行速度 |
| `PLAYER_COOLDOWN` | 20 | 玩家射击冷却（帧数） |
| `ENEMY_COOLDOWN` | 60 | 敌人射击冷却 |
| `ENEMY_AI_UPDATE_INTERVAL` | 60 | AI 重新决策间隔（帧数） |
| `COLORS` | `{...}` | 各元素颜色配置 |
| `SPAWN_INTERVAL_INITIAL` | 3000 | 初始敌人生成间隔（毫秒） |
| `SPAWN_INTERVAL_MIN` | 1000 | 最短生成间隔 |
| `SCORE_PER_ENEMY` | 100 | 击毁敌人得分 |
| `SPAWN_POINTS` | `[{x:0,y:0},{x:6,y:0},{x:12,y:0}]` | 敌人生成点（格子坐标） |
| `BRICK_DENSITY` | 0.3 | 砖块生成概率 |
| `STEEL_DENSITY` | 0.05 | 钢块生成概率 |

### helpers.js -- 工具函数

| 函数 | 签名 | 说明 |
|------|------|------|
| `rectIntersect` | `(r1, r2) => boolean` | AABB 矩形碰撞检测 |
| `clamp` | `(val, min, max) => number` | 数值范围限制 |
| `randomInt` | `(min, max) => number` | 随机整数 [min, max] |
| `randomFloat` | `(min, max) => number` | 随机浮点数 |
| `distance` | `(x1, y1, x2, y2) => number` | 两点欧氏距离 |
| `directionToVector` | `(direction, speed) => {vx, vy}` | 方向编码转速度向量 |

## 关键依赖与配置

无外部依赖。仅使用 JavaScript 内置 `Math` 对象。

## 数据模型

不涉及数据模型。纯常量与纯函数。

## 测试与质量

当前无自动化测试。

建议测试：
- `rectIntersect` 边界相切、完全包含、完全分离等场景
- `directionToVector` 四个方向的正确性
- `randomInt`/`randomFloat` 范围验证

## 相关文件清单

| 文件 | 行数 | 说明 |
|-----|------|------|
| `constants.js` | 62 | 全局常量配置 |
| `helpers.js` | 76 | 几何/随机/方向工具函数 |

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-04-04 | 初始化 AI 上下文 | 首次生成模块文档 |
