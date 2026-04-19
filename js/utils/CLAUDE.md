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
| `TARGET_FPS` | 60 | 目标帧率 |
| `TARGET_FRAME_TIME` | ~16.67 | 每帧目标毫秒数 |
| `CANVAS_WIDTH` | 680 | 画布宽度（像素） |
| `CANVAS_HEIGHT` | 680 | 画布高度（像素） |
| `GRID_SIZE` | 40 | 单个网格边长 |
| `GRID_COUNT` | 17 | 网格数量（17x17） |
| `DIRECTION` | `{UP:0, RIGHT:1, DOWN:2, LEFT:3}` | 方向枚举 |
| `TANK_SIZE` | 36 | 坦克边长 |
| `BULLET_SIZE` | 8 | 子弹边长 |
| `PARTICLE_SIZE` | 4 | 粒子边长 |
| `PLAYER_SPEED` | 2 | 玩家移动速度（像素/帧） |
| `ENEMY_SPEED` | 1.5 | 普通敌人移动速度 |
| `FAST_ENEMY_SPEED` | 3 | 快速敌人移动速度 |
| `BULLET_SPEED` | 4 | 子弹飞行速度 |
| `PLAYER_COOLDOWN` | 30 | 玩家射击冷却（帧数） |
| `ENEMY_COOLDOWN` | 90 | 敌人射击冷却 |
| `ENEMY_AI_UPDATE_INTERVAL` | 60 | AI 重新决策间隔（帧数） |
| `COLORS` | `{...}` | 各元素颜色配置（含玩家、敌人、重装敌人、快速敌人、道具等） |
| `SPAWN_INTERVAL_INITIAL` | 3000 | 初始敌人生成间隔（毫秒） |
| `SPAWN_INTERVAL_MIN` | 1000 | 最短生成间隔 |
| `SCORE_PER_ENEMY` | 100 | 击毁普通敌人得分 |
| `SCORE_PER_HEAVY` | 200 | 击毁重装敌人得分 |
| `SCORE_PER_FAST` | 150 | 击毁快速敌人得分 |
| `HEAVY_ENEMY_CHANCE` | 0.3 | 重装敌人生成概率 |
| `FAST_ENEMY_CHANCE` | 0.2 | 快速敌人生成概率 |
| `SPAWN_POINTS` | `[{x:0,y:0},{x:8,y:0},{x:16,y:0}]` | 敌人生成点（格子坐标） |
| `BRICK_DENSITY` | 0.3 | 砖块密度 |
| `STEEL_DENSITY` | 0.05 | 钢块密度 |
| `RIVER_DENSITY` | 0.08 | 河流密度 |
| `FOREST_DENSITY` | 0.1 | 森林密度 |
| `POWERUP_*` | ... | 道具尺寸、类型、间隔、持续时间等 |
| `AUDIO_*` | ... | 音频 BPM、音量、持续时间等 |

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
| `constants.js` | 98 | 全局常量配置（含道具、音频） |
| `helpers.js` | 76 | 几何/随机/方向工具函数 |

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-04-19 | 同步文档与代码 | 更新常量值、新增道具/音频常量、修正画布/网格参数 |
| 2026-04-04 | 初始化 AI 上下文 | 首次生成模块文档 |
