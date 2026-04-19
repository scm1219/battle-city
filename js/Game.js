// 游戏主控制器
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { HeavyEnemy } from './entities/HeavyEnemy.js';
import { FastEnemy } from './entities/FastEnemy.js';
import { Bullet } from './entities/Bullet.js';
import { Particle } from './entities/Particle.js';
import { PowerUp } from './entities/PowerUp.js';
import { InputManager } from './managers/InputManager.js';
import { CollisionManager } from './managers/CollisionManager.js';
import { SpawnManager } from './managers/SpawnManager.js';
import { MapGenerator } from './managers/MapGenerator.js';
import { AudioManager } from './managers/AudioManager.js';
import { PowerUpManager } from './managers/PowerUpManager.js';
import { ScoreManager } from './managers/ScoreManager.js';
import { UIManager } from './managers/UIManager.js';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FRAME_TIME, GRID_SIZE, GRID_COUNT, HEAVY_ENEMY_CHANCE, FAST_ENEMY_CHANCE, TANK_SIZE } from './utils/constants.js';
import { rectIntersect } from './utils/helpers.js';

export class Game {
  static MAX_PARTICLES = 200;

  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // 游戏状态
    this.gameRunning = false;
    this.gameOver = false;
    this.dying = false;
    this.paused = false;
    this.gameTime = 0;

    // 实体数组
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.obstacles = [];
    this.powerUps = [];

    // 道具生成计时
    this.lastPowerUpSpawnTime = performance.now();

    // 管理器
    this.input = new InputManager();
    this.spawnManager = new SpawnManager();
    this.audio = new AudioManager();
    this.scoreManager = new ScoreManager(
      {
        normal: document.getElementById('killNormal'),
        heavy: document.getElementById('killHeavy'),
        fast: document.getElementById('killFast')
      },
      document.getElementById('scoreboardList')
    );

    this.ui = new UIManager({
      scoreElement: document.getElementById('score'),
      timeElement: document.getElementById('time'),
      enemiesElement: document.getElementById('enemies'),
      gameOverElement: document.getElementById('gameOver'),
      finalScoreElement: document.getElementById('finalScore'),
      disguiseOverlay: document.getElementById('disguiseOverlay'),
      gameContainer: document.querySelector('.game-container')
    });

    // 时间追踪
    this.lastTime = 0;
    this.timeAccumulator = 0;

    // 绑定重开事件
    window.addEventListener('keydown', (e) => {
      // 首次交互时初始化音频
      this.audio.init();

      // 等待开始画面：按任意键（ESC除外）启动游戏
      if (this.ui.isWaitingForStart() && e.code !== 'Escape') {
        this.ui.setWaitingForStart(false);
        this.gameRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        return;
      }

      if (e.code === 'KeyR' && this.gameOver) {
        this.reset();
      }
    });

    // ESC 暂停/恢复
    this.input.onEscToggle = () => {
      this.paused = this.ui.togglePause(this.audio, this.paused, this.gameOver);
      if (!this.paused && !this.gameOver) {
        this.lastTime = performance.now();
        this.input.clear();
      }
    };

    // 恢复按钮
    document.getElementById('resumeBtn').addEventListener('click', () => {
      if (this.paused) {
        this.paused = this.ui.togglePause(this.audio, this.paused, this.gameOver);
        if (!this.paused && !this.gameOver) {
          this.lastTime = performance.now();
          this.input.clear();
        }
      }
    });

    // 音乐开关按钮
    this.audioToggleBtn = document.getElementById('audioToggle');
    this.audioToggleBtn.addEventListener('click', () => {
      this.audio.init(); // 确保已初始化
      const enabled = this.audio.toggleBGM();
      this.audioToggleBtn.classList.toggle('muted', !enabled);
      this.audioToggleBtn.querySelector('.audio-label').textContent =
        `音乐: ${enabled ? '开' : '关'}`;
    });

    // 初始化游戏
    this.init();
    this.scoreManager.renderScoreboard();
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
    this.powerUps = [];

    // 重置道具生成计时
    this.lastPowerUpSpawnTime = performance.now();

    // 重置状态
    this.scoreManager.reset();
    this.gameTime = 0;
    this.gameRunning = true;
    this.gameOver = false;
    this.dying = false;

    // 重置管理器
    this.spawnManager.reset();

