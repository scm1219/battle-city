// 音频管理器 - Web Audio API 程序化合成 FC 风格音效
import {
  AUDIO_BGM_VOLUME, AUDIO_SFX_VOLUME, AUDIO_EXPLOSION_DURATION,
  AUDIO_BGM_TRACKS,
  AUDIO_BGM_NORMAL_BPM, AUDIO_BGM_INTENSE_BPM, AUDIO_BGM_BOSS_BPM
} from '../utils/constants.js';

/**
 * 音频管理器
 * 使用 Web Audio API 程序化合成 FC 风格背景音乐和音效，零外部音频文件依赖。
 * 支持多首 BGM 场景自动切换（经典 / 激烈 / Boss 战）。
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
    this._currentTrack = AUDIO_BGM_TRACKS.NORMAL;
    this._switchTimer = null;
    // 预缓存 3 首曲目数据
    this._tracks = null;
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
    // 一次性缓存全部曲目旋律数据
    this._tracks = [
      { ...this._createTrackNormal(), bpm: AUDIO_BGM_NORMAL_BPM },
      { ...this._createTrackIntense(), bpm: AUDIO_BGM_INTENSE_BPM },
      { ...this._createTrackBoss(), bpm: AUDIO_BGM_BOSS_BPM },
    ];
    this.playBGM();
  }

  // ===== 背景音乐 =====

  /**
   * 播放 FC 风格循环背景旋律
   */
  playBGM() {
    if (!this._initialized || !this.bgmEnabled || this._bgmPlaying) return;
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
   * 切换到指定 BGM 曲目（平滑过渡，无爆音）
   * @param {number} trackId - AUDIO_BGM_TRACKS 中的曲目编号
   */
  switchBGM(trackId) {
    if (!this._initialized || !this._tracks) return;
    if (trackId === this._currentTrack && this._bgmPlaying) return;

    this._currentTrack = trackId;

    if (!this.bgmEnabled) return;

    // 取消之前的切换定时器，防止竞争
    if (this._switchTimer) {
      clearTimeout(this._switchTimer);
      this._switchTimer = null;
    }

    // 停止当前循环，用淡出避免爆音
    this._bgmPlaying = false;
    if (this._bgmTimer) {
      clearTimeout(this._bgmTimer);
      this._bgmTimer = null;
    }

    // 短暂淡出后淡入新曲目
    if (this._bgmGain && this.ctx) {
      const now = this.ctx.currentTime;
      this._bgmGain.gain.cancelScheduledValues(now);
      this._bgmGain.gain.setValueAtTime(this._bgmGain.gain.value, now);
      this._bgmGain.gain.linearRampToValueAtTime(0, now + 0.1);
    }

    this._switchTimer = setTimeout(() => {
      this._switchTimer = null;
      this._bgmPlaying = true;
      if (this._bgmGain && this.ctx) {
        const now = this.ctx.currentTime;
        this._bgmGain.gain.cancelScheduledValues(now);
        this._bgmGain.gain.setValueAtTime(0, now);
        this._bgmGain.gain.linearRampToValueAtTime(this.bgmVolume, now + 0.15);
      }
      this._scheduleBGMLoop();
    }, 120);
  }

  /**
   * 获取当前曲目编号
   */
  getCurrentTrack() {
    return this._currentTrack;
  }

  /**
   * 调度 BGM 循环：安排一组旋律音符，结束后重新调度
   */
  _scheduleBGMLoop() {
    if (!this._bgmPlaying || !this.ctx || !this._tracks) return;

    const track = this._tracks[this._currentTrack];
    const now = this.ctx.currentTime;
    const beatDuration = 60 / track.bpm;

    let totalBeats = 0;

    // 播放主旋律（方波）
    for (const note of track.melody) {
      if (note.freq > 0) {
        this._playTone(note.freq, now + note.beat * beatDuration, note.dur * beatDuration, 'square', this._bgmGain);
      }
      totalBeats = Math.max(totalBeats, note.beat + note.dur);
    }

    // 播放低音（三角波）
    for (const note of track.bass) {
      if (note.freq > 0) {
        this._playTone(note.freq, now + note.beat * beatDuration, note.dur * beatDuration, 'triangle', this._bgmGain);
      }
    }

    // Boss 曲目有额外的和声声部（锯齿波）
    if (track.harmony) {
      for (const note of track.harmony) {
        if (note.freq > 0) {
          this._playTone(note.freq, now + note.beat * beatDuration, note.dur * beatDuration, 'sawtooth', this._bgmGain);
        }
      }
    }

    const loopDuration = totalBeats * beatDuration * 1000;
    this._bgmTimer = setTimeout(() => this._scheduleBGMLoop(), loopDuration - 50);
  }

  // ===== 曲目数据 =====

  /**
   * 曲目 1：经典战斗（C 大调，优化现有旋律，增加切分节奏）
   */
  _createTrackNormal() {
    const E4 = 329.63, G4 = 392.00, A4 = 440.00, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46;
    const G5 = 783.99, A5 = 880.00;

    const melody = [
      // 第1-2小节：上行开场（加入切分）
      { freq: E4, beat: 0, dur: 0.5 },
      { freq: G4, beat: 0.5, dur: 0.25 },
      { freq: 0, beat: 0.75, dur: 0.25 },
      { freq: A4, beat: 1, dur: 0.5 },
      { freq: C5, beat: 1.5, dur: 0.5 },
      { freq: D5, beat: 2, dur: 0.75 },
      { freq: 0, beat: 2.75, dur: 0.25 },
      { freq: C5, beat: 3, dur: 1 },

      // 第3-4小节：呼应（节奏变化）
      { freq: E4, beat: 4, dur: 0.25 },
      { freq: G4, beat: 4.25, dur: 0.25 },
      { freq: A4, beat: 4.5, dur: 0.5 },
      { freq: 0, beat: 5, dur: 0.25 },
      { freq: B4, beat: 5.25, dur: 0.75 },
      { freq: C5, beat: 6, dur: 1 },
      { freq: A4, beat: 7, dur: 1 },

      // 第5-6小节：高潮（短促有力）
      { freq: E5, beat: 8, dur: 0.25 },
      { freq: E5, beat: 8.25, dur: 0.25 },
      { freq: D5, beat: 8.5, dur: 0.5 },
      { freq: C5, beat: 9, dur: 0.25 },
      { freq: D5, beat: 9.25, dur: 0.25 },
      { freq: E5, beat: 9.5, dur: 0.5 },
      { freq: G5, beat: 10, dur: 1 },
      { freq: G5, beat: 11, dur: 1 },

      // 第7-8小节：回落收尾
      { freq: A5, beat: 12, dur: 0.5 },
      { freq: G5, beat: 12.5, dur: 0.5 },
      { freq: E5, beat: 13, dur: 0.5 },
      { freq: D5, beat: 13.5, dur: 0.5 },
      { freq: C5, beat: 14, dur: 0.75 },
      { freq: 0, beat: 14.75, dur: 0.25 },
      { freq: C5, beat: 15, dur: 1 },
    ];

    const bass = [
      { freq: 130.81, beat: 0, dur: 0.75 },
      { freq: 130.81, beat: 0.75, dur: 0.25 },
      { freq: 196.00, beat: 1, dur: 1 },
      { freq: 196.00, beat: 2, dur: 1 },
      { freq: 130.81, beat: 3, dur: 1 },

      { freq: 110.00, beat: 4, dur: 0.75 },
      { freq: 220.00, beat: 4.75, dur: 0.25 },
      { freq: 164.81, beat: 5, dur: 1 },
      { freq: 164.81, beat: 6, dur: 1 },
      { freq: 110.00, beat: 7, dur: 1 },

      { freq: 130.81, beat: 8, dur: 0.75 },
      { freq: 130.81, beat: 8.75, dur: 0.25 },
      { freq: 174.61, beat: 9, dur: 1 },
      { freq: 196.00, beat: 10, dur: 1 },
      { freq: 196.00, beat: 11, dur: 1 },

      { freq: 110.00, beat: 12, dur: 0.75 },
      { freq: 220.00, beat: 12.75, dur: 0.25 },
      { freq: 130.81, beat: 13, dur: 1 },
      { freq: 130.81, beat: 14, dur: 1 },
      { freq: 130.81, beat: 15, dur: 1 },
    ];

    return { melody, bass };
  }

  /**
   * 曲目 2：激烈战斗（A 小调，快节奏十六分音符跑动）
   */
  _createTrackIntense() {
    const A3 = 220.00, B3 = 246.94, C4 = 261.63, D4 = 293.66, E4 = 329.63;
    const F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46;
    const G5 = 783.99, A5 = 880.00;

    const melody = [
      // 第1-2小节：紧张上行（十六分音符跑动）
      { freq: A4, beat: 0, dur: 0.25 },
      { freq: C5, beat: 0.25, dur: 0.25 },
      { freq: D5, beat: 0.5, dur: 0.25 },
      { freq: E5, beat: 0.75, dur: 0.5 },
      { freq: F5, beat: 1.25, dur: 0.25 },
      { freq: E5, beat: 1.5, dur: 0.25 },
      { freq: D5, beat: 1.75, dur: 0.25 },
      { freq: C5, beat: 2, dur: 0.5 },
      { freq: A4, beat: 2.5, dur: 0.5 },
      { freq: B4, beat: 3, dur: 0.5 },
      { freq: A4, beat: 3.5, dur: 0.5 },

      // 第3-4小节：急促重复（动机发展）
      { freq: E5, beat: 4, dur: 0.25 },
      { freq: D5, beat: 4.25, dur: 0.25 },
      { freq: C5, beat: 4.5, dur: 0.5 },
      { freq: B4, beat: 5, dur: 0.25 },
      { freq: A4, beat: 5.25, dur: 0.25 },
      { freq: G4, beat: 5.5, dur: 0.5 },
      { freq: A4, beat: 6, dur: 0.75 },
      { freq: 0, beat: 6.75, dur: 0.25 },
      { freq: E4, beat: 7, dur: 0.5 },
      { freq: A4, beat: 7.5, dur: 0.5 },

      // 第5-6小节：高潮爆发
      { freq: A5, beat: 8, dur: 0.25 },
      { freq: G5, beat: 8.25, dur: 0.25 },
      { freq: F5, beat: 8.5, dur: 0.25 },
      { freq: E5, beat: 8.75, dur: 0.5 },
      { freq: D5, beat: 9.25, dur: 0.25 },
      { freq: E5, beat: 9.5, dur: 0.25 },
      { freq: F5, beat: 9.75, dur: 0.25 },
      { freq: E5, beat: 10, dur: 0.5 },
      { freq: C5, beat: 10.5, dur: 0.5 },
      { freq: D5, beat: 11, dur: 1 },

      // 第7-8小节：紧张回落
      { freq: E5, beat: 12, dur: 0.25 },
      { freq: D5, beat: 12.25, dur: 0.25 },
      { freq: C5, beat: 12.5, dur: 0.5 },
      { freq: B4, beat: 13, dur: 0.5 },
      { freq: A4, beat: 13.5, dur: 0.5 },
      { freq: G4, beat: 14, dur: 0.5 },
      { freq: A4, beat: 14.5, dur: 0.5 },
      { freq: A4, beat: 15, dur: 1 },
    ];

    const bass = [
      // A 小调和声进行：Am - F - C - G
      { freq: 110.00, beat: 0, dur: 0.5 },
      { freq: 110.00, beat: 0.5, dur: 0.5 },
      { freq: 87.31, beat: 1, dur: 1 },
      { freq: 110.00, beat: 2, dur: 0.5 },
      { freq: 110.00, beat: 2.5, dur: 0.5 },
      { freq: 98.00, beat: 3, dur: 1 },

      { freq: 87.31, beat: 4, dur: 0.5 },
      { freq: 87.31, beat: 4.5, dur: 0.5 },
      { freq: 65.41, beat: 5, dur: 1 },
      { freq: 87.31, beat: 6, dur: 0.5 },
      { freq: 87.31, beat: 6.5, dur: 0.5 },
      { freq: 98.00, beat: 7, dur: 1 },

      { freq: 110.00, beat: 8, dur: 0.5 },
      { freq: 110.00, beat: 8.5, dur: 0.5 },
      { freq: 130.81, beat: 9, dur: 1 },
      { freq: 110.00, beat: 10, dur: 0.5 },
      { freq: 110.00, beat: 10.5, dur: 0.5 },
      { freq: 98.00, beat: 11, dur: 1 },

      { freq: 87.31, beat: 12, dur: 0.5 },
      { freq: 87.31, beat: 12.5, dur: 0.5 },
      { freq: 65.41, beat: 13, dur: 1 },
      { freq: 110.00, beat: 14, dur: 1 },
      { freq: 110.00, beat: 15, dur: 1 },
    ];

    return { melody, bass };
  }

  /**
   * 曲目 3：Boss 战（E 小调，重低音 + 锯齿波和声，压迫感）
   */
  _createTrackBoss() {
    const E3 = 164.81, F3 = 174.61, G3 = 196.00, A3 = 220.00, B3 = 246.94;
    const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00;
    const A4 = 440.00, B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25;
    const F5 = 698.46, G5 = 783.99;

    const melody = [
      // 第1-2小节：威严下行（八度跳跃）
      { freq: B4, beat: 0, dur: 0.5 },
      { freq: 0, beat: 0.5, dur: 0.25 },
      { freq: B4, beat: 0.75, dur: 0.25 },
      { freq: A4, beat: 1, dur: 0.5 },
      { freq: G4, beat: 1.5, dur: 0.5 },
      { freq: F4, beat: 2, dur: 0.5 },
      { freq: E4, beat: 2.5, dur: 0.5 },
      { freq: 0, beat: 3, dur: 0.25 },
      { freq: E4, beat: 3.25, dur: 0.75 },

      // 第3-4小节：紧张上升
      { freq: F4, beat: 4, dur: 0.25 },
      { freq: G4, beat: 4.25, dur: 0.25 },
      { freq: A4, beat: 4.5, dur: 0.5 },
      { freq: B4, beat: 5, dur: 0.5 },
      { freq: C5, beat: 5.5, dur: 0.5 },
      { freq: B4, beat: 6, dur: 0.5 },
      { freq: A4, beat: 6.5, dur: 0.5 },
      { freq: G4, beat: 7, dur: 1 },

      // 第5-6小节：压迫高潮
      { freq: E5, beat: 8, dur: 0.5 },
      { freq: D5, beat: 8.5, dur: 0.5 },
      { freq: C5, beat: 9, dur: 0.5 },
      { freq: B4, beat: 9.5, dur: 0.5 },
      { freq: E5, beat: 10, dur: 0.75 },
      { freq: 0, beat: 10.75, dur: 0.25 },
      { freq: F5, beat: 11, dur: 0.5 },
      { freq: E5, beat: 11.5, dur: 0.5 },

      // 第7-8小节：低沉收束
      { freq: D5, beat: 12, dur: 0.5 },
      { freq: C5, beat: 12.5, dur: 0.5 },
      { freq: B4, beat: 13, dur: 0.75 },
      { freq: A4, beat: 13.75, dur: 0.25 },
      { freq: G4, beat: 14, dur: 0.5 },
      { freq: F4, beat: 14.5, dur: 0.5 },
      { freq: E4, beat: 15, dur: 1 },
    ];

    // 低音：E 小调强力根音进行
    const bass = [
      { freq: 82.41, beat: 0, dur: 1 },   // E2
      { freq: 82.41, beat: 1, dur: 1 },   // E2
      { freq: 110.00, beat: 2, dur: 1 },  // A2
      { freq: 110.00, beat: 3, dur: 1 },  // A2

      { freq: 87.31, beat: 4, dur: 1 },   // F2
      { freq: 87.31, beat: 5, dur: 1 },   // F2
      { freq: 98.00, beat: 6, dur: 1 },   // G2
      { freq: 98.00, beat: 7, dur: 1 },   // G2

      { freq: 82.41, beat: 8, dur: 1 },   // E2
      { freq: 82.41, beat: 9, dur: 1 },   // E2
      { freq: 87.31, beat: 10, dur: 1 },  // F2
      { freq: 98.00, beat: 11, dur: 1 },  // G2

      { freq: 82.41, beat: 12, dur: 1 },  // E2
      { freq: 110.00, beat: 13, dur: 1 }, // A2
      { freq: 98.00, beat: 14, dur: 1 },  // G2
      { freq: 82.41, beat: 15, dur: 1 },  // E2
    ];

    // 和声层：锯齿波铺底，增强压迫感
    const harmony = [
      { freq: 164.81, beat: 0, dur: 2 },  // E3
      { freq: 220.00, beat: 2, dur: 2 },  // A3
      { freq: 174.61, beat: 4, dur: 2 },  // F3
      { freq: 196.00, beat: 6, dur: 2 },  // G3

      { freq: 164.81, beat: 8, dur: 2 },  // E3
      { freq: 174.61, beat: 10, dur: 1 }, // F3
      { freq: 196.00, beat: 11, dur: 1 }, // G3

      { freq: 164.81, beat: 12, dur: 1 }, // E3
      { freq: 220.00, beat: 13, dur: 1 }, // A3
      { freq: 196.00, beat: 14, dur: 1 }, // G3
      { freq: 164.81, beat: 15, dur: 1 }, // E3
    ];

    return { melody, bass, harmony };
  }

  /**
   * 播放单个音调
   */
  _playTone(freq, startTime, duration, type, gainNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    // 不同波形的音量包络
    const peakGain = type === 'square' ? 0.08 : type === 'sawtooth' ? 0.04 : 0.15;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    gain.gain.setValueAtTime(peakGain, startTime + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(gainNode);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // ===== 音效 =====

  /**
   * 播放敌方坦克被击毁音效（短促明亮，白噪声 + 中频衰减）
   */
  playEnemyExplosion() {
    if (!this._initialized || !this.sfxEnabled) return;

    const now = this.ctx.currentTime;
    const duration = AUDIO_EXPLOSION_DURATION;

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

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.7;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + duration * 0.6);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * 播放玩家被击毁音效（低沉厚重，长时间轰鸣）
   */
  playPlayerExplosion() {
    if (!this._initialized || !this.sfxEnabled) return;

    const now = this.ctx.currentTime;
    const duration = AUDIO_EXPLOSION_DURATION * 2;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
    noiseGain.gain.setValueAtTime(this.sfxVolume * 0.6, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);
    filter.Q.value = 1.0;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + duration);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    const delay = 0.15;
    osc2.frequency.setValueAtTime(80, now + delay);
    osc2.frequency.exponentialRampToValueAtTime(15, now + delay + duration * 0.5);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.001, now);
    osc2Gain.gain.setValueAtTime(this.sfxVolume * 0.3, now + delay);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration * 0.5);

    osc2.connect(osc2Gain);
    osc2Gain.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + delay + duration * 0.5);
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
