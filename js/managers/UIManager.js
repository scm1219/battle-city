// UI管理器：开始画面、游戏结束、庆祝动画、暂停伪装、DOM更新
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants.js';

export class UIManager {
  /**
   * @param {Object} refs - DOM 引用
   * @param {HTMLElement} refs.scoreElement
   * @param {HTMLElement} refs.timeElement
   * @param {HTMLElement} refs.enemiesElement
   * @param {HTMLElement} refs.gameOverElement
   * @param {HTMLElement} refs.finalScoreElement
   * @param {HTMLElement} refs.disguiseOverlay
   * @param {HTMLElement} refs.gameContainer
   */
  constructor(refs) {
    this.scoreElement = refs.scoreElement;
    this.timeElement = refs.timeElement;
    this.enemiesElement = refs.enemiesElement;
    this.gameOverElement = refs.gameOverElement;
    this.finalScoreElement = refs.finalScoreElement;
    this.disguiseOverlay = refs.disguiseOverlay;
    this.gameContainer = refs.gameContainer;
    this.originalTitle = document.title;

    this.waitingForStart = false;
    this._blinkRafId = null;
  }

  // --- 状态查询 ---

  isWaitingForStart() {
    return this.waitingForStart;
  }

  setWaitingForStart(value) {
    this.waitingForStart = value;
  }

  // --- 开始画面 ---

  /**
   * 显示预热画面
   */
  showBenchmarkScreen(ctx) {
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  /**
   * 显示等待开始画面
   */
  showStartScreen(ctx) {
    this.waitingForStart = true;
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = COLORS.TEXT;
    ctx.textAlign = 'center';

    // 标题
    ctx.font = 'bold 36px monospace';
    ctx.fillText('坦克大战', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    // 取消可能存在的旧闪烁循环
    if (this._blinkRafId) cancelAnimationFrame(this._blinkRafId);
    // 闪烁提示
    this._startScreenBlink(ctx);
  }

  /**
   * 开始画面文字闪烁动画
   */
  _startScreenBlink(ctx) {
    if (!this.waitingForStart) return;

    const now = performance.now();
    const visible = Math.floor(now / 600) % 2 === 0;

    // 清除提示区域（不影响标题）
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, CANVAS_HEIGHT / 2 - 10, CANVAS_WIDTH, 60);

    ctx.fillStyle = visible ? '#00ff00' : '#004400';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('按 任意键 开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    this._blinkRafId = requestAnimationFrame(() => this._startScreenBlink(ctx));
  }

  // --- 游戏 UI 更新 ---

  /**
   * 更新分数和时间显示
   */
  updateUI(score, time) {
    this.scoreElement.textContent = score;
    this.timeElement.textContent = time;
  }

  /**
   * 更新敌人数量显示
   */
  updateEnemyCount(count) {
    this.enemiesElement.textContent = count;
  }

  // --- 游戏结束 ---

  /**
   * 显示游戏结束面板
   * @param {number} score - 最终得分
   * @param {number} rank - 排行榜排名（-1 表示未上榜）
   */
  showGameOver(score, rank) {
    this.finalScoreElement.textContent = score;
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
        if (!overlay.isConnected) return;
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
   * 隐藏游戏结束面板（初始化时调用）
   */
  hideGameOver() {
    this.gameOverElement.classList.add('hidden');
  }

  /**
   * 清理游戏结束面板的庆祝效果（重置时调用）
   */
  resetGameOver() {
    this.gameOverElement.classList.remove('top-3', 'top-1', 'top-2', 'top-3');
    const celebration = this.gameOverElement.querySelector('.celebration-particles');
    if (celebration) celebration.remove();
    const congrats = this.gameOverElement.querySelector('.congrats-text');
    if (congrats) congrats.remove();
  }

  // --- 暂停/伪装模式 ---

  /**
   * 切换暂停/恢复（伪装模式）
   * @param {import('./AudioManager.js').AudioManager} audio
   * @param {boolean} currentlyPaused
   * @param {boolean} isGameOver
   * @returns {boolean} 新的暂停状态
   */
  togglePause(audio, currentlyPaused, isGameOver) {
    const nowPaused = !currentlyPaused;

    if (nowPaused) {
      // 进入伪装模式
      audio.pause();
      this.gameContainer.classList.add('hidden');
      this.disguiseOverlay.classList.remove('hidden');
      document.title = 'index.js - tank-project - Visual Studio Code';
    } else {
      // 恢复游戏
      audio.resume();
      this.disguiseOverlay.classList.add('hidden');
      this.gameContainer.classList.remove('hidden');
      document.title = this.originalTitle;
    }

    return nowPaused;
  }
}
