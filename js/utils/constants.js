// 游戏常量配置

// 帧率基准配置
export const TARGET_FPS = 60;
export const TARGET_FRAME_TIME = 1000 / TARGET_FPS; // ~16.67ms
export const BENCHMARK_DURATION = 500; // 基准测试持续毫秒数
export let SPEED_SCALE = 1.0; // 由基准测试计算赋值

// 画布配置
export const CANVAS_WIDTH = 680;
export const CANVAS_HEIGHT = 680;
export const GRID_SIZE = 40; // 17x17格子
export const GRID_COUNT = 17;

// 方向常量
export const DIRECTION = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

// 实体尺寸
export const TANK_SIZE = 36;
export const BULLET_SIZE = 8;
export const PARTICLE_SIZE = 4;

// 速度配置
export const PLAYER_SPEED = 2;
export const ENEMY_SPEED = 1.5;
export const FAST_ENEMY_SPEED = 3;
export const BULLET_SPEED = 4;

// 冷却配置（帧数）
export const PLAYER_COOLDOWN = 30;
export const ENEMY_COOLDOWN = 90;

// AI配置
export const ENEMY_AI_UPDATE_INTERVAL = 60; // 每60帧重决策一次

// 颜色配置
export const COLORS = {
  PLAYER: '#0088FF',
  PLAYER_TREAD: '#0055AA',
  ENEMY: '#FF0000',
  ENEMY_TREAD: '#AA0000',
  HEAVY_ENEMY: '#00CC00',
  HEAVY_ENEMY_TREAD: '#008800',
  FAST_ENEMY: '#FF69B4',
  FAST_ENEMY_TREAD: '#C71585',
  BULLET: '#FFFF00',
  BRICK: '#FF8C00',
  STEEL: '#808080',
  BASE: '#4169E1',
  RIVER: '#1E90FF',
  FOREST: '#228B22',
  BACKGROUND: '#000000',
  TEXT: '#FFFFFF',
  POWERUP_SPEED: '#00FF00',
  POWERUP_FIRERATE: '#FF4500',
  POWERUP_SHIELD: '#00BFFF'
};

// 游戏配置
export const SPAWN_INTERVAL_INITIAL = 3000; // 初始3秒
export const SPAWN_INTERVAL_MIN = 1000; // 最快1秒
export const SCORE_PER_ENEMY = 100;
export const SCORE_PER_HEAVY = 200;
export const SCORE_PER_FAST = 150;
export const HEAVY_ENEMY_CHANCE = 0.3; // 30%概率生成重装敌人
export const FAST_ENEMY_CHANCE = 0.2; // 20%概率生成快速敌人

// 敌人生成点（格子坐标）
export const SPAWN_POINTS = [
  { x: 0, y: 0 },      // 左上
  { x: 8, y: 0 },      // 中上
  { x: 16, y: 0 }      // 右上
];

// 地图生成配置
export const BRICK_DENSITY = 0.3; // 砖块密度30%
export const STEEL_DENSITY = 0.05; // 钢块密度5%
export const RIVER_DENSITY = 0.08; // 河流密度8%
export const FOREST_DENSITY = 0.1; // 森林密度10%

// 道具配置
export const POWERUP_SIZE = 32;                          // 道具尺寸
export const POWERUP_TYPES = ['speed', 'fireRate', 'shield']; // 道具类型
export const POWERUP_SPAWN_INTERVAL = 8000;              // 道具生成间隔（毫秒）
export const POWERUP_LIFETIME = 45000;                   // 道具存在时间（毫秒）
export const POWERUP_MAX_COUNT = 3;                      // 同时存在的最大道具数
export const POWERUP_EFFECT_DURATION = 45000;            // 道具效果持续时间（毫秒）
export const POWERUP_BLINK_START = 5000;                 // 消失前闪烁开始时间（毫秒）

// 音频配置
export const AUDIO_BGM_BPM = 160; // 背景音乐节拍速度
export const AUDIO_BGM_VOLUME = 0.5; // 背景音乐音量 (0-1)
export const AUDIO_SFX_VOLUME = 0.6; // 音效音量 (0-1)
export const AUDIO_EXPLOSION_DURATION = 0.4; // 爆炸音效持续时间（秒）
