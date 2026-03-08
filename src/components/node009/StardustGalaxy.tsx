import React, { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { PhotoUploadModal, type MemoryPhoto } from "./PhotoInjectionSystem";
import { MemoryStar, MemoryViewer } from "./MemoryStarSystem";
import { useMemoryPhotos } from "@/hooks/useMemoryPhotos";
import { useGravitationalWaveSound } from "@/hooks/useGravitationalWaveSound";
import { CoreMemoryPhoto, ConfuciusQuoteOverlay, FamilyTreeLabelsOverlay } from "./CoreMemoryPhoto";

const PARTICLE_COUNT = 5000;
const SPREAD = 15;

// Calculate days since Aug 24, 1971
const calculateDaysSince1971 = (): number => {
  const birthDate = new Date(1971, 7, 24); // Aug 24, 1971
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

interface GuardianData {
  id: string;
  name: string;
  nameCn: string;
  quote: string;
  quoteCn: string;
  calligraphyQuote?: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitOffset: number;
}

const guardians: GuardianData[] = [
  {
    id: "laozi",
    name: "Laozi",
    nameCn: "老子",
    quote: "The Tao that can be told is not the eternal Tao.",
    quoteCn: "道可道，非常道。",
    calligraphyQuote: "大音希聲，大象無形。",
    color: "#88ccff",
    orbitRadius: 4,
    orbitSpeed: 0.15,
    orbitOffset: 0,
  },
  {
    id: "confucius",
    name: "Confucius",
    nameCn: "孔子",
    quote: "One must know the age of one's parents.",
    quoteCn: "父母之年，不可不知也。一則以喜，一則以懼。",
    calligraphyQuote: "父母之年，不可不知也。一則以喜，一則以懼。",
    color: "#fff8e7",
    orbitRadius: 4,
    orbitSpeed: 0.15,
    orbitOffset: Math.PI, // Opposite to Laozi (Yin-Yang balance)
  },
  {
    id: "likashing",
    name: "Li Ka-shing",
    nameCn: "李嘉誠",
    quote: "Sustaining a legacy is harder than building it.",
    quoteCn: "發揮品牌效應，守業更比創業難。",
    calligraphyQuote: "發揮品牌效應，守業更比創業難。",
    color: "#d4a574", // Amber gold
    orbitRadius: 5,
    orbitSpeed: 0.08,
    orbitOffset: Math.PI * 0.5, // Positioned at 90 degrees
  },
  {
    id: "einstein",
    name: "Einstein",
    nameCn: "愛因斯坦",
    quote: "The distinction between past, present, and future is only a stubbornly persistent illusion.",
    quoteCn: "過去、現在與未來的區別，只是一種頑固的幻覺。",
    color: "#00d4ff", // Vibrant cyan-blue
    orbitRadius: 5.5,
    orbitSpeed: 0.08,
    orbitOffset: Math.PI * 1.25, // Positioned at 225 degrees
  },
  {
    id: "xi",
    name: "Xi Jinping",
    nameCn: "習近平",
    quote: "Roll up your sleeves and work hard.",
    quoteCn: "擼起袖子加油幹。",
    color: "#ff2020", // Brilliant red
    orbitRadius: 5.5,
    orbitSpeed: 0.05,
    orbitOffset: Math.PI * 0.5, // Positioned at highest point (top)
  },
];

// Om sound generator for Laozi
class OmSoundGenerator {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  start() {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = this.audioContext;

    // Main deep Om tone (around 60-80Hz)
    this.oscillator = ctx.createOscillator();
    this.oscillator.type = "sine";
    this.oscillator.frequency.setValueAtTime(65, ctx.currentTime); // Deep C2

    // LFO for subtle wavering
    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.setValueAtTime(0.3, ctx.currentTime);
    
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.setValueAtTime(3, ctx.currentTime);
    
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.oscillator.frequency);

    // Main gain
    this.gain = ctx.createGain();
    this.gain.gain.setValueAtTime(0, ctx.currentTime);
    this.gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5);

    // Add harmonics for richer sound
    const harmonic = ctx.createOscillator();
    harmonic.type = "sine";
    harmonic.frequency.setValueAtTime(130, ctx.currentTime); // C3
    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.015, ctx.currentTime);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(ctx.destination);
    harmonic.start();

    // Low-pass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(150, ctx.currentTime);

    this.oscillator.connect(filter);
    filter.connect(this.gain);
    this.gain.connect(ctx.destination);

    this.oscillator.start();
    this.lfo.start();
  }

  stop() {
    if (!this.audioContext || !this.gain) return;
    
    const ctx = this.audioContext;
    this.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    
    setTimeout(() => {
      if (this.oscillator) this.oscillator.stop();
      if (this.lfo) this.lfo.stop();
      if (this.audioContext) this.audioContext.close();
      this.audioContext = null;
      this.oscillator = null;
      this.gain = null;
      this.lfo = null;
    }, 600);
  }
}

const omSound = new OmSoundGenerator();

// Particle system component
interface ParticleFieldProps {
  converged: boolean;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
  slowdownFactor: number;
  orderMode: boolean; // Confucius Li/Order mode
  grandOrderMode: boolean; // Xi Grand Order mode - V formation
}

const ParticleField = ({ converged, mousePosition, slowdownFactor, orderMode, grandOrderMode }: ParticleFieldProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const grandOrderProgressRef = useRef(0);
  const progressRef = useRef(0);
  const timeRef = useRef(0);

  const { initialPositions, targetPositions, colors, sizes } = useMemo(() => {
    const initial = new Float32Array(PARTICLE_COUNT * 3);
    const target = new Float32Array(PARTICLE_COUNT * 3);
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    const szs = new Float32Array(PARTICLE_COUNT);

    const frameWidth = 3;
    const frameHeight = 4;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * SPREAD;

      initial[i3] = r * Math.sin(phi) * Math.cos(theta);
      initial[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      initial[i3 + 2] = (Math.random() - 0.5) * SPREAD * 0.5;

      const edgeChoice = Math.random();
      let tx, ty;
      
      if (edgeChoice < 0.25) {
        tx = (Math.random() - 0.5) * frameWidth;
        ty = frameHeight / 2;
      } else if (edgeChoice < 0.5) {
        tx = (Math.random() - 0.5) * frameWidth;
        ty = -frameHeight / 2;
      } else if (edgeChoice < 0.75) {
        tx = -frameWidth / 2;
        ty = (Math.random() - 0.5) * frameHeight;
      } else {
        tx = frameWidth / 2;
        ty = (Math.random() - 0.5) * frameHeight;
      }

      if (Math.random() > 0.7) {
        tx = (Math.random() - 0.5) * frameWidth * 0.8;
        ty = (Math.random() - 0.5) * frameHeight * 0.8;
      }

      target[i3] = tx;
      target[i3 + 1] = ty;
      target[i3 + 2] = 0;

      const hue = 0.08 + Math.random() * 0.1;
      const sat = 0.3 + Math.random() * 0.5;
      const light = 0.6 + Math.random() * 0.4;
      const color = new THREE.Color().setHSL(hue, sat, light);
      cols[i3] = color.r;
      cols[i3 + 1] = color.g;
      cols[i3 + 2] = color.b;

      szs[i] = 1 + Math.random() * 2;
    }

    return { initialPositions: initial, targetPositions: target, colors: cols, sizes: szs };
  }, []);

  const orderProgressRef = useRef(0);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    // Apply Wu Wei slowdown
    const adjustedDelta = delta * slowdownFactor;
    timeRef.current += adjustedDelta;
    const time = timeRef.current;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    const targetProgress = converged ? 1 : 0;
    progressRef.current += (targetProgress - progressRef.current) * adjustedDelta * 0.8;
    const progress = progressRef.current;

    // Order mode progress (Confucius Li)
    const targetOrderProgress = orderMode ? 1 : 0;
    orderProgressRef.current += (targetOrderProgress - orderProgressRef.current) * delta * 2;
    const orderProgress = orderProgressRef.current;

    const mouseInfluence = 0.5;
    const mx = mousePosition.current.x * 5;
    const my = mousePosition.current.y * 5;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      const ix = initialPositions[i3];
      const iy = initialPositions[i3 + 1];
      const iz = initialPositions[i3 + 2];

      const tx = targetPositions[i3];
      const ty = targetPositions[i3 + 1];
      const tz = targetPositions[i3 + 2];

      let x = ix + (tx - ix) * progress;
      let y = iy + (ty - iy) * progress;
      let z = iz + (tz - iz) * progress;

      if (progress < 0.9) {
        const driftSpeed = 0.3;
        x += Math.sin(time * driftSpeed + i * 0.01) * (1 - progress) * 0.5;
        y += Math.cos(time * driftSpeed * 0.7 + i * 0.02) * (1 - progress) * 0.5;
        z += Math.sin(time * driftSpeed * 0.5 + i * 0.015) * (1 - progress) * 0.3;
      }

      // Apply Li/Order effect - particles align into structured circular orbits
      if (orderProgress > 0.01) {
        const orbitIndex = i % 8; // 8 concentric orbits
        const orbitRadius = 2 + orbitIndex * 0.8;
        const particleAngle = (i / PARTICLE_COUNT) * Math.PI * 2 * 8 + time * 0.3;
        
        const orderedX = Math.cos(particleAngle) * orbitRadius;
        const orderedY = Math.sin(particleAngle) * orbitRadius;
        const orderedZ = 0;
        
        x = x + (orderedX - x) * orderProgress * 0.7;
        y = y + (orderedY - y) * orderProgress * 0.7;
        z = z + (orderedZ - z) * orderProgress * 0.5;
      }

      // Apply Grand Order effect (Xi) - massive V-formation pointing upward
      const targetGrandOrder = grandOrderMode ? 1 : 0;
      grandOrderProgressRef.current += (targetGrandOrder - grandOrderProgressRef.current) * delta * 4;
      const grandOrderProgress = grandOrderProgressRef.current;
      
      if (grandOrderProgress > 0.01) {
        // Create V-formation with apex at top
        const particleIndex = i / PARTICLE_COUNT;
        const side = particleIndex < 0.5 ? -1 : 1; // Left or right wing
        const wingPosition = (particleIndex % 0.5) * 2; // Position along wing (0-1)
        
        // V formation geometry
        const wingAngle = Math.PI / 6; // 30 degrees from vertical
        const wingLength = 8;
        const depth = wingPosition * wingLength;
        
        const vX = side * Math.sin(wingAngle) * depth;
        const vY = 4 - Math.cos(wingAngle) * depth; // Apex at top
        const vZ = (Math.random() - 0.5) * 0.2; // Slight depth variation
        
        // Also add some particles to concentric circles around center
        if (i % 5 === 0) {
          const circleRadius = 1 + (i % 4) * 1.2;
          const circleAngle = particleIndex * Math.PI * 2;
          const cX = Math.cos(circleAngle) * circleRadius;
          const cY = Math.sin(circleAngle) * circleRadius;
          x = x + (cX - x) * grandOrderProgress * 0.9;
          y = y + (cY - y) * grandOrderProgress * 0.9;
        } else {
          x = x + (vX - x) * grandOrderProgress * 0.95;
          y = y + (vY - y) * grandOrderProgress * 0.95;
        }
        z = z + (vZ - z) * grandOrderProgress * 0.8;
      }

      const dx = x - mx;
      const dy = y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repelRadius = 3;
      if (dist < repelRadius && dist > 0.01) {
        const force = (repelRadius - dist) / repelRadius * mouseInfluence * (1 - progress * 0.5) * (1 - orderProgress * 0.8);
        x += (dx / dist) * force;
        y += (dy / dist) * force;
      }

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={initialPositions.slice()}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          count={PARTICLE_COUNT}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Constellation line component
interface ConstellationLineProps {
  startPos: THREE.Vector3;
  visible: boolean;
}

const ConstellationLine = ({ startPos, visible }: ConstellationLineProps) => {
  const lineRef = useRef<any>(null);
  const opacityRef = useRef(0);

  useFrame((_, delta) => {
    const targetOpacity = visible ? 0.4 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 2;
    
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = opacityRef.current;
    }
  });

  const points = useMemo(() => [
    startPos,
    new THREE.Vector3(0, 0, 0) // Center
  ], [startPos]);

  return (
    <Line
      ref={lineRef}
      points={points}
      color="#d4af37"
      lineWidth={1}
      transparent
      opacity={0}
      dashed
      dashScale={3}
      dashSize={0.3}
      dashOffset={0}
    />
  );
};

