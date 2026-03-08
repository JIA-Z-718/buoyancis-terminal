import { useRef, useCallback, useEffect } from "react";

/**
 * Gravitational wave sound effect using Web Audio API
 * Creates a low-frequency oscillating "chirp" that mimics gravitational waves
 */
export function useGravitationalWaveSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillator1Ref = useRef<OscillatorNode | null>(null);
  const oscillator2Ref = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const isPlayingRef = useRef(false);

  const startSound = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    // Create or resume audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Master gain for volume control
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // Low-pass filter for that deep space feel
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.Q.setValueAtTime(2, ctx.currentTime);
    filter.connect(masterGain);
    filterRef.current = filter;

    // Primary low-frequency oscillator (the "rumble")
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(35, ctx.currentTime); // Very low frequency
    
    const osc1Gain = ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.6, ctx.currentTime);
    osc1.connect(osc1Gain);
    osc1Gain.connect(filter);
    osc1.start();
    oscillator1Ref.current = osc1;

    // Secondary oscillator for harmonic (slightly higher)
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(70, ctx.currentTime); // Harmonic
    
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    osc2.start();
    oscillator2Ref.current = osc2;

    // LFO for the "wave" modulation (chirp-like wobble)
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.3, ctx.currentTime); // Slow wobble
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(8, ctx.currentTime); // Modulation depth
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);
    lfo.start();
    lfoRef.current = lfo;

    // Animate the chirp - gradually increase frequency
    const chirpDuration = 4;
    osc1.frequency.linearRampToValueAtTime(55, ctx.currentTime + chirpDuration);
    osc2.frequency.linearRampToValueAtTime(110, ctx.currentTime + chirpDuration);
    lfo.frequency.linearRampToValueAtTime(0.8, ctx.currentTime + chirpDuration);
    filter.frequency.linearRampToValueAtTime(350, ctx.currentTime + chirpDuration);
  }, []);

  const stopSound = useCallback(() => {
    if (!isPlayingRef.current || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    
    // Fade out smoothly
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }

    // Stop oscillators after fade
    setTimeout(() => {
      try {
        oscillator1Ref.current?.stop();
        oscillator1Ref.current?.disconnect();
      } catch (e) { /* already stopped */ }
      
      try {
        oscillator2Ref.current?.stop();
        oscillator2Ref.current?.disconnect();
      } catch (e) { /* already stopped */ }
      
      try {
        lfoRef.current?.stop();
        lfoRef.current?.disconnect();
      } catch (e) { /* already stopped */ }
      
      filterRef.current?.disconnect();
      gainNodeRef.current?.disconnect();

      oscillator1Ref.current = null;
      oscillator2Ref.current = null;
      lfoRef.current = null;
      filterRef.current = null;
      gainNodeRef.current = null;
      isPlayingRef.current = false;
    }, 600);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stopSound]);

  return { startSound, stopSound };
}
