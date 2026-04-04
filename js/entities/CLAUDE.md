[根目录](../../CLAUDE.md) > [js](../) > **entities**

# entities -- 游戏实体层

## 模块职责

定义游戏中所有可见/可交互的实体对象，采用面向对象继承体系。负责实体的状态更新、位置计算、碰撞边界提供和 Canvas 绘制。

## 入口与启动

本模块无单一入口文件。所有实体类由 `js/Game.js` 按需导入并实例化。

**类继承关系**:
```
Entity (基类)
  +-- Tank (坦克基类)
  |     +-- Player (玩家坦克)
  |     +-- Enemy (敌人坦克)
  +-- Bullet (子弹)
  +-- Obstacle (障碍物)
  +-- Particle (爆炸粒子)
```

## 对外接口

### Entity (基类) -- `Entity.js`
- `constructor(x, y, width, height, direction, speed)` -- 通用实体构造
- `update()` -- 按方向和速度更新坐标
- `draw(ctx)` -- 子类实现的绘制方法
- `getBounds()` -> `{x, y, width, height}` -- 碰撞检测用边界矩形
- `constrainToBounds(canvasWidth, canvasHeight)` -- 限制在画布内
- `markedForDeletion` -- 标记是否需要从场景中清除

### Tank (坦克基类) -- `Tank.js`
- `shoot()` -> `BulletConfig | null` -- 尝试发射子弹（受冷却限制）
- `canShoot()` -> `boolean` -- 冷却是否就绪
- `move(direction)` -- 设置移动方向
- `checkCollision(obstacles)` -> `boolean` -- 与障碍物碰撞检测
- `draw(ctx)` -- 绘制坦克（履带、车身、炮管、炮塔）
- `getOwner()` -> `'unknown'` -- 子类覆盖为 `'player'` 或 `'enemy'`

### Player -- `Player.js`
- `update(input, obstacles)` -> `BulletConfig | null` -- 响应键盘输入移动/射击
- 支持按键：WASD、方向键、空格

### Enemy -- `Enemy.js`
- `update(player, obstacles)` -> `BulletConfig | null` -- AI 决策与移动
- `makeDecision(player)` -- AI 逻辑：30% 追踪玩家、50% 随机、20% 停止
- AI 每 `ENEMY_AI_UPDATE_INTERVAL`（60 帧）重新决策

### Bullet -- `Bullet.js`
- `update()` -- 按方向移动
- `isOutOfBounds()` -> `boolean` -- 是否飞出画布
- `getOwner()` -> `'player'` | `'enemy'`

### Obstacle -- `Obstacle.js`
- `constructor(x, y, type)` -- type: `'brick'` | `'steel'` | `'base'`
- `hit()` -> `boolean` -- 受击，返回是否被摧毁
- `isDestructible()` -> `boolean` -- 钢块不可破坏
- `isBase()` -> `boolean` -- 是否为基地

### Particle -- `Particle.js`
- `update()` -- 更新位置与生命衰减
- `isDead()` -> `boolean` -- 生命是否耗尽
- `static createSmallExplosion(x, y)` -> `Particle[]` -- 砖块破坏效果（5 个粒子）
- `static createLargeExplosion(x, y)` -> `Particle[]` -- 坦克爆炸效果（20 个粒子）

## 关键依赖与配置

- 依赖 `../utils/constants.js` 中的尺寸、速度、冷却、颜色常量
- 依赖 `../utils/helpers.js` 中的 `directionToVector`、`rectIntersect`、`randomFloat`、`randomInt`
- 坦克大小：36x36，子弹大小：8x8，障碍物/格子大小：40x40，粒子大小：4x4

## 数据模型

实体无持久化数据存储，所有状态保存在内存中的对象实例上。

核心状态字段：
- 位置：`x`, `y`
- 尺寸：`width`, `height`
- 运动：`direction` (0-3), `speed`
- 生命标记：`markedForDeletion`
- 坦克专属：`cooldown`, `maxCooldown`, `hp`, `color`, `treadColor`
- 粒子专属：`life` (1.0 -> 0), `decay`, `vx`, `vy`

## 测试与质量

当前无自动化测试。

可测试点：
- `rectIntersect` 碰撞边界条件
- `Bullet.isOutOfBounds()` 边界值
- `Obstacle.hit()` 不可破坏钢块行为
- `Enemy.makeDecision()` 概率分布
- `Particle.createExplosion()` 工厂方法

## 常见问题 (FAQ)

**Q: 为什么子弹大小固定为 8？**
A: 在 `Tank.createBullet()` 中硬编码。如需调整，建议改为从 `constants.js` 导入。

**Q: 粒子为什么不用 `direction` 字段？**
A: 粒子使用自定义的 `vx`/`vy` 做径向扩散，不继承基类的方向-速度系统。

## 相关文件清单

| 文件 | 行数 | 说明 |
|-----|------|------|
| `Entity.js` | 68 | 实体基类，位置/边界/绘制接口 |
| `Tank.js` | 150 | 坦克基类，射击/移动/绘制 |
| `Player.js` | 65 | 玩家坦克，输入响应 |
| `Enemy.js` | 105 | 敌人坦克，AI 决策 |
| `Bullet.js` | 48 | 子弹，飞行与出界检测 |
| `Obstacle.js` | 153 | 障碍物，三种类型绘制 |
| `Particle.js` | 83 | 爆炸粒子，生命周期管理 |

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-04-04 | 初始化 AI 上下文 | 首次生成模块文档 |