// Bridge of Wisdom Line between Laozi and Confucius with pulsing energy flow
interface WisdomBridgeProps {
  laoziPos: React.MutableRefObject<THREE.Vector3>;
  confuciusPos: React.MutableRefObject<THREE.Vector3>;
  visible: boolean;
}

// Energy Pulse Particle traveling along the bridge
const EnergyPulse = ({ 
  start, 
  end, 
  delay, 
  speed,
  visible 
}: { 
  start: THREE.Vector3; 
  end: THREE.Vector3; 
  delay: number; 
  speed: number;
  visible: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(delay);
  const opacityRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Fade opacity based on visibility
    const targetOpacity = visible ? 1 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 5;

    // Advance progress
    progressRef.current += delta * speed;
    if (progressRef.current > 1) {
      progressRef.current = 0;
    }

    // Calculate position along the bridge
    const t = progressRef.current;
    const pos = new THREE.Vector3().lerpVectors(start, end, t);
    meshRef.current.position.copy(pos);
    
    if (glowRef.current) {
      glowRef.current.position.copy(pos);
    }

    // Pulsing scale effect
    const time = state.clock.elapsedTime;
    const pulseScale = 1 + Math.sin(time * 8 + delay * 10) * 0.3;
    meshRef.current.scale.setScalar(pulseScale);
    
    // Set opacity with fade at ends
    const edgeFade = Math.sin(t * Math.PI);
    const finalOpacity = opacityRef.current * edgeFade;
    
    if (meshRef.current.material) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = finalOpacity;
    }
    if (glowRef.current?.material) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = finalOpacity * 0.4;
    }
  });

  return (
    <group>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial 
          color="#88ccff"
          transparent 
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Core pulse */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial 
          color="#ffffff"
          transparent 
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

const WisdomBridge = ({ laoziPos, confuciusPos, visible }: WisdomBridgeProps) => {
  const lineRef = useRef<any>(null);
  const glowLineRef = useRef<any>(null);
  const opacityRef = useRef(0);
  const pulseIntensityRef = useRef(0);

  useFrame((state, delta) => {
    const targetOpacity = visible ? 0.6 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 3;
    
    // Pulsing intensity for the bridge glow
    const time = state.clock.elapsedTime;
    pulseIntensityRef.current = 0.3 + Math.sin(time * 3) * 0.2;
    
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = opacityRef.current;
    }
    
    if (glowLineRef.current?.material) {
      glowLineRef.current.material.opacity = opacityRef.current * pulseIntensityRef.current;
    }
  });

  // Generate pulse particles with staggered delays
  const pulseCount = 5;
  const pulses = useMemo(() => {
    return Array.from({ length: pulseCount }, (_, i) => ({
      id: i,
      delay: i / pulseCount,
      speed: 0.3 + Math.random() * 0.1,
      reverse: i % 2 === 1
    }));
  }, []);

  return (
    <group>
      {/* Base bridge line */}
      <Line
        ref={lineRef}
        points={[laoziPos.current, confuciusPos.current]}
        color="#aaddff"
        lineWidth={1.5}
        transparent
        opacity={0}
      />
      
      {/* Glowing outer line */}
      <Line
        ref={glowLineRef}
        points={[laoziPos.current, confuciusPos.current]}
        color="#66bbff"
        lineWidth={4}
        transparent
        opacity={0}
      />

      {/* Energy pulses traveling along the bridge */}
      {pulses.map((pulse) => (
        <EnergyPulse
          key={pulse.id}
          start={pulse.reverse ? confuciusPos.current : laoziPos.current}
          end={pulse.reverse ? laoziPos.current : confuciusPos.current}
          delay={pulse.delay}
          speed={pulse.speed}
          visible={visible}
        />
      ))}
    </group>
  );
};

// Yin-Yang Symbol Component - appears when both Laozi and Confucius are hovered
interface YinYangSymbolProps {
  visible: boolean;
}

const YinYangSymbol = ({ visible }: YinYangSymbolProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);
  const scaleRef = useRef(0);
  
  // Yin (dark) side refs
  const yinRef = useRef<THREE.Mesh>(null);
  const yinDotRef = useRef<THREE.Mesh>(null);
  
  // Yang (light) side refs
  const yangRef = useRef<THREE.Mesh>(null);
  const yangDotRef = useRef<THREE.Mesh>(null);
  
  // Outer ring ref
  const ringRef = useRef<THREE.Mesh>(null);
  
  // Glow refs
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Animate visibility
    const targetOpacity = visible ? 1 : 0;
    const targetScale = visible ? 1 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 4;
    scaleRef.current += (targetScale - scaleRef.current) * delta * 5;
    
    // Set group scale with bounce effect
    const bounceScale = scaleRef.current * (1 + Math.sin(time * 3) * 0.05);
    groupRef.current.scale.setScalar(bounceScale);
    
    // Gentle rotation
    groupRef.current.rotation.z = time * 0.3;
    
    // Pulsing glow
    if (innerGlowRef.current) {
      const pulseScale = 1.2 + Math.sin(time * 2) * 0.1;
      innerGlowRef.current.scale.setScalar(pulseScale);
      (innerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = opacityRef.current * 0.3;
    }
    
    if (outerGlowRef.current) {
      const outerPulse = 1.5 + Math.sin(time * 1.5) * 0.2;
      outerGlowRef.current.scale.setScalar(outerPulse);
      (outerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = opacityRef.current * 0.15;
    }
    
    // Update main shape opacities
    [yinRef, yangRef, yinDotRef, yangDotRef, ringRef].forEach(ref => {
      if (ref.current?.material) {
        (ref.current.material as THREE.MeshBasicMaterial).opacity = opacityRef.current;
      }
    });
  });

  // Create Yin-Yang geometry using curves
  const yinShape = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 1;
    
    // Outer arc (right half - dark)
    shape.absarc(0, 0, radius, Math.PI / 2, -Math.PI / 2, false);
    // Inner curve bottom (small arc going left)
    shape.absarc(0, -radius / 2, radius / 2, -Math.PI / 2, Math.PI / 2, false);
    // Inner curve top (small arc going right)
    shape.absarc(0, radius / 2, radius / 2, -Math.PI / 2, Math.PI / 2, true);
    
    return shape;
  }, []);

  const yangShape = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 1;
    
    // Outer arc (left half - light)
    shape.absarc(0, 0, radius, Math.PI / 2, -Math.PI / 2, true);
    // Inner curve bottom (small arc)
    shape.absarc(0, -radius / 2, radius / 2, Math.PI / 2, -Math.PI / 2, true);
    // Inner curve top (small arc)
    shape.absarc(0, radius / 2, radius / 2, Math.PI / 2, -Math.PI / 2, false);
    
    return shape;
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 2]}>
      {/* Outer ethereal glow */}
      <mesh ref={outerGlowRef}>
        <circleGeometry args={[1.8, 64]} />
        <meshBasicMaterial
          color="#aaddff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh ref={innerGlowRef}>
        <circleGeometry args={[1.3, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Yin (dark side) */}
      <mesh ref={yinRef}>
        <shapeGeometry args={[yinShape]} />
        <meshBasicMaterial
          color="#1a1a2e"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Yang (light side) */}
      <mesh ref={yangRef}>
        <shapeGeometry args={[yangShape]} />
        <meshBasicMaterial
          color="#f0f0ff"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Yang dot (white dot in dark side) */}
      <mesh ref={yangDotRef} position={[0, 0.5, 0.01]}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial
          color="#f0f0ff"
          transparent
          opacity={0}
        />
      </mesh>

      {/* Yin dot (dark dot in light side) */}
      <mesh ref={yinDotRef} position={[0, -0.5, 0.01]}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial
          color="#1a1a2e"
          transparent
          opacity={0}
        />
      </mesh>

      {/* Outer ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.98, 1.05, 64]} />
        <meshBasicMaterial
          color="#88ccff"
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
};

// Enhanced Laozi Guardian Node
interface LaoziNodeProps {
  guardian: GuardianData;
  onHover: (guardian: GuardianData | null) => void;
  onLaoziHover: (hovered: boolean) => void;
  positionRef: React.MutableRefObject<THREE.Vector3>;
}

const LaoziNode = ({ guardian, onHover, onLaoziHover, positionRef }: LaoziNodeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const angle = time * guardian.orbitSpeed + guardian.orbitOffset;

    // Orbital motion
    const x = Math.cos(angle) * guardian.orbitRadius;
    const y = Math.sin(angle) * guardian.orbitRadius * 0.6;
    const z = Math.sin(angle) * 2;

    groupRef.current.position.set(x, y, z);
    positionRef.current.set(x, y, z);

    // Pulsing effect for core
    if (coreRef.current) {
      const pulse = 1 + Math.sin(time * 2) * 0.15;
      coreRef.current.scale.setScalar(hovered ? pulse * 1.3 : pulse);
    }

    // Ethereal outer pulse
    if (pulseRef.current) {
      const outerPulse = 1 + Math.sin(time * 1.5) * 0.3;
      pulseRef.current.scale.setScalar(hovered ? outerPulse * 2 : outerPulse * 1.5);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 
        hovered ? 0.15 + Math.sin(time * 2) * 0.05 : 0.08;
    }

    // Outer glow expansion on hover
    if (outerGlowRef.current) {
      const glowScale = hovered ? 3 : 1.8;
      const currentScale = outerGlowRef.current.scale.x;
      outerGlowRef.current.scale.setScalar(currentScale + (glowScale - currentScale) * 0.1);
      (outerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = 
        hovered ? 0.12 : 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outermost ethereal glow */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshBasicMaterial
          color="#88ccff"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Pulsing halo */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshBasicMaterial
          color="#88ccff"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial
          color="#aaddff"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core star */}
      <mesh
        ref={coreRef}
        onPointerEnter={() => {
          setHovered(true);
          onHover(guardian);
          onLaoziHover(true);
          document.body.style.cursor = "pointer";
          omSound.start();
        }}
        onPointerLeave={() => {
          setHovered(false);
          onHover(null);
          onLaoziHover(false);
          document.body.style.cursor = "auto";
          omSound.stop();
        }}
      >
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

    </group>
  );
};

