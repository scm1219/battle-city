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
  |     +-- Enemy (普通敌人)
  |     |     +-- HeavyEnemy (重装敌人，2HP)
  |     |     +-- FastEnemy (快速敌人)
  +-- Bullet (子弹)
  +-- Obstacle (障碍物)
  +-- Particle (爆炸粒子)
  +-- PowerUp (道具)
PowerUpEffect (效果基类, effects/)
  +-- SpeedEffect (加速效果)
  +-- FireRateEffect (速射效果)
  +-- ShieldEffect (护盾效果)
```

## 对外接口

### Entity (基类) -- `Entity.js`
- `constructor(x, y, width, height, direction, speed)` -- 通用实体构造
- `update(deltaTime)` -- 按方向和速度更新坐标（帧率无关）
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
- `update(input, obstacles, enemies, deltaTime)` -> `BulletConfig | null` -- 响应键盘输入移动/射击
- 支持按键：WASD、方向键、空格
- `applyPowerUp(powerUp)` / `removeEffect(effect)` -- 道具效果管理

### Enemy -- `Enemy.js`
- `update(player, obstacles, allEnemies, deltaTime)` -> `BulletConfig | null` -- AI 决策与移动
- `makeDecision(player)` -- AI 逻辑：30% 追踪玩家、50% 随机、20% 停止
- AI 每 `ENEMY_AI_UPDATE_INTERVAL`（60 帧）重新决策

### HeavyEnemy -- `HeavyEnemy.js`
- 继承自 Enemy，`hp = 2`（需击中 2 次才摧毁）
- `hit()` -> `boolean` -- 受击闪烁（基于时间的 167ms 白闪）
- 绘制时附带血条

### FastEnemy -- `FastEnemy.js`
- 继承自 Enemy，速度为 `FAST_ENEMY_SPEED`（3），高于普通敌人

### Bullet -- `Bullet.js`
- `update(deltaTime)` -- 按方向移动
- `isOutOfBounds()` -> `boolean` -- 是否飞出画布
- `getOwner()` -> `'player'` | `'enemy'`

### Obstacle -- `Obstacle.js`
- `constructor(x, y, type)` -- type: `'brick'` | `'steel'` | `'river'` | `'forest'` | `'base'`
- `hit(fromDirection)` -> `boolean` -- 受击，砖块按方向半侧破坏
- `isDestructible()` -> `boolean` -- 钢块/河流/森林不可破坏
- `isBase()` -> `boolean` -- 是否为基地
- `isPassableByBullet()` -> `boolean` -- 子弹是否可穿过（河流/森林）

### Particle -- `Particle.js`
- `update(deltaTime)` -- 更新位置与生命衰减
- `isDead()` -> `boolean` -- 生命是否耗尽
- `static createSmallExplosion(x, y)` -> `Particle[]` -- 砖块破坏效果
- `static createLargeExplosion(x, y)` -> `Particle[]` -- 坦克爆炸效果

### PowerUp -- `PowerUp.js`
- 道具实体，类型：`'speed'` | `'fireRate'` | `'shield'`
- `isExpired()` -> `boolean` -- 是否已超时消失
- `shouldBlink()` -> `boolean` -- 是否进入消失前闪烁阶段

### 效果类 -- `effects/`
- `PowerUpEffect` (基类) -- `apply(player)` / `remove(player)` / `isExpired()` / `update(deltaTime)`
- `SpeedEffect` -- 玩家速度翻倍
- `FireRateEffect` -- 射击冷却减半
- `ShieldEffect` -- 无敌状态

## 关键依赖与配置

- 依赖 `../utils/constants.js` 中的尺寸、速度、冷却、颜色常量
- 依赖 `../utils/helpers.js` 中的 `directionToVector`、`rectIntersect`、`randomFloat`、`randomInt`
- 坦克大小：36x36，子弹大小：8x8，障碍物/格子大小：40x40，粒子大小：4x4，道具大小：32x32

## 数据模型

实体无持久化数据存储，所有状态保存在内存中的对象实例上。

核心状态字段：
- 位置：`x`, `y`
- 尺寸：`width`, `height`
- 运动：`direction` (0-3), `speed`
- 生命标记：`markedForDeletion`
- 坦克专属：`cooldown`, `maxCooldown`, `hp`, `color`, `treadColor`
- 重装敌人专属：`hitFlashTime` (毫秒)
- 粒子专属：`life` (1.0 -> 0), `decay`, `vx`, `vy`
- 道具专属：`type`, `createdAt`, `blinking`

## 测试与质量

当前无自动化测试。

可测试点：
- `rectIntersect` 碰撞边界条件
- `Bullet.isOutOfBounds()` 边界值
- `Obstacle.hit()` 不可破坏钢块行为
- `Enemy.makeDecision()` 概率分布
- `HeavyEnemy.hit()` 双 HP + 闪烁计时
- `SpeedEffect.apply()/remove()` 速度恢复正确性

## 常见问题 (FAQ)

**Q: 粒子为什么不用 `direction` 字段？**
A: 粒子使用自定义的 `vx`/`vy` 做径向扩散，不继承基类的方向-速度系统。

**Q: HeavyEnemy 的闪烁为什么用时间而非帧数？**
A: 为保证在不同刷新率显示器上闪烁时长一致（167ms）。

## 相关文件清单

| 文件 | 行数 | 说明 |
|-----|------|------|
| `Entity.js` | 68 | 实体基类，位置/边界/绘制接口 |
| `Tank.js` | 150 | 坦克基类，射击/移动/绘制 |
| `Player.js` | 130 | 玩家坦克，输入响应 + 道具效果 |
| `Enemy.js` | 105 | 敌人坦克，AI 决策 |
| `HeavyEnemy.js` | 54 | 重装敌人，双 HP + 血条 + 受击闪烁 |
| `FastEnemy.js` | ~20 | 快速敌人，高速度 |
| `Bullet.js` | 50 | 子弹，飞行与出界检测 |
| `Obstacle.js` | 170 | 障碍物，五种类型绘制 |
| `Particle.js` | 83 | 爆炸粒子，生命周期管理 |
| `PowerUp.js` | ~60 | 道具，定时消失与闪烁 |
| `effects/PowerUpEffect.js` | ~30 | 效果基类 |
| `effects/SpeedEffect.js` | ~20 | 加速效果 |
| `effects/FireRateEffect.js` | ~20 | 速射效果 |
| `effects/ShieldEffect.js` | ~20 | 护盾效果 |

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-04-19 | 同步文档与代码 | 新增 HeavyEnemy/FastEnemy/PowerUp/effects，更新所有接口描述 |
| 2026-04-04 | 初始化 AI 上下文 | 首次生成模块文档 |
