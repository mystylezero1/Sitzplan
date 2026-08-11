export class AnimationEngine {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this._confettiLoaded = false;
  }

  async _ensureConfetti() {
    if (this._confettiLoaded) return;
    if (typeof window.confetti === 'function') {
      this._confettiLoaded = true;
      return;
    }
    // Lazy load confetti from CDN
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      s.onload = () => { this._confettiLoaded = true; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async triggerConfetti() {
    try {
      await this._ensureConfetti();
      if (typeof window.confetti === 'function') {
        window.confetti({
          particleCount: 140,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#F4E8C1', '#FFFFFF']
        });
      }
    } catch (e) {
      // Fail silently — confetti ist nice-to-have
      // console.warn('Confetti konnte nicht geladen werden', e);
    }
  }
}