// Enhanced Confucius Guardian Node
interface ConfuciusNodeProps {
  guardian: GuardianData;
  onHover: (guardian: GuardianData | null) => void;
  onConfuciusHover: (hovered: boolean) => void;
  onConfuciusClick: () => void;
  positionRef: React.MutableRefObject<THREE.Vector3>;
}

const ConfuciusNode = ({ guardian, onHover, onConfuciusHover, onConfuciusClick, positionRef }: ConfuciusNodeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const angle = time * guardian.orbitSpeed + guardian.orbitOffset;

    // Orbital motion - opposite to Laozi for Yin-Yang balance
    const x = Math.cos(angle) * guardian.orbitRadius;
    const y = Math.sin(angle) * guardian.orbitRadius * 0.6;
    const z = Math.sin(angle) * 2;

    groupRef.current.position.set(x, y, z);
    positionRef.current.set(x, y, z);

    // Steady glow (less pulsing than Laozi - more grounded)
    if (coreRef.current) {
      const scale = hovered ? 1.4 : 1.1;
      coreRef.current.scale.setScalar(scale);
    }

    // Warm glow
    if (glowRef.current) {
      const glowScale = hovered ? 2.2 : 1.6;
      const currentScale = glowRef.current.scale.x;
      glowRef.current.scale.setScalar(currentScale + (glowScale - currentScale) * 0.1);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.2 : 0.12;
    }

    // Outer aura
    if (outerGlowRef.current) {
      const outerScale = hovered ? 3 : 2;
      const currentOuter = outerGlowRef.current.scale.x;
      outerGlowRef.current.scale.setScalar(currentOuter + (outerScale - currentOuter) * 0.08);
      (outerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.1 : 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer warm aura */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshBasicMaterial
          color="#fff8e7"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Warm glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshBasicMaterial
          color="#fff8e7"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner warm glow */}
      <mesh>
        <sphereGeometry args={[0.15, 24, 24]} />
        <meshBasicMaterial
          color="#fffaf0"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core star - warm white */}
      <mesh
        ref={coreRef}
        onPointerEnter={() => {
          setHovered(true);
          onHover(guardian);
          onConfuciusHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          onHover(null);
          onConfuciusHover(false);
          document.body.style.cursor = "auto";
        }}
        onClick={() => {
          onConfuciusClick();
        }}
      >
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshBasicMaterial color="#fffef8" />
      </mesh>

      {/* Constellation line to center */}
      <ConstellationLine startPos={positionRef.current} visible={hovered} />
    </group>
  );
};

// Enhanced Li Ka-shing Guardian Node - Amber Gold, Most Tangible
interface LiKashingNodeProps {
  guardian: GuardianData;
  onHover: (guardian: GuardianData | null) => void;
  onLiKashingHover: (hovered: boolean) => void;
  onLiKashingClick: () => void;
  positionRef: React.MutableRefObject<THREE.Vector3>;
}

const LiKashingNode = ({ guardian, onHover, onLiKashingHover, onLiKashingClick, positionRef }: LiKashingNodeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const angle = time * guardian.orbitSpeed + guardian.orbitOffset;

    // Orbital motion - stable, grounded orbit
    const x = Math.cos(angle) * guardian.orbitRadius;
    const y = Math.sin(angle) * guardian.orbitRadius * 0.6;
    const z = Math.sin(angle) * 1.5; // Less z-movement for stability

    groupRef.current.position.set(x, y, z);
    positionRef.current.set(x, y, z);

    // Solid, stable pulsing - slower and more deliberate than others
    if (coreRef.current) {
      const pulse = 1 + Math.sin(time * 1.2) * 0.08; // Slower, more subtle
      const scale = hovered ? pulse * 1.5 : pulse * 1.2;
      coreRef.current.scale.setScalar(scale);
    }

    // Inner amber glow
    if (innerGlowRef.current) {
      const glowScale = hovered ? 2.5 : 1.8;
      const currentScale = innerGlowRef.current.scale.x;
      innerGlowRef.current.scale.setScalar(currentScale + (glowScale - currentScale) * 0.08);
      (innerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.25 : 0.15;
    }

    // Outer protective aura
    if (outerGlowRef.current) {
      const outerScale = hovered ? 3.5 : 2.2;
      const currentOuter = outerGlowRef.current.scale.x;
      outerGlowRef.current.scale.setScalar(currentOuter + (outerScale - currentOuter) * 0.06);
      (outerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.12 : 0.05;
    }

    // Shield ring (visible on hover)
    if (shieldRef.current) {
      shieldRef.current.rotation.z = time * 0.5;
      const shieldScale = hovered ? 2 : 0.5;
      const currentShield = shieldRef.current.scale.x;
      shieldRef.current.scale.setScalar(currentShield + (shieldScale - currentShield) * 0.1);
      (shieldRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.3 : 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer protective aura */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial
          color="#d4a574"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Shield ring */}
      <mesh ref={shieldRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.02, 8, 32]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner amber glow */}
      <mesh ref={innerGlowRef}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshBasicMaterial
          color="#d4a574"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Solid inner core */}
      <mesh>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshBasicMaterial
          color="#ffd89b"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core star - solid amber gold */}
      <mesh
        ref={coreRef}
        onPointerEnter={() => {
          setHovered(true);
          onHover(guardian);
          onLiKashingHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          onHover(null);
          onLiKashingHover(false);
          document.body.style.cursor = "auto";
        }}
        onClick={() => {
          onLiKashingClick();
        }}
      >
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>

      {/* Golden constellation line to center */}
      <ConstellationLine startPos={positionRef.current} visible={hovered} />
    </group>
  );
};

// Golden Support Line from Li Ka-shing to center
interface GoldenSupportLineProps {
  position: React.MutableRefObject<THREE.Vector3>;
  visible: boolean;
}

const GoldenSupportLine = ({ position, visible }: GoldenSupportLineProps) => {
  const lineRef = useRef<any>(null);
  const opacityRef = useRef(0);

  useFrame((_, delta) => {
    const targetOpacity = visible ? 0.6 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 3;
    
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = opacityRef.current;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[position.current, new THREE.Vector3(0, 0, 0)]}
      color="#ffd700"
      lineWidth={2}
      transparent
      opacity={0}
    />
  );
};

// Einstein Guardian Node - Cyan Blue with Gravitational Waves
interface EinsteinNodeProps {
  guardian: GuardianData;
  onHover: (guardian: GuardianData | null) => void;
  onEinsteinHover: (hovered: boolean) => void;
  onEinsteinClick: () => void;
  positionRef: React.MutableRefObject<THREE.Vector3>;
  gravitationalWaveSound: {
    startSound: () => void;
    stopSound: () => void;
  };
}

const EinsteinNode = ({ guardian, onHover, onEinsteinHover, onEinsteinClick, positionRef, gravitationalWaveSound }: EinsteinNodeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Gravitational wave rings
  const wave1Ref = useRef<THREE.Mesh>(null);
  const wave2Ref = useRef<THREE.Mesh>(null);
  const wave3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const angle = time * guardian.orbitSpeed + guardian.orbitOffset;

    // Orbital motion
    const x = Math.cos(angle) * guardian.orbitRadius;
    const y = Math.sin(angle) * guardian.orbitRadius * 0.6;
    const z = Math.sin(angle) * 2;

    groupRef.current.position.set(x, y, z);
    positionRef.current.set(x, y, z);

    // Core pulsing
    if (coreRef.current) {
      const pulse = 1 + Math.sin(time * 2) * 0.1;
      const scale = hovered ? pulse * 1.4 : pulse * 1.1;
      coreRef.current.scale.setScalar(scale);
    }

    // Inner cyan glow
    if (innerGlowRef.current) {
      const glowScale = hovered ? 2.5 : 1.8;
      const currentScale = innerGlowRef.current.scale.x;
      innerGlowRef.current.scale.setScalar(currentScale + (glowScale - currentScale) * 0.08);
      (innerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.25 : 0.15;
    }

    // Outer glow
    if (outerGlowRef.current) {
      const outerScale = hovered ? 3.5 : 2.2;
      const currentOuter = outerGlowRef.current.scale.x;
      outerGlowRef.current.scale.setScalar(currentOuter + (outerScale - currentOuter) * 0.06);
      (outerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.12 : 0.05;
    }

    // Gravitational wave animations - expanding rings
    const baseWaveSpeed = hovered ? 0.8 : 0.4;
    [wave1Ref, wave2Ref, wave3Ref].forEach((waveRef, i) => {
      if (waveRef.current) {
        const wavePhase = (time * baseWaveSpeed + i * 0.7) % 2;
        const waveScale = 0.2 + wavePhase * 1.5;
        const waveOpacity = Math.max(0, (1 - wavePhase / 2) * (hovered ? 0.4 : 0.15));
        
        waveRef.current.scale.setScalar(waveScale);
        (waveRef.current.material as THREE.MeshBasicMaterial).opacity = waveOpacity;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Gravitational Wave Rings */}
      <mesh ref={wave1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.01, 8, 64]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={wave2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.01, 8, 64]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={wave3Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.01, 8, 64]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner glow */}
      <mesh ref={innerGlowRef}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner core */}
      <mesh>
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshBasicMaterial
          color="#66e0ff"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core star - vibrant cyan */}
      <mesh
        ref={coreRef}
        onPointerEnter={() => {
          setHovered(true);
          onHover(guardian);
          onEinsteinHover(true);
          gravitationalWaveSound.startSound();
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          onHover(null);
          onEinsteinHover(false);
          gravitationalWaveSound.stopSound();
          document.body.style.cursor = "auto";
        }}
        onClick={() => {
          onEinsteinClick();
        }}
      >
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
    </group>
  );
};

// Curved Spacetime Line from Einstein to center
interface SpacetimeLineProps {
  position: React.MutableRefObject<THREE.Vector3>;
  visible: boolean;
}

