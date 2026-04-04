# Tank - 坦克大战 (Battle City)

经典 FC 风格网页坦克大战游戏。使用原生 Canvas API 与 ES6 模块化架构实现，零外部依赖，单 HTML 文件即可运行。

## 快速开始

本项目无构建步骤，需要通过 HTTP 服务器加载 ES Module：

```bash
# 方式一：Python 内置服务器
python -m http.server 8080

# 方式二：Node.js npx
npx serve .

# 方式三：VS Code Live Server 插件
# 右键 index.html -> Open with Live Server
```

然后在浏览器打开 `http://localhost:8080`。

## 操作说明

| 按键 | 功能 |
|------|------|
| `W` / `↑` | 向上移动 |
| `S` / `↓` | 向下移动 |
| `A` / `←` | 向左移动 |
| `D` / `→` | 向右移动 |
| `空格` | 发射子弹 |
| `R` | 游戏结束后重新开始 |

## 游戏规则

- **画布**: 520×520 像素，13×13 网格（每格 40px）
- **玩家**: 绿色坦克，初始位于左下角
- **敌人**: 红色坦克，从顶部三个生成点随机出现
- **障碍物**:
  - 砖块（橙色）— 可破坏
  - 钢块（灰色）— 不可破坏
  - 基地（蓝色，底部中心）— 需保护，被摧毁则游戏结束
- **得分**: 击毁敌人 +100 分
- **难度**: 敌人生成间隔随时间缩短（3s → 2s → 1s）
- **失败条件**: 玩家被击中、与敌人碰撞、或基地被摧毁

## 技术架构

- **技术栈**: 原生 JavaScript (ES6 Modules) + Canvas 2D API + HTML/CSS
- **架构模式**: 面向对象经典架构，实体-管理器分层

```
Entity (基类)
  +-- Tank (坦克基类)
  |     +-- Player (玩家坦克)
  |     +-- Enemy (敌人坦克)
  +-- Bullet (子弹)
  +-- Obstacle (障碍物)
  +-- Particle (爆炸粒子)
```

### 目录结构

```
tank/
├── index.html          # 游戏入口
├── css/style.css       # 样式
├── js/
│   ├── Game.js         # 主控制器（游戏循环、碰撞分发）
│   ├── entities/       # 游戏实体
│   │   ├── Entity.js   # 基类
│   │   ├── Tank.js     # 坦克基类
│   │   ├── Player.js   # 玩家
│   │   ├── Enemy.js    # 敌人 AI
│   │   ├── Bullet.js   # 子弹
│   │   ├── Obstacle.js # 障碍物
│   │   └── Particle.js # 爆炸粒子
│   ├── managers/       # 管理器
│   │   ├── InputManager.js     # 键盘输入
│   │   ├── CollisionManager.js # 碰撞检测
│   │   ├── SpawnManager.js     # 敌人生成
│   │   └── MapGenerator.js     # 地图生成
│   └── utils/          # 工具
│       ├── constants.js # 常量配置
│       └── helpers.js   # 工具函数
└── README.md
```

## 浏览器兼容性

支持所有现代浏览器（Chrome、Firefox、Edge、Safari），需要支持 ES6 Modules。
