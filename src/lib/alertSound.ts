// Web Audio API-based alert sounds
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

type AlertSeverity = 'warning' | 'critical';
type CompletionType = 'success' | 'partial' | 'failure';

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
  if (!audioContext) return;
  
  // Resume audio context if suspended (required by browsers after user interaction)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  // Fade in/out for smoother sound
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

export const playAlertSound = (severity: AlertSeverity = 'warning') => {
  if (!audioContext) return;

  if (severity === 'critical') {
    // Critical: Urgent two-tone siren (higher pitch, repeated)
    playTone(880, 0.15, 'square'); // A5
    setTimeout(() => playTone(660, 0.15, 'square'), 150); // E5
    setTimeout(() => playTone(880, 0.15, 'square'), 300);
    setTimeout(() => playTone(660, 0.15, 'square'), 450);
  } else {
    // Warning: Softer single chime
    playTone(523, 0.2, 'sine'); // C5
    setTimeout(() => playTone(659, 0.3, 'sine'), 150); // E5
  }
};

export const playCompletionSound = (type: CompletionType = 'success') => {
  if (!audioContext) return;

  if (type === 'success') {
    // Success: Pleasant ascending chime
    playTone(523, 0.15, 'sine', 0.25); // C5
    setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 100); // E5
    setTimeout(() => playTone(784, 0.25, 'sine', 0.25), 200); // G5
  } else if (type === 'partial') {
    // Partial: Neutral two-tone
    playTone(523, 0.15, 'sine', 0.2); // C5
    setTimeout(() => playTone(587, 0.2, 'sine', 0.2), 120); // D5
  } else {
    // Failure: Descending minor tone
    playTone(659, 0.15, 'sine', 0.25); // E5
    setTimeout(() => playTone(523, 0.2, 'sine', 0.25), 120); // C5
    setTimeout(() => playTone(392, 0.25, 'sine', 0.25), 240); // G4
  }
};

// Pre-warm the audio context on first user interaction
export const initAudioContext = () => {
  if (audioContext?.state === 'suspended') {
    audioContext.resume();
  }
};