const SpacetimeLine = ({ position, visible }: SpacetimeLineProps) => {
  const lineRef = useRef<any>(null);
  const opacityRef = useRef(0);
  const [points, setPoints] = useState<THREE.Vector3[]>([]);

  useFrame((_, delta) => {
    const targetOpacity = visible ? 0.6 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 3;
    
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = opacityRef.current;
    }

    // Update curved path
    const start = position.current.clone();
    const end = new THREE.Vector3(0, 0, 0);
    const mid = new THREE.Vector3(
      (start.x + end.x) / 2 + Math.sin(Date.now() * 0.001) * 0.5,
      (start.y + end.y) / 2 + Math.cos(Date.now() * 0.001) * 0.8,
      (start.z + end.z) / 2 + 1.5
    );

    // Create curved path using quadratic bezier
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    setPoints(curve.getPoints(32));
  });

  if (points.length === 0) return null;

  return (
    <Line
      ref={lineRef}
      points={points}
      color="#00d4ff"
      lineWidth={1.5}
      transparent
      opacity={0}
      dashed
      dashSize={0.1}
      dashScale={2}
    />
  );
};

// Regular Guardian star node component
interface GuardianNodeProps {
  guardian: GuardianData;
  onHover: (guardian: GuardianData | null) => void;
  slowdownFactor: number;
}

const GuardianNode = ({ guardian, onHover, slowdownFactor }: GuardianNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    timeRef.current += delta * slowdownFactor;
    const time = timeRef.current;
    const angle = time * guardian.orbitSpeed + guardian.orbitOffset;

    meshRef.current.position.x = Math.cos(angle) * guardian.orbitRadius;
    meshRef.current.position.y = Math.sin(angle) * guardian.orbitRadius * 0.6;
    meshRef.current.position.z = Math.sin(angle) * 2;

    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
      glowRef.current.scale.setScalar(hovered ? 1.5 : 1);
    }
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color={guardian.color}
          transparent
          opacity={0.2}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerEnter={() => {
          setHovered(true);
          onHover(guardian);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          onHover(null);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={guardian.color} />
      </mesh>
    </group>
  );
};

// Camera controller
const CameraController = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.z = 12;
  }, [camera]);

  return null;
};

// Xi Jinping Guardian Node - Brilliant Red with Commanding Aura
interface XiNodeProps {
  guardian: GuardianData;
  onHover: (guardian: GuardianData | null) => void;
  onXiHover: (hovered: boolean) => void;
  onXiClick: () => void;
  positionRef: React.MutableRefObject<THREE.Vector3>;
}

