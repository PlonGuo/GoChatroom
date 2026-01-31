/**
 * Sound Service for playing audio notifications
 */

type SoundType = 'messageSend' | 'ringtone';

interface SoundConfig {
  src: string;
  loop: boolean;
  volume: number;
}

const soundConfigs: Record<SoundType, SoundConfig> = {
  messageSend: {
    src: '/sounds/message-send.mp3',
    loop: false,
    volume: 0.5,
  },
  ringtone: {
    src: '/sounds/ringtone.mp3',
    loop: true,
    volume: 0.7,
  },
};

class SoundService {
  private audioElements: Map<SoundType, HTMLAudioElement> = new Map();
  private isInitialized = false;

  /**
   * Initialize audio elements (call after user interaction to comply with browser autoplay policies)
   */
  init() {
    if (this.isInitialized) return;

    Object.entries(soundConfigs).forEach(([type, config]) => {
      const audio = new Audio(config.src);
      audio.loop = config.loop;
      audio.volume = config.volume;
      audio.preload = 'auto';
      this.audioElements.set(type as SoundType, audio);
    });

    this.isInitialized = true;
    console.log('[SoundService] Initialized');
  }

  /**
   * Play a sound
   */
  play(type: SoundType) {
    if (!this.isInitialized) {
      this.init();
    }

    const audio = this.audioElements.get(type);
    if (!audio) {
      console.warn(`[SoundService] Sound not found: ${type}`);
      return;
    }

    // Reset to start if not looping
    if (!audio.loop) {
      audio.currentTime = 0;
    }

    audio.play().catch((error) => {
      // Autoplay may be blocked by browser policy
      console.warn(`[SoundService] Failed to play ${type}:`, error.message);
    });
  }

  /**
   * Stop a sound
   */
  stop(type: SoundType) {
    const audio = this.audioElements.get(type);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    this.audioElements.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Play message send sound
   */
  playMessageSend() {
    this.play('messageSend');
  }

  /**
   * Start playing ringtone (loops until stopped)
   */
  startRingtone() {
    this.play('ringtone');
  }

  /**
   * Stop ringtone
   */
  stopRingtone() {
    this.stop('ringtone');
  }

  /**
   * Set volume for a sound type (0.0 to 1.0)
   */
  setVolume(type: SoundType, volume: number) {
    const audio = this.audioElements.get(type);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

export const soundService = new SoundService();
