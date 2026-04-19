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
import { COLORS, SCORE_PER_ENEMY, SCORE_PER_HEAVY, SCORE_PER_FAST, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FRAME_TIME, GRID_SIZE, GRID_COUNT, HEAVY_ENEMY_CHANCE, FAST_ENEMY_CHANCE, TANK_SIZE } from './utils/constants.js';
import { rectIntersect } from './utils/helpers.js';

export class Game {
  static SCOREBOARD_KEY = 'tank_scoreboard';
  static MAX_PARTICLES = 200;

  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // 游戏状态
    this.gameRunning = false;
    this.gameOver = false;
    this.dying = false;
    this.paused = false;
    this.waitingForStart = false; // 等待玩家按空格开始
    this.score = 0;
    this.gameTime = 0;
    this.kills = { normal: 0, heavy: 0, fast: 0 };

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
      // 首次交互时初始化音频
      this.audio.init();

      // 等待开始画面：按任意键（ESC除外）启动游戏
      if (this.waitingForStart && e.code !== 'Escape') {
        this.waitingForStart = false;
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
    this.input.onEscToggle = () => this.togglePause();

    // 恢复按钮
    document.getElementById('resumeBtn').addEventListener('click', () => {
      if (this.paused) this.togglePause();
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
    this.powerUps = [];

    // 重置道具生成计时
    this.lastPowerUpSpawnTime = performance.now();

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
   * 开始游戏（预热渲染管线后显示开始画面）
   */
  async start() {
    this.showBenchmarkScreen();
    // 用 rAF 预热浏览器渲染管线，让首帧更稳定
    await this.warmup();
    this.showStartScreen();
  }

  /**
   * 显示预热画面
   */
  showBenchmarkScreen() {
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  /**
   * 显示等待开始画面
   */
  showStartScreen() {
    this.waitingForStart = true;
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.fillStyle = COLORS.TEXT;
    this.ctx.textAlign = 'center';

    // 标题
    this.ctx.font = 'bold 36px monospace';
    this.ctx.fillText('坦克大战', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    // 取消可能存在的旧闪烁循环
    if (this._blinkRafId) cancelAnimationFrame(this._blinkRafId);
    // 闪烁提示
    this._startScreenBlink();
  }

  /**
   * 开始画面文字闪烁动画
   */
  _startScreenBlink() {
    if (!this.waitingForStart) return;

    const now = performance.now();
    const visible = Math.floor(now / 600) % 2 === 0;

    // 清除提示区域（不影响标题）
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, CANVAS_HEIGHT / 2 - 10, CANVAS_WIDTH, 60);

    this.ctx.fillStyle = visible ? '#00ff00' : '#004400';
    this.ctx.font = '18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('按 任意键 开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    this._blinkRafId = requestAnimationFrame(() => this._startScreenBlink());
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

    // 生成敌人（同屏上限 4 个，致敬经典 FC 版）
    if (this.enemies.length < 6 && this.spawnManager.shouldSpawn()) {
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
          this.addParticles(particles);
          this.audio.playExplosion();
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
        this.audio.playExplosion();

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
    this.finalScoreElement.textContent = this.score;

    // 零分不计入排行榜
    let rank = -1;
    if (this.score > 0) {
      rank = this.saveScore(this.score);
    }
    this.gameOverElement.classList.remove('hidden');

    if (rank >= 1 && rank <= 3) {
      this.gameOverElement.classList.add('top-3', `top-${rank}`);
      this._showCongrats(rank);
      this._startCelebration();
    }
  }

  /**
   * 显示前三名祝贺文字
   */
  _showCongrats(rank) {
    const messages = {
      1: '🏆 新纪录！无人能敌！',
      2: '🥈 亚军！离王者只差一步！',
      3: '🥉 季军！实力不俗！',
    };
    let el = this.gameOverElement.querySelector('.congrats-text');
    if (!el) {
      el = document.createElement('p');
      el.className = 'congrats-text';
      this.gameOverElement.insertBefore(el, this.gameOverElement.querySelector('.instruction'));
    }
    el.textContent = messages[rank];
  }

  /**
   * 前三名庆祝动画：在 game over 面板上生成金色烟花粒子
   */
  _startCelebration() {
    const overlay = this.gameOverElement;
    // 创建粒子容器
    let container = overlay.querySelector('.celebration-particles');
    if (!container) {
      container = document.createElement('div');
      container.className = 'celebration-particles';
      overlay.appendChild(container);
    }

    // 生成多波烟花
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#00FF00', '#00BFFF'];
    for (let wave = 0; wave < 3; wave++) {
      setTimeout(() => {
        if (!this.gameOver) return;
        for (let i = 0; i < 12; i++) {
          const particle = document.createElement('div');
          particle.className = 'firework-particle';
          const angle = (Math.PI * 2 * i) / 12;
          const dist = 40 + Math.random() * 60;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist;
          particle.style.setProperty('--dx', `${dx}px`);
          particle.style.setProperty('--dy', `${dy}px`);
          particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          particle.style.left = '50%';
          particle.style.top = '40%';
          container.appendChild(particle);
          // 动画结束后移除
          setTimeout(() => particle.remove(), 1200);
        }
      }, wave * 600);
    }
  }

  /**
   * 切换暂停/恢复（伪装模式）
   */
  togglePause() {
    this.paused = !this.paused;

    if (this.paused) {
      // 进入伪装模式
      this.audio.pause();
      this.gameContainer.classList.add('hidden');
      this.disguiseOverlay.classList.remove('hidden');
      document.title = 'index.js - tank-project - Visual Studio Code';
    } else {
      // 恢复游戏
      this.audio.resume();
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
   * @returns {number} 当前分数的排名（从 1 开始），未上榜返回 -1
   */
  saveScore(score) {
    const STORAGE_KEY = Game.SCOREBOARD_KEY;
    const MAX_ENTRIES = 20;

    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      records = [];
    }

    // 先计算不带本次分数时的排名基准
    const currentEntry = { score, date: dateStr, _isCurrent: true };
    records.push(currentEntry);
    records.sort((a, b) => b.score - a.score);

    // 找到本次分数的排名
    const rank = records.findIndex(r => r._isCurrent) + 1;

    // 清理标记并截断
    delete currentEntry._isCurrent;
    records = records.slice(0, MAX_ENTRIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    this.renderScoreboard();

    return rank;
  }

  /**
   * 渲染历史得分榜
   */
  renderScoreboard() {
    const STORAGE_KEY = Game.SCOREBOARD_KEY;
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
    // 清理庆祝效果
    this.gameOverElement.classList.remove('top-3', 'top-1', 'top-2', 'top-3');
    const celebration = this.gameOverElement.querySelector('.celebration-particles');
    if (celebration) celebration.remove();
    const congrats = this.gameOverElement.querySelector('.congrats-text');
    if (congrats) congrats.remove();

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
