export class AudioManager {
  private context: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize AudioContext on first user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported');
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private async ensureAudioContext() {
    if (!this.context) {
      this.initializeAudioContext();
    }

    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  async playNotificationSound(frequency: number = 800, duration: number = 200) {
    if (!this.enabled || !this.context) return;

    try {
      await this.ensureAudioContext();
      
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.context!.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.context!.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, this.context!.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.context!.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context!.currentTime + duration / 1000);
      
      oscillator.start(this.context!.currentTime);
      oscillator.stop(this.context!.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  async playSessionComplete() {
    // Play a pleasant completion sound sequence
    await this.playNotificationSound(523, 150); // C5
    setTimeout(() => this.playNotificationSound(659, 150), 150); // E5
    setTimeout(() => this.playNotificationSound(784, 300), 300); // G5
  }

  async playBreakStart() {
    // Play a gentle break notification
    await this.playNotificationSound(440, 200); // A4
    setTimeout(() => this.playNotificationSound(349, 200), 200); // F4
  }

  async playTick() {
    if (!this.enabled) return;
    await this.playNotificationSound(800, 50);
  }
}

export const audioManager = new AudioManager();
