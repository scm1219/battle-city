// 音频管理器 - Web Audio API 程序化合成 FC 风格音效
import { AUDIO_BGM_BPM, AUDIO_BGM_VOLUME, AUDIO_SFX_VOLUME, AUDIO_EXPLOSION_DURATION } from '../utils/constants.js';

/**
 * 音频管理器
 * 使用 Web Audio API 程序化合成 FC 风格背景音乐和音效，零外部音频文件依赖。
 */
export class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.bgmEnabled = true;
    this.sfxEnabled = true;
    this.bgmVolume = AUDIO_BGM_VOLUME;
    this.sfxVolume = AUDIO_SFX_VOLUME;
    this._bgmGain = null;
    this._bgmTimer = null;
    this._bgmPlaying = false;
    this._initialized = false;
    // 缓存旋律数据，避免每次循环重新创建
    this._melody = null;
    this._bass = null;
  }

  /**
   * 初始化 AudioContext（必须在用户交互后调用）
   */
  init() {
    if (this._initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._bgmGain = this.ctx.createGain();
    this._bgmGain.gain.value = this.bgmVolume;
    this._bgmGain.connect(this.ctx.destination);
    this._initialized = true;
    // 一次性缓存旋律数据
    this._melody = this._createMelody();
    this._bass = this._createBass();
    this.playBGM();
  }

  // ===== 背景音乐 =====

  /**
   * 播放 FC 风格循环背景旋律
   */
  playBGM() {
    if (!this._initialized || !this.bgmEnabled || this._bgmPlaying) return;
    // 恢复增益（stopBGM 会将其设为 0）
    if (this._bgmGain && this.ctx) {
      this._bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this._bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
    this._bgmPlaying = true;
    this._scheduleBGMLoop();
  }

  /**
   * 停止背景音乐（立即静音）
   */
  stopBGM() {
    this._bgmPlaying = false;
    if (this._bgmTimer) {
      clearTimeout(this._bgmTimer);
      this._bgmTimer = null;
    }
    // 立即静音所有正在播放的 BGM 音符
    if (this._bgmGain && this.ctx) {
      this._bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this._bgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  /**
   * 切换背景音乐开关
   */
  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.playBGM();
    } else {
      this.stopBGM();
    }
    return this.bgmEnabled;
  }

  /**
   * 调度 BGM 循环：安排一组旋律音符，结束后重新调度
   */
  _scheduleBGMLoop() {
    if (!this._bgmPlaying || !this.ctx) return;

    const now = this.ctx.currentTime;
    const beatDuration = 60 / AUDIO_BGM_BPM; // 每拍时长（秒）

    // FC 风格旋律：两声部（方波主旋律 + 三角波低音）
    const melody = this._melody;
    const bass = this._bass;

    let totalBeats = 0;

    // 播放主旋律
    for (const note of melody) {
      if (note.freq > 0) {
        this._playTone(note.freq, now + note.beat * beatDuration, note.dur * beatDuration, 'square', this._bgmGain);
      }
      totalBeats = Math.max(totalBeats, note.beat + note.dur);
    }

    // 播放低音
    for (const note of bass) {
      if (note.freq > 0) {
        this._playTone(note.freq, now + note.beat * beatDuration, note.dur * beatDuration, 'triangle', this._bgmGain);
      }
    }

    // 循环调度
    const loopDuration = totalBeats * beatDuration * 1000;
    this._bgmTimer = setTimeout(() => this._scheduleBGMLoop(), loopDuration - 50);
  }

  /**
   * 主旋律音符序列
   * freq: 频率(Hz), beat: 起始拍, dur: 持续拍数
   */
  _createMelody() {
    // C大调 FC 战斗风旋律 (32拍 = 8小节)
    const E4 = 329.63, G4 = 392.00, A4 = 440.00, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46;
    const G5 = 783.99, A5 = 880.00;

    return [
      // 第1-2小节：上行开场
      { freq: E4, beat: 0, dur: 0.5 },
      { freq: G4, beat: 0.5, dur: 0.5 },
      { freq: A4, beat: 1, dur: 0.5 },
      { freq: C5, beat: 1.5, dur: 0.5 },
      { freq: D5, beat: 2, dur: 1 },
      { freq: C5, beat: 3, dur: 1 },

      // 第3-4小节：呼应
      { freq: E4, beat: 4, dur: 0.5 },
      { freq: G4, beat: 4.5, dur: 0.5 },
      { freq: A4, beat: 5, dur: 0.5 },
      { freq: B4, beat: 5.5, dur: 0.5 },
      { freq: C5, beat: 6, dur: 1 },
      { freq: A4, beat: 7, dur: 1 },

      // 第5-6小节：高潮
      { freq: E5, beat: 8, dur: 0.5 },
      { freq: D5, beat: 8.5, dur: 0.5 },
      { freq: C5, beat: 9, dur: 0.5 },
      { freq: D5, beat: 9.5, dur: 0.5 },
      { freq: E5, beat: 10, dur: 1 },
      { freq: G5, beat: 11, dur: 1 },

      // 第7-8小节：回落收尾
      { freq: A5, beat: 12, dur: 0.75 },
      { freq: G5, beat: 12.75, dur: 0.25 },
      { freq: E5, beat: 13, dur: 0.5 },
      { freq: D5, beat: 13.5, dur: 0.5 },
      { freq: C5, beat: 14, dur: 1 },
      { freq: C5, beat: 15, dur: 1 },
    ];
  }

  /**
   * 低音伴奏序列
   */
  _createBass() {
    const C3 = 130.81, E3 = 164.81, F3 = 174.61, G3 = 196.00;
    const A2 = 110.00, A3 = 220.00;

    return [
      // 低音每拍一下，节奏感
      { freq: C3, beat: 0, dur: 1 },
      { freq: C3, beat: 1, dur: 1 },
      { freq: G3, beat: 2, dur: 1 },
      { freq: G3, beat: 3, dur: 1 },

      { freq: A2, beat: 4, dur: 1 },
      { freq: A3, beat: 5, dur: 1 },
      { freq: E3, beat: 6, dur: 1 },
      { freq: E3, beat: 7, dur: 1 },

      { freq: C3, beat: 8, dur: 1 },
      { freq: C3, beat: 9, dur: 1 },
      { freq: F3, beat: 10, dur: 1 },
      { freq: G3, beat: 11, dur: 1 },

      { freq: A2, beat: 12, dur: 1 },
      { freq: A3, beat: 13, dur: 1 },
      { freq: C3, beat: 14, dur: 1 },
      { freq: C3, beat: 15, dur: 1 },
    ];
  }

  /**
   * 播放单个音调
   */
  _playTone(freq, startTime, duration, type, gainNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    // 音量包络：快速起音，尾部衰减
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(type === 'square' ? 0.08 : 0.15, startTime + 0.01);
    gain.gain.setValueAtTime(type === 'square' ? 0.08 : 0.15, startTime + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(gainNode);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // ===== 音效 =====

  /**
   * 播放爆炸音效（白噪声 + 低频轰鸣）
   */
  playExplosion() {
    if (!this._initialized || !this.sfxEnabled) return;

    const now = this.ctx.currentTime;
    const duration = AUDIO_EXPLOSION_DURATION;

    // 白噪声层 - 模拟爆炸的嘶嘶声
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // 带通滤波 - 让噪声更像爆炸而非纯白噪声
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    // 低频轰鸣层 - 模拟爆炸的冲击感
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + duration);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  // ===== 暂停/恢复 =====

  /**
   * 暂停所有音频（游戏暂停时调用）
   */
  pause() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  /**
   * 恢复音频（游戏恢复时调用）
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}
