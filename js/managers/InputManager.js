// 输入管理器
export class InputManager {
  constructor() {
    this.keys = new Set();
    this.onEscToggle = null;
    this.init();
  }

  /**
   * 初始化事件监听
   */
  init() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      // 防止方向键和 ESC 滚动页面
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }
      // ESC 暂停/恢复回调
      if (e.code === 'Escape' && this.onEscToggle) {
        this.onEscToggle();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  /**
   * 检查按键是否按下
   */
  isPressed(code) {
    return this.keys.has(code);
  }

  /**
   * 清空所有按键
   */
  clear() {
    this.keys.clear();
  }
}
