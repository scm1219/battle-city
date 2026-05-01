[根目录](../../CLAUDE.md) > [js](../) > **managers**

# managers -- 管理器层

## 模块职责

提供游戏运行时的各类管理服务：输入捕获、碰撞检测、敌人生成调度、地图随机生成、道具管理、程序化音频、分数与排行榜、UI 显示控制。所有管理器均为无状态或弱状态的纯逻辑类，不直接持有游戏实体（由 `Game.js` 统一管理）。

## 入口与启动

本模块无单一入口。各管理器由 `js/Game.js` 导入并在构造函数中实例化：
- `InputManager` -- 构造时立即注册键盘事件
- `SpawnManager` -- 构造时初始化计时器
- `CollisionManager` -- 纯静态方法类，无需实例化
- `MapGenerator` -- 纯静态方法类，无需实例化
- `PowerUpManager` -- 纯静态方法类，道具生成调度
- `AudioManager` -- Web Audio API 程序化合成 BGM 与音效
- `ScoreManager` -- 分数统计、击杀分类计数、localStorage 排行榜持久化
- `UIManager` -- DOM 更新、开始画面、游戏结束面板、庆祝动画、暂停伪装模式

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
- `static checkPlayerPowerUp(player, powerUps)` -> `PowerUp | null` -- 玩家拾取道具检测
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
全部静态方法：

- `static shouldSpawn(powerUps, lastSpawnTime)` -> `boolean` -- 检查道具数量上限与生成间隔
- `static findSpawnPosition(obstacles, player, enemies)` -> `{x, y} | null` -- 在空闲网格位置查找道具生成坐标
- `static createPowerUp(obstacles, player, enemies)` -> `PowerUp | null` -- 创建随机类型道具

### AudioManager -- `AudioManager.js`
- `init()` -- 初始化 Web Audio 上下文（需用户交互后调用），预缓存 3 首曲目数据
- `playBGM()` / `stopBGM()` / `pause()` / `resume()` / `toggleBGM()` -- BGM 控制
- `switchBGM(trackId)` -- 平滑切换到指定曲目（淡出/淡入过渡，防竞争）
- `getCurrentTrack()` -> `number` -- 获取当前播放曲目编号
- `playEnemyExplosion()` / `playPlayerExplosion()` -- 播放爆炸音效
- 使用 Web Audio API 程序化合成 FC 风格旋律，零外部音频文件
- 内置 3 首曲目：经典战斗（C 大调 160BPM）、激烈战斗（A 小调 180BPM）、Boss 战（E 小调 200BPM + 锯齿波和声）
- 由 `Game.updateBGM()` 根据游戏状态自动切换（Boss 出现、时间 90s+）

### ScoreManager -- `ScoreManager.js`
- `constructor(killElements, scoreboardList)` -- 接收击杀统计 DOM 元素与排行榜列表容器
- `getScore()` -> `number` -- 获取当前总分
- `addKill(enemy)` -> `number` -- 记录击毁（通过 `enemy.getScore()` 多态获取分值），更新统计 UI
- `reset()` -- 重置分数和击杀统计
- `saveScore()` -> `number` -- 保存到 localStorage 排行榜，返回排名（1 开始，未上榜返回 -1）
- `renderScoreboard()` -- 渲染排行榜 DOM（前三名特殊样式）
- 击杀分类计数：`normal` / `heavy` / `fast`，分别对应 DOM 元素
- 排行榜上限 20 条，按分数降序

### UIManager -- `UIManager.js`
- `constructor(refs)` -- 接收 DOM 引用对象（score、time、enemies、gameOver、finalScore、disguiseOverlay、gameContainer）
- `isWaitingForStart()` / `setWaitingForStart(value)` -- 开始画面等待状态
- `showBenchmarkScreen(ctx)` / `showStartScreen(ctx)` -- 预热画面与等待开始画面（闪烁文字动画）
- `updateUI(score, time)` -- 更新分数与时间显示
- `updateEnemyCount(count)` -- 更新敌人数量显示
- `showGameOver(score, rank)` -- 显示游戏结束面板，前三名触发庆祝动画（金色烟花粒子）
- `hideGameOver()` / `resetGameOver()` -- 隐藏与清理游戏结束面板
- `togglePause(audio, currentlyPaused, isGameOver)` -> `boolean` -- 暂停/恢复切换（VS Code 伪装模式）

## 关键依赖与配置

- 依赖 `../utils/constants.js`：生成点、间隔、密度、道具参数、音频参数
- 依赖 `../utils/helpers.js`：`rectIntersect`、`randomInt`
- 依赖 `../entities/Obstacle.js`：`MapGenerator` 需要实例化障碍物
- 依赖 `../entities/PowerUp.js`：`PowerUpManager` 需要实例化道具

## 数据模型

- **生成点**: 左上(0,0)、中上(8,0)、右上(16,0) 三个格子坐标
- **地图**: 17x17 网格，内部随机填充砖/钢/河/林，底部中心(8,15)为基地
- **难度曲线**: 基于 `performance.now()` 的绝对时间差计算
- **道具**: 每 8 秒检测生成，最多同时 3 个，45 秒后消失（最后 5 秒闪烁）
- **排行榜**: localStorage key `tank_scoreboard`，JSON 数组 `{score, date}`，最多 20 条
- **击杀统计**: `{normal: number, heavy: number, fast: number}` 分类计数

## 测试与质量

当前无自动化测试。

可测试点：
- `CollisionManager` 各静态方法边界条件
- `SpawnManager.updateDifficulty()` 难度阈值切换
- `MapGenerator.generate()` 输出完整性（基地存在、生成点空闲）
- `PowerUpManager.findSpawnPosition()` 位置冲突避免
- `ScoreManager.saveScore()` 排序正确性、排行榜截断
- `ScoreManager.addKill()` 多态分值获取

## 相关文件清单

| 文件 | 行数 | 说明 |
|-----|------|------|
| `InputManager.js` | ~40 | 键盘输入捕获与查询 |
| `CollisionManager.js` | ~80 | AABB 碰撞检测静态工具 |
| `SpawnManager.js` | ~82 | 敌人生成调度与难度曲线 |
| `MapGenerator.js` | ~120 | 随机地图生成 |
| `PowerUpManager.js` | ~87 | 道具生成调度（纯静态方法） |
| `AudioManager.js` | ~380 | 程序化多曲目 BGM 与音效合成 |
| `ScoreManager.js` | ~125 | 分数统计与排行榜持久化 |
| `UIManager.js` | ~228 | UI 显示控制与庆祝动画 |

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-05-01 | BGM 系统重构 | AudioManager 支持多曲目切换（经典/激烈/Boss 战），新增 switchBGM/getCurrentTrack 接口，行数 ~200→~380 |
| 2026-04-19 | 增量更新 | 新增 ScoreManager/UIManager 接口描述；更新 PowerUpManager 为纯静态方法；新增 CollisionManager.checkPlayerPowerUp；更新文件清单与行数 |
| 2026-04-19 | 同步文档与代码 | 新增 PowerUpManager/AudioManager，更新生成点/地图参数 |
| 2026-04-04 | 初始化 AI 上下文 | 首次生成模块文档 |
