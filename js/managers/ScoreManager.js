// 分数与排行榜管理器
import { SCORE_PER_ENEMY, SCORE_PER_HEAVY, SCORE_PER_FAST } from '../utils/constants.js';

export class ScoreManager {
  static SCOREBOARD_KEY = 'tank_scoreboard';
  static MAX_ENTRIES = 20;

  /**
   * @param {{ normal: HTMLElement, heavy: HTMLElement, fast: HTMLElement }} killElements
   * @param {HTMLElement} scoreboardList
   */
  constructor(killElements, scoreboardList) {
    this.score = 0;
    this.kills = { normal: 0, heavy: 0, fast: 0 };
    this.killElements = killElements;
    this.scoreboardList = scoreboardList;
  }

  /**
   * 获取当前分数
   */
  getScore() {
    return this.score;
  }

  /**
   * 记录击毁并更新统计UI
   * @param {import('../entities/Enemy.js').Enemy} enemy
   * @returns {number} 本次击毁得分
   */
  addKill(enemy) {
    const points = enemy.getScore();
    this.score += points;
    this._updateKillDisplay();
    return points;
  }

  /**
   * 重置分数和击杀统计
   */
  reset() {
    this.score = 0;
    this.kills = { normal: 0, heavy: 0, fast: 0 };
    this._updateKillDisplay();
  }

  /**
   * 保存得分到 localStorage
   * @returns {number} 当前分数的排名（从1开始），未上榜返回 -1
   */
  saveScore() {
    const score = this.score;
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(ScoreManager.SCOREBOARD_KEY)) || [];
    } catch (e) {
      records = [];
    }

    const currentEntry = { score, date: dateStr, _isCurrent: true };
    records.push(currentEntry);
    records.sort((a, b) => b.score - a.score);

    // 找到本次分数的排名
    const rank = records.findIndex(r => r._isCurrent) + 1;

    // 清理标记并截断
    delete currentEntry._isCurrent;
    records = records.slice(0, ScoreManager.MAX_ENTRIES);

    localStorage.setItem(ScoreManager.SCOREBOARD_KEY, JSON.stringify(records));
    this.renderScoreboard();

    return rank;
  }

  /**
   * 渲染历史得分榜
   */
  renderScoreboard() {
    const RANK_LABELS = ['1st', '2nd', '3rd'];
    const MAX_ROWS = ScoreManager.MAX_ENTRIES;

    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(ScoreManager.SCOREBOARD_KEY)) || [];
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
   * 更新击毁统计 DOM
   */
  _updateKillDisplay() {
    this.killElements.normal.textContent = this.kills.normal;
    this.killElements.heavy.textContent = this.kills.heavy;
    this.killElements.fast.textContent = this.kills.fast;
  }
}