    // 更新UI
    this.updateUI();
    this.ui.hideGameOver();
  }

  /**
   * 开始游戏（预热渲染管线后显示开始画面）
   */
  async start() {
    this.ui.showBenchmarkScreen(this.ctx);
    // 用 rAF 预热浏览器渲染管线，让首帧更稳定
    await this.warmup();
    this.ui.showStartScreen(this.ctx);
  }

  /**
   * 预热渲染管线（空跑 rAF 几帧让浏览器稳定）
   */
  warmup() {
    return new Promise((resolve) => {
      let count = 0;
      const tick = () => {
        if (++count >= 10) resolve();
        else requestAnimationFrame(tick);
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
      this.ui.updateUI(this.scoreManager.getScore(), this.gameTime);
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

    // 生成敌人（同屏上限 6 个，致敬经典 FC 版）
    if (this.enemies.length < 6 && this.spawnManager.shouldSpawn()) {
      const spawnPos = this.spawnManager.spawnEnemy(this.enemies, this.player);
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

    // 道具生成
    if (PowerUpManager.shouldSpawn(this.powerUps, this.lastPowerUpSpawnTime)) {
      const powerUp = PowerUpManager.createPowerUp(this.obstacles, this.player, this.enemies);
      if (powerUp) {
        this.powerUps.push(powerUp);
        this.lastPowerUpSpawnTime = performance.now();
      }
    }

    // 更新道具生命周期
    this.powerUps.forEach(pu => pu.update(deltaTime));

    // 玩家拾取道具
    const pickedPowerUp = CollisionManager.checkPlayerPowerUp(this.player, this.powerUps);
    if (pickedPowerUp) {
      this.player.applyPowerUp(pickedPowerUp);
      pickedPowerUp.markedForDeletion = true;
    }

    // 碰撞检测
    this.handleCollisions();

    // 清理死亡实体
    this.cleanup();

    // 更新敌人数量UI
    this.ui.updateEnemyCount(this.enemies.length);

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
            this.addParticles(particles);

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
        const destroyed = enemy.hit();

        if (destroyed) {
          enemy.markedForDeletion = true;

          // 记录击毁并加分
          this.scoreManager.addKill(enemy);
          this.ui.updateUI(this.scoreManager.getScore(), this.gameTime);

          // 生成爆炸效果
          const particles = Particle.createLargeExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          );
          this.addParticles(particles);
          this.audio.playEnemyExplosion();
        }
      }
    }

    // 敌人子弹 vs 玩家
    for (const bullet of this.bullets) {
      if (bullet.markedForDeletion) continue;
      if (bullet.getOwner() !== 'enemy') continue;

      const player = CollisionManager.checkBulletTanks(bullet, [this.player]);
      if (player) {
        // 无敌状态下子弹被弹开，不造成伤害
        if (this.player.invincible) {
          bullet.markedForDeletion = true;
          continue;
        }
        bullet.markedForDeletion = true;
        this.player.markedForDeletion = true;

        // 生成爆炸效果
        const particles = Particle.createLargeExplosion(
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height / 2
        );
        this.addParticles(particles);
        this.audio.playPlayerExplosion();

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
      this.addParticles(particles);
    }

    // 玩家 vs 敌人（碰撞）- 仅阻挡，不判负

    // 敌人 vs 基地
    if (CollisionManager.checkEnemyBase(this.enemies, this.obstacles)) {
      this.endGame();
    }
  }

  /**
   * 安全添加粒子（受上限约束）
   */
  addParticles(newParticles) {
    const available = Game.MAX_PARTICLES - this.particles.length;
    if (available <= 0) return;
    this.particles.push(...newParticles.slice(0, available));
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

    // 清理消失的道具
    this.powerUps = this.powerUps.filter(p => !p.markedForDeletion);
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

    // 绘制道具
    this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));

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
    // 防止重复调用（如 dying 粒子清空 + 基地同时被摧毁）
    if (this.gameOver) return;

    this.gameOver = true;
    this.dying = false;
    this.gameRunning = false;
    this.audio.stopBGM();

    // 零分不计入排行榜
    let rank = -1;
    if (this.scoreManager.getScore() > 0) {
      rank = this.scoreManager.saveScore();
    }

    this.ui.showGameOver(this.scoreManager.getScore(), rank);
  }

  /**
   * 更新UI
   */
  updateUI() {
    this.ui.updateUI(this.scoreManager.getScore(), this.gameTime);
  }

  /**
   * 重置游戏
   */
  reset() {
    // 清理庆祝效果
    this.ui.resetGameOver();

    this.init();
    this.audio.playBGM();
    this.start();
  }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