const XiNode = ({ guardian, onHover, onXiHover, onXiClick, positionRef }: XiNodeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const aura1Ref = useRef<THREE.Mesh>(null);
  const aura2Ref = useRef<THREE.Mesh>(null);
  const aura3Ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Fixed position at the highest point
    const y = 5.5; // Top of galaxy
    const x = Math.sin(time * 0.03) * 0.3; // Slight gentle sway
    const z = 1;

    groupRef.current.position.set(x, y, z);
    positionRef.current.set(x, y, z);

    // Core - steady glow, not pulsing (stability)
    if (coreRef.current) {
      const scale = hovered ? 1.5 : 1.2;
      const currentScale = coreRef.current.scale.x;
      coreRef.current.scale.setScalar(currentScale + (scale - currentScale) * 0.1);
    }

    // Inner red glow
    if (innerGlowRef.current) {
      const glowScale = hovered ? 3 : 2;
      const currentScale = innerGlowRef.current.scale.x;
      innerGlowRef.current.scale.setScalar(currentScale + (glowScale - currentScale) * 0.08);
      (innerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.3 : 0.2;
    }

    // Outer commanding aura
    if (outerGlowRef.current) {
      const outerScale = hovered ? 4.5 : 3;
      const currentOuter = outerGlowRef.current.scale.x;
      outerGlowRef.current.scale.setScalar(currentOuter + (outerScale - currentOuter) * 0.06);
      (outerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.15 : 0.08;
    }

    // Expanding aura rings - commanding presence
    const baseSpeed = hovered ? 0.5 : 0.25;
    [aura1Ref, aura2Ref, aura3Ref].forEach((auraRef, i) => {
      if (auraRef.current) {
        const phase = (time * baseSpeed + i * 0.8) % 3;
        const scale = 0.5 + phase * 1.8;
        const opacity = Math.max(0, (1 - phase / 3) * (hovered ? 0.35 : 0.12));
        
        auraRef.current.scale.setScalar(scale);
        (auraRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Expanding Aura Rings - Commanding Presence */}
      <mesh ref={aura1Ref}>
        <ringGeometry args={[0.4, 0.42, 64]} />
        <meshBasicMaterial
          color="#ff2020"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={aura2Ref}>
        <ringGeometry args={[0.4, 0.42, 64]} />
        <meshBasicMaterial
          color="#ff2020"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={aura3Ref}>
        <ringGeometry args={[0.4, 0.42, 64]} />
        <meshBasicMaterial
          color="#ff2020"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer commanding glow */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial
          color="#ff2020"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner red glow */}
      <mesh ref={innerGlowRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial
          color="#ff3030"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner core glow */}
      <mesh>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshBasicMaterial
          color="#ff5050"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core star - brilliant red */}
      <mesh
        ref={coreRef}
        onPointerEnter={() => {
          setHovered(true);
          onHover(guardian);
          onXiHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          onHover(null);
          onXiHover(false);
          document.body.style.cursor = "auto";
        }}
        onClick={() => {
          onXiClick();
        }}
      >
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
};

// Pentagon of Wisdom - connects all five guardians with energy flow
interface PentagonOfWisdomProps {
  laoziPos: React.MutableRefObject<THREE.Vector3>;
  confuciusPos: React.MutableRefObject<THREE.Vector3>;
  liKashingPos: React.MutableRefObject<THREE.Vector3>;
  einsteinPos: React.MutableRefObject<THREE.Vector3>;
  xiPos: React.MutableRefObject<THREE.Vector3>;
  visible: boolean;
  intensity: number; // 0-1 based on how many guardians are hovered
}

// Energy pulse traveling along pentagon edges
const PentagonEnergyPulse = ({
  positions,
  delay,
  speed,
  visible,
  color
}: {
  positions: THREE.Vector3[];
  delay: number;
  speed: number;
  visible: boolean;
  color: string;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(delay);
  const opacityRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current || positions.length < 5) return;

    const targetOpacity = visible ? 1 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 5;

    // Advance along the pentagon
    progressRef.current += delta * speed;
    if (progressRef.current > 5) progressRef.current = 0;

    // Calculate which edge we're on and position
    const edgeIndex = Math.floor(progressRef.current);
    const edgeProgress = progressRef.current - edgeIndex;
    
    const startPos = positions[edgeIndex % 5];
    const endPos = positions[(edgeIndex + 1) % 5];
    
    const pos = new THREE.Vector3().lerpVectors(startPos, endPos, edgeProgress);
    meshRef.current.position.copy(pos);
    
    if (glowRef.current) {
      glowRef.current.position.copy(pos);
    }

    // Pulsing scale
    const time = state.clock.elapsedTime;
    const pulseScale = 1 + Math.sin(time * 6 + delay * 8) * 0.3;
    meshRef.current.scale.setScalar(pulseScale);

    const finalOpacity = opacityRef.current * 0.9;
    if (meshRef.current.material) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = finalOpacity;
    }
    if (glowRef.current?.material) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = finalOpacity * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// Individual edge with guardian-specific color
const PentagonEdge = ({
  start,
  end,
  color,
  visible,
  pulsePhase
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  visible: boolean;
  pulsePhase: number;
}) => {
  const lineRef = useRef<any>(null);
  const glowLineRef = useRef<any>(null);
  const opacityRef = useRef(0);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const pulse = 0.5 + Math.sin(time * 2 + pulsePhase) * 0.3;
    
    const targetOpacity = visible ? pulse : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 4;

    if (lineRef.current?.material) {
      lineRef.current.material.opacity = opacityRef.current;
    }
    if (glowLineRef.current?.material) {
      glowLineRef.current.material.opacity = opacityRef.current * 0.4;
    }
  });

  return (
    <group>
      {/* Glow line */}
      <Line
        ref={glowLineRef}
        points={[start, end]}
        color={color}
        lineWidth={6}
        transparent
        opacity={0}
      />
      {/* Core line */}
      <Line
        ref={lineRef}
        points={[start, end]}
        color="#ffffff"
        lineWidth={2}
        transparent
        opacity={0}
      />
    </group>
  );
};

const PentagonOfWisdom = ({ 
  laoziPos, confuciusPos, liKashingPos, einsteinPos, xiPos, 
  visible, intensity 
}: PentagonOfWisdomProps) => {
  const centerGlowRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const opacityRef = useRef(0);

  // Calculate center of pentagon
  const [center, setCenter] = useState(new THREE.Vector3());
  
  // Pentagon positions array for energy pulses
  const [positions, setPositions] = useState<THREE.Vector3[]>([]);

  // Edge colors matching each guardian
  const edgeColors = useMemo(() => [
    "#ff2020", // Xi to Confucius (red)
    "#fff8e7", // Confucius to Einstein (ivory)
    "#00d4ff", // Einstein to Laozi (cyan)
    "#88ccff", // Laozi to Li Ka-shing (water blue)
    "#d4a574", // Li Ka-shing to Xi (gold)
  ], []);

  useFrame((state, delta) => {
    const targetOpacity = visible ? intensity : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 3;

    // Update positions
    const newPositions = [
      xiPos.current.clone(),
      confuciusPos.current.clone(),
      einsteinPos.current.clone(),
      laoziPos.current.clone(),
      liKashingPos.current.clone(),
    ];
    setPositions(newPositions);

    // Calculate center
    const newCenter = new THREE.Vector3();
    newPositions.forEach(p => newCenter.add(p));
    newCenter.divideScalar(5);
    setCenter(newCenter);

    // Pulsing center glow
    const time = state.clock.elapsedTime;
    if (centerGlowRef.current) {
      const pulse = 1 + Math.sin(time * 1.5) * 0.2;
      centerGlowRef.current.scale.setScalar(pulse * 2);
      centerGlowRef.current.position.copy(newCenter);
      (centerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = opacityRef.current * 0.2;
    }
    
    if (innerGlowRef.current) {
      const innerPulse = 1.5 + Math.sin(time * 2 + 1) * 0.3;
      innerGlowRef.current.scale.setScalar(innerPulse);
      innerGlowRef.current.position.copy(newCenter);
      (innerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = opacityRef.current * 0.15;
    }
  });

  if (positions.length < 5) return null;

  // Generate energy pulses
  const pulseCount = 8;
  const pulses = useMemo(() => 
    Array.from({ length: pulseCount }, (_, i) => ({
      id: i,
      delay: (i / pulseCount) * 5,
      speed: 0.6 + Math.random() * 0.2,
      color: edgeColors[i % 5]
    })), [edgeColors]);

  return (
    <group>
      {/* Center emanating glow */}
      <mesh ref={centerGlowRef}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <mesh ref={innerGlowRef}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial
          color="#aaddff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Pentagon edges with guardian colors */}
      <PentagonEdge start={positions[0]} end={positions[1]} color={edgeColors[0]} visible={visible} pulsePhase={0} />
      <PentagonEdge start={positions[1]} end={positions[2]} color={edgeColors[1]} visible={visible} pulsePhase={1.2} />
      <PentagonEdge start={positions[2]} end={positions[3]} color={edgeColors[2]} visible={visible} pulsePhase={2.4} />
      <PentagonEdge start={positions[3]} end={positions[4]} color={edgeColors[3]} visible={visible} pulsePhase={3.6} />
      <PentagonEdge start={positions[4]} end={positions[0]} color={edgeColors[4]} visible={visible} pulsePhase={4.8} />

      {/* Energy pulses traveling around the pentagon */}
      {pulses.map((pulse) => (
        <PentagonEnergyPulse
          key={pulse.id}
          positions={positions}
          delay={pulse.delay}
          speed={pulse.speed}
          visible={visible}
          color={pulse.color}
        />
      ))}
    </group>
  );
};

// Legacy SovereigntyPentagon for backward compatibility (now uses PentagonOfWisdom)
interface SovereigntyPentagonProps {
  laoziPos: React.MutableRefObject<THREE.Vector3>;
  confuciusPos: React.MutableRefObject<THREE.Vector3>;
  liKashingPos: React.MutableRefObject<THREE.Vector3>;
  einsteinPos: React.MutableRefObject<THREE.Vector3>;
  xiPos: React.MutableRefObject<THREE.Vector3>;
  visible: boolean;
}

const SovereigntyPentagon = ({ laoziPos, confuciusPos, liKashingPos, einsteinPos, xiPos, visible }: SovereigntyPentagonProps) => {
  return (
    <PentagonOfWisdom
      laoziPos={laoziPos}
      confuciusPos={confuciusPos}
      liKashingPos={liKashingPos}
      einsteinPos={einsteinPos}
      xiPos={xiPos}
      visible={visible}
      intensity={visible ? 1 : 0}
    />
  );
};

// Guardian colors for Memory Stars
const guardianColors: Record<string, string> = {
  laozi: "#88ccff",
  confucius: "#fff8e7",
  likashing: "#d4a574",
  einstein: "#00d4ff",
  xi: "#ff2020",
};

// Guardian effects for Memory Viewer
const guardianEffects: Record<string, string> = {
  laozi: "water",
  confucius: "order",
  likashing: "gold",
  einstein: "time",
  xi: "power",
};

// Main Galaxy Scene
interface GalaxySceneProps {
  converged: boolean;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
  onGuardianHover: (guardian: GuardianData | null) => void;
  slowdownFactor: number;
  onLaoziHover: (hovered: boolean) => void;
  onConfuciusHover: (hovered: boolean) => void;
  onConfuciusClick: () => void;
  onLiKashingHover: (hovered: boolean) => void;
  onLiKashingClick: () => void;
  onEinsteinHover: (hovered: boolean) => void;
  onEinsteinClick: () => void;
  onXiHover: (hovered: boolean) => void;
  onXiClick: () => void;
  orderMode: boolean;
  grandOrderMode: boolean;
  laoziPosRef: React.MutableRefObject<THREE.Vector3>;
  confuciusPosRef: React.MutableRefObject<THREE.Vector3>;
  liKashingPosRef: React.MutableRefObject<THREE.Vector3>;
  einsteinPosRef: React.MutableRefObject<THREE.Vector3>;
  xiPosRef: React.MutableRefObject<THREE.Vector3>;
  wisdomBridgeVisible: boolean;
  yinYangVisible: boolean;
  pentagonOfWisdomVisible: boolean;
  pentagonIntensity: number;
  liKashingHovered: boolean;
  einsteinHovered: boolean;
  xiHovered: boolean;
  confuciusHovered: boolean;
  gravitationalWaveSound: {
    startSound: () => void;
    stopSound: () => void;
  };
  // Memory photo system
  memoryPhotos: MemoryPhoto[];
  onMemoryStarClick: (photo: MemoryPhoto, position: THREE.Vector3) => void;
  // Core memory photo state
  coreMemoryActive: boolean;
  onCoreMemoryActivate: () => void;
}

const GalaxyScene = ({ 
  converged, mousePosition, onGuardianHover, slowdownFactor, 
  onLaoziHover, onConfuciusHover, onConfuciusClick, orderMode, grandOrderMode,
  onLiKashingHover, onLiKashingClick,
  onEinsteinHover, onEinsteinClick,
  onXiHover, onXiClick,
  laoziPosRef, confuciusPosRef, liKashingPosRef, einsteinPosRef, xiPosRef,
  wisdomBridgeVisible, yinYangVisible, pentagonOfWisdomVisible, pentagonIntensity,
  liKashingHovered, einsteinHovered, xiHovered, confuciusHovered,
  gravitationalWaveSound,
  memoryPhotos, onMemoryStarClick,
  coreMemoryActive, onCoreMemoryActivate
}: GalaxySceneProps) => {
  const laozi = guardians.find(g => g.id === "laozi")!;
  const confucius = guardians.find(g => g.id === "confucius")!;
  const liKashing = guardians.find(g => g.id === "likashing")!;
  const einstein = guardians.find(g => g.id === "einstein")!;
  const xi = guardians.find(g => g.id === "xi")!;
  const otherGuardians = guardians.filter(g => g.id !== "laozi" && g.id !== "confucius" && g.id !== "likashing" && g.id !== "einstein" && g.id !== "xi");

  return (
    <>
      <CameraController />
      <ambientLight intensity={0.5} />
      
      <ParticleField converged={converged} mousePosition={mousePosition} slowdownFactor={slowdownFactor} orderMode={orderMode} grandOrderMode={grandOrderMode} />

      {/* Memory Stars - uploaded photos */}
      {memoryPhotos.map((photo, index) => (
        <MemoryStar
          key={photo.id}
          photo={photo}
          index={index}
          onClick={onMemoryStarClick}
          guardianColors={guardianColors}
        />
      ))}

      {/* Laozi - Special enhanced node */}
      <LaoziNode
        guardian={laozi}
        onHover={onGuardianHover}
        onLaoziHover={onLaoziHover}
        positionRef={laoziPosRef}
      />

      {/* Confucius - Special enhanced node */}
      <ConfuciusNode
        guardian={confucius}
        onHover={onGuardianHover}
        onConfuciusHover={onConfuciusHover}
        onConfuciusClick={onConfuciusClick}
        positionRef={confuciusPosRef}
      />

      {/* Bridge of Wisdom between Laozi and Confucius */}
      <WisdomBridge
        laoziPos={laoziPosRef}
        confuciusPos={confuciusPosRef}
        visible={wisdomBridgeVisible}
      />

      {/* Yin-Yang Symbol - appears when both Laozi and Confucius are hovered */}
      <YinYangSymbol visible={yinYangVisible} />

      {/* Li Ka-shing - Amber Gold Guardian */}
      <LiKashingNode
        guardian={liKashing}
        onHover={onGuardianHover}
        onLiKashingHover={onLiKashingHover}
        onLiKashingClick={onLiKashingClick}
        positionRef={liKashingPosRef}
      />

      {/* Golden Support Line from Li Ka-shing to center */}
      <GoldenSupportLine
        position={liKashingPosRef}
        visible={liKashingHovered}
      />

      {/* Einstein - Cyan Blue Guardian */}
      <EinsteinNode
        guardian={einstein}
        onHover={onGuardianHover}
        onEinsteinHover={onEinsteinHover}
        onEinsteinClick={onEinsteinClick}
        positionRef={einsteinPosRef}
        gravitationalWaveSound={gravitationalWaveSound}
      />

      {/* Curved Spacetime Line from Einstein to center */}
      <SpacetimeLine
        position={einsteinPosRef}
        visible={einsteinHovered}
      />

      {/* Xi Jinping - Brilliant Red Guardian */}
      <XiNode
        guardian={xi}
        onHover={onGuardianHover}
        onXiHover={onXiHover}
        onXiClick={onXiClick}
        positionRef={xiPosRef}
      />

      {/* Pentagon of Wisdom connecting all five guardians */}
      <PentagonOfWisdom
        laoziPos={laoziPosRef}
        confuciusPos={confuciusPosRef}
        liKashingPos={liKashingPosRef}
        einsteinPos={einsteinPosRef}
        xiPos={xiPosRef}
        visible={pentagonOfWisdomVisible}
        intensity={pentagonIntensity}
      />

      {/* CORE MEMORY PHOTO - at the absolute center of the galaxy */}
      <CoreMemoryPhoto
        xiHovered={xiHovered}
        confuciusHovered={confuciusHovered}
        onActivate={onCoreMemoryActivate}
      />

      {/* Other Guardian nodes */}
      {otherGuardians.map((guardian) => (
        <GuardianNode
          key={guardian.id}
          guardian={guardian}
          onHover={onGuardianHover}
          slowdownFactor={slowdownFactor}
        />
      ))}
    </>
  );
};

// Vertical Calligraphy Component
const VerticalCalligraphy = ({ text, visible, style = "laozi" }: { text: string; visible: boolean; style?: "laozi" | "confucius" }) => {
  const characters = text.split("");
  
  const isConfucius = style === "confucius";
  const color = isConfucius ? "#fff8e7" : "#88ccff";
  const glowColor = isConfucius 
    ? "rgba(255, 248, 231, 0.5), 0 0 60px rgba(255, 248, 231, 0.3)" 
    : "rgba(136, 204, 255, 0.5), 0 0 60px rgba(136, 204, 255, 0.3)";
  const side = isConfucius ? "left" : "right";
  const attribution = isConfucius ? "— 孔子" : "— 老子";

  return (
    <div
      style={{
        position: "fixed",
        [side]: "60px",
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        opacity: visible ? 1 : 0,
        transition: "opacity 1.5s ease",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {characters.map((char, i) => (
        <span
          key={i}
          style={{
            fontSize: isConfucius ? "22px" : "28px",
            color: color,
            fontFamily: "'Noto Serif SC', 'STKaiti', 'KaiTi', serif",
            textShadow: `0 0 30px ${glowColor}`,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : `translateX(${isConfucius ? "-20px" : "20px"})`,
            transition: `all 0.8s ease ${i * 0.06}s`,
            writingMode: "horizontal-tb",
          }}
        >
          {char}
        </span>
      ))}
      
      {/* Attribution */}
      <span
        style={{
          marginTop: "16px",
          fontSize: "11px",
          color: isConfucius ? "rgba(255, 248, 231, 0.4)" : "rgba(136, 204, 255, 0.4)",
          letterSpacing: "0.1em",
          opacity: visible ? 1 : 0,
          transition: "opacity 1s ease 0.8s",
        }}
      >
        {attribution}
      </span>
    </div>
  );
};

// Main exported component
interface StardustGalaxyProps {
  accessGranted: boolean;
}

const StardustGalaxy = ({ accessGranted }: StardustGalaxyProps) => {
  const [hoveredGuardian, setHoveredGuardian] = useState<GuardianData | null>(null);
  const [laoziHovered, setLaoziHovered] = useState(false);
  const [confuciusHovered, setConfuciusHovered] = useState(false);
  const [liKashingHovered, setLiKashingHovered] = useState(false);
  const [einsteinHovered, setEinsteinHovered] = useState(false);
  const [xiHovered, setXiHovered] = useState(false);
  const [showDaysCounter, setShowDaysCounter] = useState(false);
  const [showSecurityStatus, setShowSecurityStatus] = useState(false);
  const [showLightSpeedEffect, setShowLightSpeedEffect] = useState(false);
  const [showSystemUpdate, setShowSystemUpdate] = useState(false);
  const [coreMemoryActive, setCoreMemoryActive] = useState(false);
  
  // Photo injection system states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMemoryPhoto, setSelectedMemoryPhoto] = useState<MemoryPhoto | null>(null);
  const { photos: memoryPhotos, addPhoto } = useMemoryPhotos();
  
  const mousePosition = useRef({ x: 0, y: 0 });
  
  // Position refs for connections
  const laoziPosRef = useRef(new THREE.Vector3(-4, 0, 0));
  const confuciusPosRef = useRef(new THREE.Vector3(4, 0, 0));
  const liKashingPosRef = useRef(new THREE.Vector3(0, 5, 0));
  const einsteinPosRef = useRef(new THREE.Vector3(-3, -3, 0));
  const xiPosRef = useRef(new THREE.Vector3(0, 5.5, 0));

  // Time Dilation: 80% slowdown when Einstein is hovered, Wu Wei slowdown for Laozi
  const slowdownFactor = einsteinHovered ? 0.2 : (laoziHovered ? 0.15 : 1);
  
  // Order mode when Confucius is hovered
  const orderMode = confuciusHovered;
  
  // Grand Order mode when Xi is hovered
  const grandOrderMode = xiHovered;
  
  // Bridge of Wisdom visible when either is hovered
  const wisdomBridgeVisible = laoziHovered || confuciusHovered;
  
  // Yin-Yang symbol visible when BOTH are hovered simultaneously
  const yinYangVisible = laoziHovered && confuciusHovered;
  
  // Pentagon of Wisdom visible when any guardian is hovered (intensity based on count)
  const hoveredGuardianCount = [laoziHovered, confuciusHovered, liKashingHovered, einsteinHovered, xiHovered].filter(Boolean).length;
  const pentagonOfWisdomVisible = hoveredGuardianCount >= 1;
  const pentagonIntensity = Math.min(1, hoveredGuardianCount * 0.4);

  // Gravitational wave sound for Einstein
  const gravitationalWaveSound = useGravitationalWaveSound();

  // Guardian data for upload modal
  const uploadGuardians = guardians
    .filter(g => ["laozi", "confucius", "likashing", "einstein", "xi"].includes(g.id))
    .map(g => ({ id: g.id, name: g.name, nameCn: g.nameCn, color: g.color }));

  const handleConfuciusClick = () => {
    setShowDaysCounter(prev => !prev);
  };

  const handleLiKashingClick = () => {
    setShowSecurityStatus(prev => !prev);
  };

  const handleEinsteinClick = () => {
    // Trigger light speed blur effect
    setShowLightSpeedEffect(true);
    setTimeout(() => setShowLightSpeedEffect(false), 1500);
  };

  const handleXiClick = () => {
    // Trigger system update flash
    setShowSystemUpdate(true);
    setTimeout(() => setShowSystemUpdate(false), 3000);
  };

  // Handle clicking the central date to open upload
  const handleCenterDateClick = () => {
    setShowUploadModal(true);
  };

  // Handle Memory Star click
  const handleMemoryStarClick = (photo: MemoryPhoto, _position: THREE.Vector3) => {
    setSelectedMemoryPhoto(photo);
  };

  // Handle photo upload
  const handlePhotoUpload = (photo: MemoryPhoto) => {
    addPhoto(photo);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Load Google Font for calligraphy
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#000000",
      overflow: "hidden",
      // Golden glow shield effect when Li Ka-shing is hovered
      boxShadow: liKashingHovered 
        ? "inset 0 0 200px rgba(212, 165, 116, 0.15), inset 0 0 100px rgba(255, 215, 0, 0.1)" 
        : "none",
      transition: "box-shadow 1s ease",
    }}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#000000" }}
      >
        <GalaxyScene
          converged={accessGranted}
          mousePosition={mousePosition}
          onGuardianHover={setHoveredGuardian}
          slowdownFactor={slowdownFactor}
          onLaoziHover={setLaoziHovered}
          onConfuciusHover={setConfuciusHovered}
          onConfuciusClick={handleConfuciusClick}
          onLiKashingHover={setLiKashingHovered}
          onLiKashingClick={handleLiKashingClick}
          onEinsteinHover={setEinsteinHovered}
          onEinsteinClick={handleEinsteinClick}
          onXiHover={setXiHovered}
          onXiClick={handleXiClick}
          orderMode={orderMode}
          grandOrderMode={grandOrderMode}
          laoziPosRef={laoziPosRef}
          confuciusPosRef={confuciusPosRef}
          liKashingPosRef={liKashingPosRef}
          einsteinPosRef={einsteinPosRef}
          xiPosRef={xiPosRef}
          wisdomBridgeVisible={wisdomBridgeVisible}
          yinYangVisible={yinYangVisible}
          pentagonOfWisdomVisible={pentagonOfWisdomVisible}
          pentagonIntensity={pentagonIntensity}
          liKashingHovered={liKashingHovered}
          einsteinHovered={einsteinHovered}
          xiHovered={xiHovered}
          confuciusHovered={confuciusHovered}
          gravitationalWaveSound={gravitationalWaveSound}
          memoryPhotos={memoryPhotos}
          onMemoryStarClick={handleMemoryStarClick}
          coreMemoryActive={coreMemoryActive}
          onCoreMemoryActivate={() => setCoreMemoryActive(prev => !prev)}
        />

      {/* Confucius Vertical Calligraphy Quote */}
      <VerticalCalligraphy 
        text="父母之年，不可不知也。一則以喜，一則以懼。" 
        visible={confuciusHovered} 
        style="confucius"
      />

      {/* Confucius Quote for Core Memory Photo */}
      <ConfuciusQuoteOverlay visible={confuciusHovered} />

      {/* Family Tree Labels Overlay */}
      <FamilyTreeLabelsOverlay visible={coreMemoryActive} />

      {/* Days Counter Overlay */}
      {showDaysCounter && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(10,10,10,0.95)",
            border: "1px solid rgba(255, 248, 231, 0.3)",
            borderRadius: "12px",
            padding: "40px 60px",
            backdropFilter: "blur(30px)",
            zIndex: 200,
            textAlign: "center",
            animation: "fadeIn 0.5s ease",
            boxShadow: "0 0 80px rgba(255, 248, 231, 0.1)",
          }}
        >
          <div style={{
            fontSize: "10px",
            letterSpacing: "0.5em",
            color: "rgba(255, 248, 231, 0.4)",
            marginBottom: "16px",
          }}>
            知年 · KNOWING OF AGE
          </div>
          <div style={{
            fontSize: "56px",
            fontWeight: 200,
            color: "#fff8e7",
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: "0.05em",
            textShadow: "0 0 40px rgba(255, 248, 231, 0.3)",
          }}>
            {calculateDaysSince1971().toLocaleString()}
          </div>
          <div style={{
            fontSize: "11px",
            letterSpacing: "0.3em",
            color: "rgba(255, 248, 231, 0.5)",
            marginTop: "8px",
          }}>
            DAYS SINCE 1971.08.24
          </div>
          <div style={{
            fontSize: "12px",
            color: "rgba(255, 248, 231, 0.3)",
            marginTop: "24px",
            fontStyle: "italic",
          }}>
            "一則以喜，一則以懼"
          </div>
          <button
            onClick={() => setShowDaysCounter(false)}
            style={{
              marginTop: "32px",
              background: "transparent",
              border: "1px solid rgba(255, 248, 231, 0.2)",
              color: "rgba(255, 248, 231, 0.5)",
              padding: "8px 24px",
              fontSize: "10px",
              letterSpacing: "0.3em",
              cursor: "pointer",
              borderRadius: "4px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 248, 231, 0.4)";
              e.currentTarget.style.color = "rgba(255, 248, 231, 0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 248, 231, 0.2)";
              e.currentTarget.style.color = "rgba(255, 248, 231, 0.5)";
            }}
          >
            CLOSE
          </button>
        </div>
      )}
      {/* Security Status Overlay - Li Ka-shing */}
      {showSecurityStatus && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(15, 12, 8, 0.98)",
            border: "1px solid rgba(212, 165, 116, 0.4)",
            borderRadius: "12px",
            padding: "40px 50px",
            backdropFilter: "blur(30px)",
            zIndex: 200,
            textAlign: "center",
            animation: "fadeIn 0.5s ease",
            boxShadow: "0 0 100px rgba(212, 165, 116, 0.15), inset 0 0 60px rgba(255, 215, 0, 0.05)",
            minWidth: "320px",
          }}
        >
          <div style={{
            fontSize: "9px",
            letterSpacing: "0.6em",
            color: "rgba(212, 165, 116, 0.5)",
            marginBottom: "24px",
          }}>
            守業 · PRESERVATION OF VALUE
          </div>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "28px",
          }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#ffd700",
                boxShadow: "0 0 30px #ffd700, 0 0 60px rgba(255, 215, 0, 0.5)",
              }}
            />
            <span style={{ color: "#d4a574", fontSize: "18px", letterSpacing: "0.2em", fontWeight: 500 }}>
              SYSTEM INTEGRITY
            </span>
          </div>

          {/* Security Status Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 20px",
              background: "rgba(255, 215, 0, 0.05)",
              borderRadius: "6px",
              border: "1px solid rgba(212, 165, 116, 0.15)",
            }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", letterSpacing: "0.1em" }}>
                Memory Integrity
              </span>
              <span style={{ color: "#4ade80", fontSize: "14px", fontWeight: 600, letterSpacing: "0.05em" }}>
                100%
              </span>
            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 20px",
              background: "rgba(255, 215, 0, 0.05)",
              borderRadius: "6px",
              border: "1px solid rgba(212, 165, 116, 0.15)",
            }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", letterSpacing: "0.1em" }}>
                Encryption Status
              </span>
              <span style={{ color: "#4ade80", fontSize: "14px", fontWeight: 600 }}>
                ACTIVE
              </span>
            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 20px",
              background: "rgba(255, 215, 0, 0.05)",
              borderRadius: "6px",
              border: "1px solid rgba(212, 165, 116, 0.15)",
            }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", letterSpacing: "0.1em" }}>
                Guardian Shield
              </span>
              <span style={{ color: "#ffd700", fontSize: "14px", fontWeight: 600 }}>
                ETERNAL
              </span>
            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 20px",
              background: "rgba(255, 215, 0, 0.05)",
              borderRadius: "6px",
              border: "1px solid rgba(212, 165, 116, 0.15)",
            }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", letterSpacing: "0.1em" }}>
                Legacy Protocol
              </span>
              <span style={{ color: "#4ade80", fontSize: "14px", fontWeight: 600 }}>
                SECURED
              </span>
            </div>
          </div>

          <div style={{
            fontSize: "13px",
            color: "rgba(212, 165, 116, 0.6)",
            marginBottom: "8px",
            fontStyle: "italic",
            fontFamily: "'Noto Serif SC', serif",
          }}>
            "守業更比創業難"
          </div>
          <div style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.15em",
          }}>
            BUILT TO LAST FOREVER
          </div>

          <button
            onClick={() => setShowSecurityStatus(false)}
            style={{
              marginTop: "28px",
              background: "transparent",
              border: "1px solid rgba(212, 165, 116, 0.3)",
              color: "rgba(212, 165, 116, 0.6)",
              padding: "10px 28px",
              fontSize: "10px",
              letterSpacing: "0.3em",
              cursor: "pointer",
              borderRadius: "4px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(212, 165, 116, 0.6)";
              e.currentTarget.style.color = "#d4a574";
              e.currentTarget.style.background = "rgba(212, 165, 116, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(212, 165, 116, 0.3)";
              e.currentTarget.style.color = "rgba(212, 165, 116, 0.6)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            CLOSE
          </button>
        </div>
      )}
      </Canvas>

      {/* Golden Shield Overlay when Li Ka-shing is hovered */}
      {liKashingHovered && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(circle at center, rgba(255, 215, 0, 0.03) 0%, transparent 60%)",
            zIndex: 5,
            animation: "shieldPulse 2s ease infinite",
          }}
        >
          <style>{`
            @keyframes shieldPulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Light Speed Blur Effect when Einstein is clicked */}
      {showLightSpeedEffect && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 300,
            animation: "lightSpeedBurst 1.5s ease-out forwards",
          }}
        >
          <style>{`
            @keyframes lightSpeedBurst {
              0% { 
                background: radial-gradient(ellipse at center, rgba(0, 212, 255, 0) 0%, transparent 50%);
                filter: blur(0);
              }
              20% { 
                background: radial-gradient(ellipse at center, rgba(0, 212, 255, 0.4) 0%, rgba(0, 255, 255, 0.2) 30%, transparent 60%);
                filter: blur(0);
              }
              40% { 
                background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.8) 0%, rgba(0, 212, 255, 0.3) 40%, transparent 70%);
                filter: blur(2px);
              }
              60% { 
                background: radial-gradient(ellipse 200% 100% at center, rgba(0, 212, 255, 0.2) 0%, transparent 50%);
                filter: blur(0);
              }
              100% { 
                background: transparent;
                filter: blur(0);
              }
            }
          `}</style>
          {/* Motion blur streaks */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(0, 212, 255, 0.15) 20%, rgba(255, 255, 255, 0.3) 50%, rgba(0, 212, 255, 0.15) 80%, transparent 100%)",
            animation: "streakFlash 0.8s ease-out forwards",
          }} />
          <style>{`
            @keyframes streakFlash {
              0% { opacity: 0; transform: scaleX(0.1); }
              30% { opacity: 1; transform: scaleX(1.5); }
              100% { opacity: 0; transform: scaleX(2); }
            }
          `}</style>
        </div>
      )}

      {/* Laozi Vertical Calligraphy Quote */}
      <VerticalCalligraphy
        text="大音希聲，大象無形。" 
        visible={laoziHovered} 
      />

      {/* Li Ka-shing Quote Display */}
      {liKashingHovered && (
        <div
          style={{
            position: "fixed",
            top: "120px",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 100,
            animation: "fadeIn 0.5s ease",
            pointerEvents: "none",
          }}
        >
          <div style={{
            fontSize: "10px",
            letterSpacing: "0.5em",
            color: "rgba(212, 165, 116, 0.5)",
            marginBottom: "12px",
          }}>
            守業 · GUARDIAN OF VALUE
          </div>
          <div style={{
            fontSize: "22px",
            color: "#d4a574",
            fontFamily: "'Noto Serif SC', 'STKaiti', serif",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textShadow: "0 0 40px rgba(212, 165, 116, 0.4)",
          }}>
            發揮品牌效應，守業更比創業難。
          </div>
          <div style={{
            fontSize: "11px",
            color: "rgba(212, 165, 116, 0.4)",
            marginTop: "12px",
            letterSpacing: "0.1em",
          }}>
            — 李嘉誠
          </div>
          <div style={{
            marginTop: "20px",
            fontSize: "9px",
            letterSpacing: "0.3em",
            color: "rgba(255, 215, 0, 0.4)",
          }}>
            CLICK STAR FOR SECURITY STATUS
          </div>
        </div>
      )}

      {/* Einstein Quote Display */}
      {einsteinHovered && (
        <div
          style={{
            position: "fixed",
            bottom: "140px",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 100,
            animation: "fadeIn 0.5s ease",
            pointerEvents: "none",
            maxWidth: "600px",
          }}
        >
          <div style={{
            fontSize: "10px",
            letterSpacing: "0.5em",
            color: "rgba(0, 212, 255, 0.5)",
            marginBottom: "12px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}>
            時空 · SPACETIME
          </div>
          <div style={{
            fontSize: "20px",
            color: "#00d4ff",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textShadow: "0 0 40px rgba(0, 212, 255, 0.5)",
            lineHeight: 1.6,
          }}>
            過去、現在與未來的區別，
            <br />
            只是一種頑固的幻覺。
          </div>
          <div style={{
            fontSize: "11px",
            color: "rgba(0, 212, 255, 0.4)",
            marginTop: "16px",
            letterSpacing: "0.1em",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}>
            — Albert Einstein · 愛因斯坦
          </div>
          <div style={{
            marginTop: "20px",
            fontSize: "9px",
            letterSpacing: "0.3em",
            color: "rgba(0, 212, 255, 0.3)",
            fontFamily: "ui-monospace, monospace",
          }}>
            CLICK STAR FOR LIGHT SPEED
          </div>
        </div>
      )}

      {/* Xi Jinping Quote Display */}
      {xiHovered && (
        <div
          style={{
            position: "fixed",
            bottom: "140px",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 100,
            animation: "fadeIn 0.5s ease",
            pointerEvents: "none",
            maxWidth: "600px",
          }}
        >
          <div style={{
            fontSize: "10px",
            letterSpacing: "0.5em",
            color: "rgba(255, 32, 32, 0.6)",
            marginBottom: "12px",
            fontFamily: "'Noto Serif SC', serif",
          }}>
            大國 · GRAND ORDER
          </div>
          <div style={{
            fontSize: "28px",
            color: "#ff2020",
            fontFamily: "'Noto Serif SC', 'STKaiti', serif",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textShadow: "0 0 40px rgba(255, 32, 32, 0.5)",
            lineHeight: 1.6,
          }}>
            擼起袖子加油幹。
          </div>
          <div style={{
            fontSize: "11px",
            color: "rgba(255, 32, 32, 0.4)",
            marginTop: "16px",
            letterSpacing: "0.1em",
            fontFamily: "'Noto Serif SC', serif",
          }}>
            — 習近平主席
          </div>
          <div style={{
            marginTop: "20px",
            fontSize: "9px",
            letterSpacing: "0.3em",
            color: "rgba(255, 32, 32, 0.3)",
            fontFamily: "ui-monospace, monospace",
          }}>
            CLICK STAR FOR SYSTEM UPDATE
          </div>
        </div>
      )}

      {/* Guardian tooltip - show for non-special guardians */}
      {hoveredGuardian && hoveredGuardian.id !== "laozi" && hoveredGuardian.id !== "confucius" && hoveredGuardian.id !== "likashing" && hoveredGuardian.id !== "einstein" && hoveredGuardian.id !== "xi" && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(10,10,10,0.9)",
            border: `1px solid ${hoveredGuardian.color}40`,
            borderRadius: "8px",
            padding: "20px 28px",
            backdropFilter: "blur(20px)",
            zIndex: 100,
            maxWidth: "400px",
            textAlign: "center",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
          `}</style>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "12px",
          }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: hoveredGuardian.color,
                boxShadow: `0 0 20px ${hoveredGuardian.color}`,
              }}
            />
            <span style={{ color: "#fff", fontSize: "14px", letterSpacing: "0.1em" }}>
              {hoveredGuardian.name}
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
              {hoveredGuardian.nameCn}
            </span>
          </div>
          <p style={{
            color: hoveredGuardian.color,
            fontSize: "15px",
            fontStyle: "italic",
            marginBottom: "8px",
            lineHeight: 1.6,
          }}>
            "{hoveredGuardian.quote}"
          </p>
          <p style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: "12px",
            letterSpacing: "0.05em",
          }}>
            {hoveredGuardian.quoteCn}
          </p>
        </div>
      )}

      {/* Laozi special tooltip */}
      {laoziHovered && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(5,10,20,0.95)",
            border: "1px solid rgba(136, 204, 255, 0.3)",
            borderRadius: "8px",
            padding: "24px 32px",
            backdropFilter: "blur(20px)",
            zIndex: 100,
            maxWidth: "450px",
            textAlign: "center",
            animation: "fadeIn 0.5s ease",
            boxShadow: "0 0 60px rgba(136, 204, 255, 0.15)",
          }}
        >
          <div style={{
            fontSize: "10px",
            letterSpacing: "0.4em",
            color: "rgba(136, 204, 255, 0.5)",
            marginBottom: "12px",
          }}>
            無 為 · WU WEI
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "16px",
          }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#88ccff",
                boxShadow: "0 0 30px #88ccff, 0 0 60px rgba(136, 204, 255, 0.5)",
                animation: "pulse 2s ease infinite",
              }}
            />
            <span style={{ color: "#fff", fontSize: "16px", letterSpacing: "0.15em" }}>
              老子
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
              Laozi
            </span>
          </div>
          <p style={{
            color: "#88ccff",
            fontSize: "16px",
            fontStyle: "italic",
            marginBottom: "8px",
            lineHeight: 1.8,
            fontFamily: "'Noto Serif SC', serif",
          }}>
            "The Tao that can be told is not the eternal Tao."
          </p>
          <p style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "13px",
            letterSpacing: "0.1em",
            fontFamily: "'Noto Serif SC', serif",
          }}>
            道可道，非常道。
          </p>
          <style>{`
            @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } }
          `}</style>
        </div>
      )}

      {/* Confucius special tooltip */}
      {confuciusHovered && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(10,8,5,0.95)",
            border: "1px solid rgba(255, 248, 231, 0.3)",
            borderRadius: "8px",
            padding: "24px 32px",
            backdropFilter: "blur(20px)",
            zIndex: 100,
            maxWidth: "480px",
            textAlign: "center",
            animation: "fadeIn 0.5s ease",
            boxShadow: "0 0 60px rgba(255, 248, 231, 0.1)",
          }}
        >
          <div style={{
            fontSize: "10px",
            letterSpacing: "0.4em",
            color: "rgba(255, 248, 231, 0.5)",
            marginBottom: "12px",
          }}>
            禮 · LI (ORDER)
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "16px",
          }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#fff8e7",
                boxShadow: "0 0 30px #fff8e7, 0 0 60px rgba(255, 248, 231, 0.5)",
              }}
            />
            <span style={{ color: "#fff", fontSize: "16px", letterSpacing: "0.15em" }}>
              孔子
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
              Confucius
            </span>
          </div>
          <p style={{
            color: "#fff8e7",
            fontSize: "15px",
            fontStyle: "italic",
            marginBottom: "8px",
            lineHeight: 1.8,
            fontFamily: "'Noto Serif SC', serif",
          }}>
            "One must know the age of one's parents—with joy and with fear."
          </p>
          <p style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "13px",
            letterSpacing: "0.05em",
            fontFamily: "'Noto Serif SC', serif",
          }}>
            父母之年，不可不知也。
          </p>
          <div style={{
            marginTop: "16px",
            fontSize: "10px",
            letterSpacing: "0.2em",
            color: "rgba(255, 248, 231, 0.3)",
          }}>
            CLICK STAR TO REVEAL DAYS
          </div>
        </div>
      )}

      {/* Einstein special tooltip */}
      {einsteinHovered && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,8,15,0.95)",
            border: "1px solid rgba(0, 212, 255, 0.3)",
            borderRadius: "8px",
            padding: "24px 32px",
            backdropFilter: "blur(20px)",
            zIndex: 100,
            maxWidth: "500px",
            textAlign: "center",
            animation: "fadeIn 0.5s ease",
            boxShadow: "0 0 60px rgba(0, 212, 255, 0.15)",
          }}
        >
          <div style={{
            fontSize: "10px",
            letterSpacing: "0.4em",
            color: "rgba(0, 212, 255, 0.5)",
            marginBottom: "12px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}>
            E = mc² · RELATIVITY
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "16px",
          }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#00d4ff",
                boxShadow: "0 0 30px #00d4ff, 0 0 60px rgba(0, 212, 255, 0.5)",
                animation: "pulse 2s ease infinite",
              }}
            />
            <span style={{ 
              color: "#fff", 
              fontSize: "16px", 
              letterSpacing: "0.15em",
              fontFamily: "ui-monospace, monospace",
            }}>
              愛因斯坦
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
              Einstein
            </span>
          </div>
          <p style={{
            color: "#00d4ff",
            fontSize: "14px",
            marginBottom: "8px",
            lineHeight: 1.8,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}>
            "The distinction between past, present and future is only a stubbornly persistent illusion."
          </p>
          <p style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "13px",
            letterSpacing: "0.05em",
            fontFamily: "'Noto Serif SC', serif",
          }}>
            過去、現在與未來的區別，只是一種頑固的幻覺。
          </p>
          <div style={{
            marginTop: "16px",
            fontSize: "10px",
            letterSpacing: "0.2em",
            color: "rgba(0, 212, 255, 0.3)",
            fontFamily: "ui-monospace, monospace",
          }}>
            CLICK STAR FOR TIME WARP
          </div>
        </div>
      )}

      {/* Xi special tooltip */}
      {xiHovered && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(20,0,0,0.95)",
            border: "1px solid rgba(255, 32, 32, 0.4)",
            borderRadius: "8px",
            padding: "24px 32px",
            backdropFilter: "blur(20px)",
            zIndex: 100,
            maxWidth: "500px",
            textAlign: "center",
            animation: "fadeIn 0.5s ease",
            boxShadow: "0 0 80px rgba(255, 32, 32, 0.2)",
          }}
        >
          <div style={{
            fontSize: "10px",
            letterSpacing: "0.4em",
            color: "rgba(255, 32, 32, 0.6)",
            marginBottom: "12px",
            fontFamily: "'Noto Serif SC', serif",
          }}>
            中華 · SOVEREIGNTY
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "16px",
          }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#ff2020",
                boxShadow: "0 0 30px #ff2020, 0 0 60px rgba(255, 32, 32, 0.6)",
              }}
            />
            <span style={{ 
              color: "#ff2020", 
              fontSize: "18px", 
              letterSpacing: "0.15em",
              fontFamily: "'Noto Serif SC', 'STKaiti', serif",
              fontWeight: 700,
            }}>
              習近平
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
              Xi Jinping
            </span>
          </div>
          <p style={{
            color: "#ff2020",
            fontSize: "18px",
            marginBottom: "8px",
            lineHeight: 1.8,
            fontFamily: "'Noto Serif SC', 'STKaiti', serif",
            fontWeight: 700,
          }}>
            「擼起袖子加油幹。」
          </p>
          <p style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "12px",
            letterSpacing: "0.05em",
          }}>
            Roll up your sleeves and work hard.
          </p>
          <div style={{
            marginTop: "16px",
            fontSize: "10px",
            letterSpacing: "0.2em",
            color: "rgba(255, 32, 32, 0.4)",
            fontFamily: "ui-monospace, monospace",
          }}>
            CLICK STAR FOR GENESIS v2.0
          </div>
        </div>
      )}

      {/* System Update Flash Effect */}
      {showSystemUpdate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: "systemUpdateFlash 3s ease forwards",
            background: "rgba(0,0,0,0.95)",
          }}
        >
          <style>{`
            @keyframes systemUpdateFlash {
              0% { background: rgba(255, 32, 32, 0.8); }
              10% { background: rgba(0, 0, 0, 0.95); }
              20% { background: rgba(255, 32, 32, 0.3); }
              30% { background: rgba(0, 0, 0, 0.98); }
              100% { background: rgba(0, 0, 0, 0); pointer-events: none; }
            }
            @keyframes textReveal {
              0% { opacity: 0; transform: scale(0.8); }
              30% { opacity: 1; transform: scale(1.05); }
              50% { opacity: 1; transform: scale(1); }
              80% { opacity: 1; }
              100% { opacity: 0; }
            }
            @keyframes scanLine {
              0% { top: 0%; }
              100% { top: 100%; }
            }
          `}</style>
          
          {/* Scan line effect */}
          <div style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent, #ff2020, transparent)",
            animation: "scanLine 1s ease-out forwards",
            boxShadow: "0 0 20px #ff2020",
          }} />
          
          <div style={{
            animation: "textReveal 2.5s ease forwards",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: "12px",
              letterSpacing: "0.6em",
              color: "#ff2020",
              marginBottom: "24px",
              fontFamily: "ui-monospace, monospace",
            }}>
              ████ SYSTEM UPDATE ████
            </div>
            <div style={{
              fontSize: "36px",
              letterSpacing: "0.2em",
              color: "#fff",
              fontWeight: 700,
              textShadow: "0 0 60px rgba(255, 32, 32, 0.8)",
              marginBottom: "16px",
            }}>
              ORDER ESTABLISHED.
            </div>
            <div style={{
              fontSize: "24px",
              letterSpacing: "0.3em",
              color: "#ff2020",
              fontFamily: "ui-monospace, monospace",
            }}>
              GENESIS v2.0 SECURED
            </div>
            <div style={{
              marginTop: "32px",
              fontSize: "10px",
              letterSpacing: "0.5em",
              color: "rgba(255, 32, 32, 0.5)",
            }}>
              五星守护 · FIVE GUARDIANS ALIGNED
            </div>
          </div>
        </div>
      )}

      {/* Header - clickable to open upload */}
      <div 
        onClick={handleCenterDateClick}
        style={{
          position: "fixed",
          top: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          zIndex: 50,
          cursor: "pointer",
          transition: "all 0.3s ease",
          opacity: laoziHovered ? 0.3 : 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateX(-50%) scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateX(-50%) scale(1)";
        }}
      >
        <div style={{
          fontSize: "9px",
          letterSpacing: "0.5em",
          color: "rgba(255,255,255,0.3)",
          marginBottom: "6px",
        }}>
          NODE #009 · STARDUST GALLERY
        </div>
        <div style={{
          fontSize: "20px",
          letterSpacing: "0.2em",
          color: "#B76E79",
          fontWeight: 300,
          fontFamily: "'Playfair Display', Georgia, serif",
          transition: "text-shadow 0.3s ease",
        }}>
          1971.08.24
        </div>
        <div style={{
          fontSize: "12px",
          letterSpacing: "0.3em",
          color: "rgba(255,255,255,0.4)",
          marginTop: "8px",
        }}>
          东西方之桥
        </div>
        <div style={{
          fontSize: "8px",
          letterSpacing: "0.4em",
          color: "rgba(183,110,121,0.4)",
          marginTop: "12px",
        }}>
          ◇ CLICK TO INJECT MEMORY ◇
        </div>
      </div>

      {/* Footer hints */}
      {!accessGranted && (
        <div style={{
          position: "fixed",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "10px",
          letterSpacing: "0.3em",
          color: "rgba(255,255,255,0.2)",
          zIndex: 50,
        }}>
          AWAITING CONVERGENCE...
        </div>
      )}

      {accessGranted && !laoziHovered && (
        <div style={{
          position: "fixed",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "10px",
          letterSpacing: "0.3em",
          color: "rgba(183,110,121,0.5)",
          zIndex: 50,
        }}>
          {memoryPhotos.length > 0 
            ? `${memoryPhotos.length} MEMORY STAR${memoryPhotos.length > 1 ? 'S' : ''} · HOVER TO REVEAL`
            : "HOVER STARS TO REVEAL GUARDIANS"
          }
        </div>
      )}

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handlePhotoUpload}
        guardians={uploadGuardians}
      />

      {/* Memory Viewer */}
      <MemoryViewer
        photo={selectedMemoryPhoto}
        onClose={() => setSelectedMemoryPhoto(null)}
        guardianEffects={guardianEffects}
      />
    </div>
  );
};

export default StardustGalaxy;
