import { useRef, useCallback } from "react";

type MusicTheme = "blue-forest" | "quantum" | "so-high";

interface AmbientConfig {
  baseFrequency: number;
  harmonics: number[];
  lfoFrequency: number;
  filterFrequency: number;
  attack: number;
  release: number;
}

const THEME_CONFIGS: Record<MusicTheme, AmbientConfig> = {
  "blue-forest": {
    baseFrequency: 110, // A2 - deep forest drone
    harmonics: [1, 1.5, 2, 3, 4],
    lfoFrequency: 0.1,
    filterFrequency: 800,
    attack: 2,
    release: 3,
  },
  "quantum": {
    baseFrequency: 146.83, // D3 - mysterious quantum
    harmonics: [1, 1.414, 2, 2.828, 4],
    lfoFrequency: 0.05,
    filterFrequency: 1200,
    attack: 1.5,
    release: 2.5,
  },
  "so-high": {
    baseFrequency: 174.61, // F3 - ethereal floating
    harmonics: [1, 1.25, 1.5, 2, 2.5, 3],
    lfoFrequency: 0.08,
    filterFrequency: 1500,
    attack: 3,
    release: 4,
  },
};

export function useAmbientTones() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const stopTones = useCallback(() => {
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    oscillatorsRef.current = [];

    if (lfoRef.current) {
      try {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
      } catch (e) {
        // Already stopped
      }
      lfoRef.current = null;
    }

    if (filterRef.current) {
      filterRef.current.disconnect();
      filterRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  }, []);

  const startTones = useCallback((theme: MusicTheme, volume: number) => {
    console.log(`[useAmbientTones] Starting tones for theme: ${theme} with volume: ${volume}`);
    
    // Stop any existing tones
    stopTones();

    // Create or resume audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      console.log(`[useAmbientTones] Created new AudioContext`);
    }

    const ctx = audioContextRef.current;
    console.log(`[useAmbientTones] AudioContext state: ${ctx.state}`);
    
    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        console.log(`[useAmbientTones] AudioContext resumed, new state: ${ctx.state}`);
      });
    }

    const config = THEME_CONFIGS[theme];
    console.log(`[useAmbientTones] Using config:`, config);

    // Create analyser for waveform visualization
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;

    // Create master gain - use higher base volume for synthesis
    const masterGain = ctx.createGain();
    const targetVolume = Math.max(volume * 0.5, 0.15); // Minimum 15% to ensure audibility
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + config.attack);
    masterGain.connect(analyser);
    gainNodeRef.current = masterGain;
    console.log(`[useAmbientTones] Master gain target: ${targetVolume}`);

    // Create filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(config.filterFrequency, ctx.currentTime);
    filter.Q.setValueAtTime(1, ctx.currentTime);
    filter.connect(masterGain);
    filterRef.current = filter;

    // Create LFO for subtle movement
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(config.lfoFrequency, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(50, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    lfoRef.current = lfo;

    // Create harmonics
    const oscillators: OscillatorNode[] = [];
    config.harmonics.forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(config.baseFrequency * harmonic, ctx.currentTime);

      // Add slight detuning for richness
      osc.detune.setValueAtTime((Math.random() - 0.5) * 10, ctx.currentTime);

      const oscGain = ctx.createGain();
      // Decrease volume for higher harmonics
      oscGain.gain.setValueAtTime(1 / (index + 1) / config.harmonics.length, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();

      oscillators.push(osc);
    });

    oscillatorsRef.current = oscillators;
    console.log(`[useAmbientTones] Created ${oscillators.length} oscillators`);

    return true;
  }, [stopTones]);

  const setVolume = useCallback((volume: number) => {
    if (gainNodeRef.current && audioContextRef.current) {
      const targetVolume = Math.max(volume * 0.5, 0.15);
      gainNodeRef.current.gain.linearRampToValueAtTime(
        targetVolume,
        audioContextRef.current.currentTime + 0.1
      );
      console.log(`[useAmbientTones] Volume updated to: ${targetVolume}`);
    }
  }, []);

  const cleanup = useCallback(() => {
    stopTones();
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [stopTones]);

  const getAnalyser = useCallback(() => {
    return analyserRef.current;
  }, []);

  return {
    startTones,
    stopTones,
    setVolume,
    cleanup,
    getAnalyser,
  };
}
