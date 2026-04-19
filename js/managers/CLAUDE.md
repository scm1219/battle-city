[根目录](../../CLAUDE.md) > [js](../) > **managers**

# managers -- 管理器层

## 模块职责

提供游戏运行时的各类管理服务：输入捕获、碰撞检测、敌人生成调度、地图随机生成、道具管理、程序化音频。所有管理器均为无状态或弱状态的纯逻辑类，不直接持有游戏实体（由 `Game.js` 统一管理）。

## 入口与启动

本模块无单一入口。各管理器由 `js/Game.js` 导入并在构造函数中实例化：
- `InputManager` -- 构造时立即注册键盘事件
- `SpawnManager` -- 构造时初始化计时器
- `CollisionManager` -- 纯静态方法类，无需实例化
- `MapGenerator` -- 纯静态方法类，无需实例化
- `PowerUpManager` -- 道具生成调度与生命周期管理
- `AudioManager` -- Web Audio API 程序化合成 BGM 与音效

## 对外接口

### InputManager -- `InputManager.js`
- `constructor()` -- 注册 `keydown`/`keyup` 事件，阻止方向键/空格的默认行为
- `isPressed(code)` -> `boolean` -- 查询指定按键是否当前按下
- `clear()` -- 清空按键状态

### CollisionManager -- `CollisionManager.js`
全部静态方法：

- `static checkTankObstacle(tank, obstacles)` -> `Obstacle | null`
- `static checkBulletObstacles(bullet, obstacles)` -> `Obstacle | null` -- 子弹穿过河流/森林
- `static checkBulletTanks(bullet, tanks)` -> `Tank | null` -- 自动跳过同阵营
- `static checkBulletBullet(bullets)` -> `{a, b}[]` -- 子弹对撞抵消
- `static checkPlayerEnemy(player, enemies)` -> `Enemy | null`
- `static checkEnemyBase(enemies, obstacles)` -> `boolean` -- 敌人是否接触基地
- `static checkTankCollision(tank, tanks)` -> `boolean` -- 坦克间碰撞

### SpawnManager -- `SpawnManager.js`
- `constructor()` -- 初始化生成间隔与计时
- `shouldSpawn()` -> `boolean` -- 基于时间间隔判断是否该生成敌人
- `spawnEnemy(enemies)` -> `{x, y} | null` -- 随机选择生成点并返回像素坐标（含拥挤度检查）
- `updateDifficulty()` -- 根据游戏时间缩短生成间隔
  - 0-30s: 3 秒间隔
  - 30-60s: 2 秒间隔
  - 60s+: 1 秒间隔（最小值）
- `reset()` -- 重置所有状态

### MapGenerator -- `MapGenerator.js`
全部静态方法：

- `static generate()` -> `Obstacle[]` -- 生成完整地图（砖块、钢块、河流、森林、基地）
- `static generateRandomObstacles(obstacles)` -- 随机障碍物（砖30%、钢5%、河8%、林10%）
- `static isInBaseArea(x, y)` -> `boolean` -- 是否在基地保护区域
- `static isInSpawnArea(x, y)` -> `boolean` -- 是否在生成点保留区域
- `static generateBase(obstacles)` -- 底部中心基地及周围砖墙保护（含钢板）

### PowerUpManager -- `PowerUpManager.js`
- `shouldSpawn()` -> `boolean` -- 是否到达道具生成间隔
- `spawnPowerUp()` -> `PowerUp | null` -- 在空闲位置生成道具
- `update(deltaTime, powerUps)` -- 更新道具闪烁和过期清理
- `reset()` -- 重置状态

### AudioManager -- `AudioManager.js`
- `init()` -> `Promise` -- 初始化 Web Audio 上下文
- `playBGM()` / `stopBGM()` / `pause()` / `resume()` -- BGM 控制
- `playExplosion()` -- 播放爆炸音效
- 使用 Web Audio API 程序化合成 FC 风格旋律，零外部音频文件

## 关键依赖与配置

- 依赖 `../utils/constants.js`：生成点、间隔、密度、道具参数、音频参数
- 依赖 `../utils/helpers.js`：`rectIntersect`、`randomInt`
- 依赖 `../entities/Obstacle.js`：`MapGenerator` 需要实例化障碍物
- 依赖 `../entities/PowerUp.js`：`PowerUpManager` 需要实例化道具

## 数据模型

- **生成点**: 左上(0,0)、中上(8,0)、右上(16,0) 三个格子坐标
- **地图**: 17x17 网格，内部随机填充砖/钢/河/林，底部中心(8,15)为基地
- **难度曲线**: 基于 `Date.now()` 的绝对时间差计算
- **道具**: 每 8 秒检测生成，最多同时 3 个，45 秒后消失（最后 5 秒闪烁）

## 测试与质量

当前无自动化测试。

可测试点：
- `CollisionManager` 各静态方法边界条件
- `SpawnManager.updateDifficulty()` 难度阈值切换
- `MapGenerator.generate()` 输出完整性（基地存在、生成点空闲）
- `PowerUpManager.spawnPowerUp()` 位置冲突避免

## 相关文件清单

| 文件 | 说明 |
|-----|------|
| `InputManager.js` | 键盘输入捕获与查询 |
| `CollisionManager.js` | AABB 碰撞检测静态工具 |
| `SpawnManager.js` | 敌人生成调度与难度曲线 |
| `MapGenerator.js` | 随机地图生成 |
| `PowerUpManager.js` | 道具生成调度与生命周期 |
| `AudioManager.js` | 程序化 BGM 与音效合成 |

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-04-19 | 同步文档与代码 | 新增 PowerUpManager/AudioManager，更新生成点/地图参数 |
| 2026-04-04 | 初始化 AI 上下文 | 首次生成模块文档 |
