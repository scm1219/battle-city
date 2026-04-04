// 游戏主控制器
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { HeavyEnemy } from './entities/HeavyEnemy.js';
import { FastEnemy } from './entities/FastEnemy.js';
import { Bullet } from './entities/Bullet.js';
import { Particle } from './entities/Particle.js';
import { InputManager } from './managers/InputManager.js';
import { CollisionManager } from './managers/CollisionManager.js';
import { SpawnManager } from './managers/SpawnManager.js';
import { MapGenerator } from './managers/MapGenerator.js';
import { COLORS, SCORE_PER_ENEMY, SCORE_PER_HEAVY, SCORE_PER_FAST, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FRAME_TIME, BENCHMARK_DURATION, GRID_SIZE, GRID_COUNT, HEAVY_ENEMY_CHANCE, FAST_ENEMY_CHANCE, TANK_SIZE } from './utils/constants.js';
import { rectIntersect } from './utils/helpers.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // 游戏状态
    this.gameRunning = false;
    this.gameOver = false;
    this.dying = false;
    this.paused = false;
    this.score = 0;
    this.gameTime = 0;
    this.kills = { normal: 0, heavy: 0, fast: 0 };

    // 实体数组
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.obstacles = [];

    // 管理器
    this.input = new InputManager();
    this.spawnManager = new SpawnManager();

    // UI元素
    this.scoreElement = document.getElementById('score');
    this.timeElement = document.getElementById('time');
    this.enemiesElement = document.getElementById('enemies');
    this.gameOverElement = document.getElementById('gameOver');
    this.finalScoreElement = document.getElementById('finalScore');
    this.killElements = {
      normal: document.getElementById('killNormal'),
      heavy: document.getElementById('killHeavy'),
      fast: document.getElementById('killFast')
    };
    this.scoreboardList = document.getElementById('scoreboardList');

    // 伪装层
    this.disguiseOverlay = document.getElementById('disguiseOverlay');
    this.gameContainer = document.querySelector('.game-container');
    this.originalTitle = document.title;

    // 时间追踪
    this.lastTime = 0;
    this.timeAccumulator = 0;

    // 绑定重开事件
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR' && this.gameOver) {
        this.reset();
      }
    });

    // ESC 暂停/恢复
    this.input.onEscToggle = () => this.togglePause();

    // 恢复按钮
    document.getElementById('resumeBtn').addEventListener('click', () => {
      if (this.paused) this.togglePause();
    });

    // 初始化游戏
    this.init();
    this.renderScoreboard();
  }

  /**
   * 初始化游戏
   */
  init() {
    // 生成地图
    this.obstacles = MapGenerator.generate();

    // 创建玩家（放置在左下角附近）
    this.player = new Player(GRID_SIZE, (GRID_COUNT - 2) * GRID_SIZE);

    // 清空实体数组
    this.enemies = [];
    this.bullets = [];
    this.particles = [];

    // 重置状态
    this.score = 0;
    this.gameTime = 0;
    this.gameRunning = true;
    this.gameOver = false;
    this.dying = false;
    this.kills = { normal: 0, heavy: 0, fast: 0 };

    // 重置管理器
    this.spawnManager.reset();

    // 更新UI
    this.updateUI();
    this.gameOverElement.classList.add('hidden');
  }

  /**
   * 开始游戏（先运行基准测试）
   */
  async start() {
    this.showBenchmarkScreen();
    const medianFrameTime = await this.runBenchmark();
    const fps = Math.round(1000 / medianFrameTime);

    console.log(`[Benchmark] 帧间隔: ${medianFrameTime.toFixed(2)}ms, 帧率: ~${fps}fps, 速度缩放: ${(TARGET_FRAME_TIME / medianFrameTime).toFixed(3)}`);

    // 启动游戏循环
    this.gameRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  /**
   * 显示基准测试画面
   */
  showBenchmarkScreen() {
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.fillStyle = COLORS.TEXT;
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('正在校准...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }

  /**
   * 运行基准测试，返回中位数帧间隔
   */
  runBenchmark() {
    return new Promise((resolve) => {
      const samples = [];
      let prevTime = performance.now();
      const startTime = prevTime;

      const tick = (now) => {
        const dt = now - prevTime;
        prevTime = now;

        // 忽略异常帧（如切标签页后的第一帧）
        if (dt > 0 && dt < 100) {
          samples.push(dt);
        }

        if (now - startTime < BENCHMARK_DURATION) {
          requestAnimationFrame(tick);
        } else {
          // 取中位数帧间隔
          samples.sort((a, b) => a - b);
          const median = samples[Math.floor(samples.length / 2)];
          resolve(median);
        }
      };

      requestAnimationFrame(tick);
    });
  }

  /**
   * 游戏主循环
   */
  gameLoop(currentTime) {
    if (!this.gameRunning && !this.paused) return;

    // 暂停时保持 rAF 循环但不更新
    if (this.paused) {
      requestAnimationFrame((time) => this.gameLoop(time));
      return;
    }

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 防止切标签页后 deltaTime 过大导致跳跃
    const clampedDt = Math.min(deltaTime, 100);

    // 更新游戏时间（每秒更新一次显示）
    this.timeAccumulator += clampedDt;
    if (this.timeAccumulator >= 1000) {
      this.gameTime++;
      this.timeAccumulator -= 1000;
      this.updateUI();
    }

    // 更新逻辑
    this.update(clampedDt);

    // 绘制画面
    this.draw();

    // 下一帧
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * 逻辑更新
   * @param {number} deltaTime - 距上一帧的毫秒数
   */
  update(deltaTime) {
    if (this.gameOver) return;

    // 玩家死亡等待爆炸效果结束
    if (this.dying) {
      this.particles.forEach(particle => particle.update(deltaTime));
      this.cleanup();

      // 爆炸效果结束后显示游戏结束
      if (this.particles.length === 0) {
        this.endGame();
      }
      return;
    }

    // 更新玩家
    const bullet = this.player.update(this.input, this.obstacles, this.enemies, deltaTime);
    if (bullet) {
      this.bullets.push(new Bullet(bullet.x, bullet.y, bullet.direction, bullet.owner));
    }

    // 生成敌人
    if (this.spawnManager.shouldSpawn()) {
      const spawnPos = this.spawnManager.spawnEnemy(this.enemies);
      if (spawnPos) {
        const roll = Math.random();
        let enemy;
        if (roll < HEAVY_ENEMY_CHANCE) {
          enemy = new HeavyEnemy(spawnPos.x, spawnPos.y);
        } else if (roll < HEAVY_ENEMY_CHANCE + FAST_ENEMY_CHANCE) {
          enemy = new FastEnemy(spawnPos.x, spawnPos.y);
        } else {
          enemy = new Enemy(spawnPos.x, spawnPos.y);
        }
        this.enemies.push(enemy);
      }
    }

    // 更新敌人
    this.enemies.forEach(enemy => {
      const enemyBullet = enemy.update(this.player, this.obstacles, this.enemies, deltaTime);
      if (enemyBullet) {
        this.bullets.push(new Bullet(
          enemyBullet.x,
          enemyBullet.y,
          enemyBullet.direction,
          enemyBullet.owner
        ));
      }
    });

    // 更新子弹
    this.bullets.forEach(bullet => bullet.update(deltaTime));

    // 更新粒子
    this.particles.forEach(particle => particle.update(deltaTime));

    // 碰撞检测
    this.handleCollisions();

    // 清理死亡实体
    this.cleanup();

    // 更新敌人数量UI
    this.enemiesElement.textContent = this.enemies.length;

    // 检测游戏结束
    this.checkGameOver();
  }

  /**
   * 处理碰撞
   */
  handleCollisions() {
    // 子弹 vs 障碍物
    for (const bullet of this.bullets) {
      if (bullet.markedForDeletion) continue;

      const obstacle = CollisionManager.checkBulletObstacles(bullet, this.obstacles);
      if (obstacle) {
        bullet.markedForDeletion = true;

        if (obstacle.isDestructible()) {
          const destroyed = obstacle.hit(bullet.direction);
          if (destroyed) {
            // 生成爆炸效果
            const particles = Particle.createSmallExplosion(
              obstacle.x + obstacle.width / 2,
              obstacle.y + obstacle.height / 2
            );
            this.particles.push(...particles);

            if (obstacle.isBase()) {
              // 基地被摧毁，游戏结束
              this.endGame();
            }
          }
        }
      }
    }

    // 玩家子弹 vs 敌人
    for (const bullet of this.bullets) {
      if (bullet.markedForDeletion) continue;
      if (bullet.getOwner() !== 'player') continue;

      const enemy = CollisionManager.checkBulletTanks(bullet, this.enemies);
      if (enemy) {
        bullet.markedForDeletion = true;

        // 重装敌人使用 hp 机制，普通敌人直接摧毁
        const destroyed = enemy.hit ? enemy.hit() : true;

        if (destroyed) {
          enemy.markedForDeletion = true;

          // 记录击毁并加分
          const points = this.addKill(enemy);
          this.score += points;
          this.updateUI();

          // 生成爆炸效果
          const particles = Particle.createLargeExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          );
          this.particles.push(...particles);
        }
      }
    }

    // 敌人子弹 vs 玩家
    for (const bullet of this.bullets) {
      if (bullet.markedForDeletion) continue;
      if (bullet.getOwner() !== 'enemy') continue;

      const player = CollisionManager.checkBulletTanks(bullet, [this.player]);
      if (player) {
        bullet.markedForDeletion = true;
        this.player.markedForDeletion = true;

        // 生成爆炸效果
        const particles = Particle.createLargeExplosion(
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height / 2
        );
        this.particles.push(...particles);

        // 玩家死亡，等待爆炸结束后再结束游戏
      }
    }

    // 子弹 vs 子弹（对撞抵消）
    const bulletPairs = CollisionManager.checkBulletBullet(this.bullets);
    for (const { a, b } of bulletPairs) {
      // 生成火花效果
      const midX = (a.x + b.x) / 2 + a.width / 2;
      const midY = (a.y + b.y) / 2 + a.height / 2;
      const particles = Particle.createSmallExplosion(midX, midY);
      this.particles.push(...particles);
    }

    // 玩家 vs 敌人（碰撞）- 仅阻挡，不判负

    // 敌人 vs 基地
    if (CollisionManager.checkEnemyBase(this.enemies, this.obstacles)) {
      this.endGame();
    }
  }

  /**
   * 清理死亡实体
   */
  cleanup() {
    // 清理标记删除的子弹
    this.bullets = this.bullets.filter(b => !b.markedForDeletion && !b.isOutOfBounds());

    // 清理标记删除的敌人
    this.enemies = this.enemies.filter(e => !e.markedForDeletion);

    // 清理标记删除的障碍物
    this.obstacles = this.obstacles.filter(o => !o.markedForDeletion);

    // 清理死亡的粒子
    this.particles = this.particles.filter(p => !p.isDead());
  }

  /**
   * 绘制画面
   */
  draw() {
    // 清空画布
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制障碍物（非森林）
    this.obstacles.forEach(obstacle => {
      if (obstacle.type !== 'forest') obstacle.draw(this.ctx);
    });

    // 绘制玩家
    if (!this.player.markedForDeletion) {
      this.player.draw(this.ctx);
    }

    // 绘制敌人
    this.enemies.forEach(enemy => enemy.draw(this.ctx));

    // 绘制森林（坦克所在的森林格半透明，其余不透明）
    const tanks = [this.player, ...this.enemies].filter(t => !t.markedForDeletion);
    this.obstacles.forEach(obstacle => {
      if (obstacle.type === 'forest') {
        const tankInForest = tanks.some(tank =>
          rectIntersect(tank.getBounds(), obstacle.getBounds())
        );
        if (tankInForest) {
          this.ctx.save();
          this.ctx.globalAlpha = 0.6;
          obstacle.draw(this.ctx);
          this.ctx.restore();
        } else {
          obstacle.draw(this.ctx);
        }
      }
    });

    // 绘制子弹
    this.bullets.forEach(bullet => bullet.draw(this.ctx));

    // 绘制粒子
    this.particles.forEach(particle => particle.draw(this.ctx));
  }

  /**
   * 检测游戏结束
   */
  checkGameOver() {
    if (this.player.markedForDeletion && !this.gameOver && !this.dying) {
      this.dying = true;
    }
  }

  /**
   * 结束游戏
   */
  endGame() {
    this.gameOver = true;
    this.gameRunning = false;
    this.finalScoreElement.textContent = this.score;
    this.gameOverElement.classList.remove('hidden');
    this.saveScore(this.score);
  }

  /**
   * 切换暂停/恢复（伪装模式）
   */
  togglePause() {
    this.paused = !this.paused;

    if (this.paused) {
      // 进入伪装模式
      this.gameContainer.classList.add('hidden');
      this.disguiseOverlay.classList.remove('hidden');
      document.title = 'index.js - tank-project - Visual Studio Code';
    } else {
      // 恢复游戏
      this.disguiseOverlay.classList.add('hidden');
      this.gameContainer.classList.remove('hidden');
      document.title = this.originalTitle;
      // 游戏进行中恢复时重置时间并清空按键
      if (!this.gameOver) {
        this.lastTime = performance.now();
        this.input.clear();
      }
    }
  }

  /**
   * 记录击毁并更新击毁统计UI
   */
  addKill(enemy) {
    let points;
    if (enemy instanceof HeavyEnemy) {
      this.kills.heavy++;
      points = SCORE_PER_HEAVY;
    } else if (enemy instanceof FastEnemy) {
      this.kills.fast++;
      points = SCORE_PER_FAST;
    } else {
      this.kills.normal++;
      points = SCORE_PER_ENEMY;
    }
    this.killElements.normal.textContent = this.kills.normal;
    this.killElements.heavy.textContent = this.kills.heavy;
    this.killElements.fast.textContent = this.kills.fast;
    return points;
  }

  /**
   * 更新UI
   */
  updateUI() {
    this.scoreElement.textContent = this.score;
    this.timeElement.textContent = this.gameTime;
  }

  /**
   * 保存得分到 localStorage，最多保留 20 条
   */
  saveScore(score) {
    const STORAGE_KEY = 'tank_scoreboard';
    const MAX_ENTRIES = 20;

    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      records = [];
    }

    records.push({ score, date: dateStr });
    records.sort((a, b) => b.score - a.score);
    records = records.slice(0, MAX_ENTRIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    this.renderScoreboard();
  }

  /**
   * 渲染历史得分榜
   */
  renderScoreboard() {
    const STORAGE_KEY = 'tank_scoreboard';
    const RANK_LABELS = ['1st', '2nd', '3rd'];
    const MAX_ROWS = 20;

    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      records = [];
    }

    let html = '';
    for (let i = 0; i < MAX_ROWS; i++) {
      if (i < records.length) {
        const record = records[i];
        const rankClass = i < 3 ? ` rank-${i + 1}` : '';
        const rankText = i < 3 ? RANK_LABELS[i] : `${i + 1}`;
        html += `<div class="scoreboard-row${rankClass}">
          <span class="scoreboard-rank">${rankText}</span>
          <span class="scoreboard-score">${record.score}</span>
          <span class="scoreboard-date">${record.date}</span>
        </div>`;
      } else {
        html += `<div class="scoreboard-row scoreboard-empty-row">
          <span class="scoreboard-rank">${i + 1}</span>
          <span class="scoreboard-score">---</span>
          <span class="scoreboard-date"></span>
        </div>`;
      }
    }
    this.scoreboardList.innerHTML = html;
  }

  /**
   * 重置游戏
   */
  reset() {
    this.init();
    this.start();
  }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
