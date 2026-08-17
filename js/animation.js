export class AnimationEngine {
  constructor(canvasId) {
    this.canvasId = canvasId;
  }

  triggerConfetti() {
    if (typeof confetti === 'function') {
      // Kanone links unten
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { x: 0.1, y: 1 },
        angle: 60,
        colors: ['#D4AF37', '#F4E8C1', '#FFFFFF']
      });
      
      // Kanone rechts unten
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { x: 0.9, y: 1 },
        angle: 120,
        colors: ['#D4AF37', '#F4E8C1', '#FFFFFF']
      });
    }
  }
}
