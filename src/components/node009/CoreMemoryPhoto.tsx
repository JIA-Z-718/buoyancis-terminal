import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import memoryPhoto from "@/assets/memory-young-mother.jpg";

interface CoreMemoryPhotoProps {
  xiHovered: boolean;
  confuciusHovered: boolean;
  onActivate?: () => void;
}

// Light leak particle for vintage film effect
const LightLeakParticle = ({ delay }: { delay: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(-delay);
  const yOffset = useRef((Math.random() - 0.5) * 1.5);
  const intensity = useRef(0.3 + Math.random() * 0.4);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    progressRef.current += delta * 0.3;
    
    // Reset when sweep completes
    if (progressRef.current > 3) {
      progressRef.current = -2 - Math.random() * 5; // Random delay before next sweep
      yOffset.current = (Math.random() - 0.5) * 1.5;
      intensity.current = 0.3 + Math.random() * 0.4;
    }
    
    const x = -2.5 + progressRef.current * 1.8;
    meshRef.current.position.x = x;
    meshRef.current.position.y = yOffset.current;
    
    // Fade in and out
    const fadeIn = Math.min(1, (progressRef.current + 1) * 2);
    const fadeOut = Math.max(0, 1 - (progressRef.current - 1.5) * 2);
    const opacity = Math.max(0, fadeIn * fadeOut * intensity.current);
    
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    
    // Slight scale variation
    const scale = 0.8 + Math.sin(state.clock.elapsedTime * 3 + delay) * 0.2;
    meshRef.current.scale.set(scale * 0.5, scale * 1.2, 1);
  });
  
  return (
    <mesh ref={meshRef} position={[-3, 0, 0.01]}>
      <planeGeometry args={[0.4, 0.8]} />
      <meshBasicMaterial
        color="#ff6b35"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// Orange/red light leak flare
const LightLeakFlare = ({ delay }: { delay: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(-delay);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    progressRef.current += delta * 0.15;
    
    if (progressRef.current > 4) {
      progressRef.current = -3 - Math.random() * 8;
    }
    
    const x = -3 + progressRef.current * 1.5;
    meshRef.current.position.x = x;
    
    // Large sweeping flare
    const fadeIn = Math.min(1, (progressRef.current + 1));
    const fadeOut = Math.max(0, 1 - (progressRef.current - 2) * 0.5);
    const opacity = Math.max(0, fadeIn * fadeOut * 0.15);
    
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
  });
  
  return (
    <mesh ref={meshRef} position={[-3, 0, 0.005]}>
      <planeGeometry args={[2, 2.5]} />
      <meshBasicMaterial
        color="#ff4500"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// Film grain overlay
const FilmGrain = ({ visible }: { visible: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const noiseRef = useRef(0);
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Animate UV offset for grain movement
    noiseRef.current += 0.1;
    const material = meshRef.current.material as THREE.ShaderMaterial;
    if (material.uniforms) {
      material.uniforms.time.value = noiseRef.current;
    }
  });
  
  const grainShader = useMemo(() => ({
    uniforms: {
      time: { value: 0 },
      opacity: { value: 0.08 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float opacity;
      varying vec2 vUv;
      
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      
      void main() {
        vec2 st = vUv * 100.0 + time;
        float noise = random(st);
        gl_FragColor = vec4(vec3(noise), opacity);
      }
    `,
  }), []);
  
  if (!visible) return null;
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0.02]}>
      <planeGeometry args={[2.2, 1.65]} />
      <shaderMaterial
        {...grainShader}
        transparent
        blending={THREE.MultiplyBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// Red star illumination from Xi
const RedStarIllumination = ({ visible }: { visible: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const opacityRef = useRef(0);
  
  useFrame((state, delta) => {
    const targetOpacity = visible ? 0.8 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 3;
    
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacityRef.current;
      
      // Pulsing
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(pulse);
    }
    
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = opacityRef.current * 0.4;
      const glowPulse = 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      glowRef.current.scale.setScalar(glowPulse);
    }
  });
  
  // Create 5-pointed star shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.12;
    const innerRadius = 0.05;
    const points = 5;
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();
    return shape;
  }, []);
  
  return (
    <group position={[0, 0.95, 0.03]}>
      {/* Glow */}
      <mesh ref={glowRef}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial
          color="#ff2020"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Star */}
      <mesh ref={meshRef}>
        <shapeGeometry args={[starShape]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// Family member label component
const FamilyLabel = ({ 
  text, 
  position, 
  visible, 
  delay = 0 
}: { 
  text: string; 
  position: [number, number, number]; 
  visible: boolean;
  delay?: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const opacityRef = useRef(0);
  const scaleRef = useRef(0);
  const delayTimerRef = useRef(0);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Handle delay
    if (visible) {
      delayTimerRef.current += delta;
    } else {
      delayTimerRef.current = 0;
    }
    
    const shouldShow = visible && delayTimerRef.current > delay;
    const targetOpacity = shouldShow ? 1 : 0;
    const targetScale = shouldShow ? 1 : 0.5;
    
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 4;
    scaleRef.current += (targetScale - scaleRef.current) * delta * 5;
    
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacityRef.current;
    meshRef.current.scale.setScalar(scaleRef.current);
    
    // Gentle floating
    const floatY = Math.sin(state.clock.elapsedTime * 1.5 + delay * 2) * 0.02;
    meshRef.current.position.y = position[1] + floatY;
  });
  
  return (
    <group position={position}>
      {/* Glow background */}
      <mesh ref={meshRef} position={[0, 0, 0.03]}>
        <planeGeometry args={[0.35, 0.18]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// Main Core Memory Photo component
export const CoreMemoryPhoto = ({ xiHovered, confuciusHovered, onActivate }: CoreMemoryPhotoProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const photoRef = useRef<THREE.Mesh>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const sepiaOverlayRef = useRef<THREE.Mesh>(null);
  const depthBlurRef = useRef<THREE.Mesh>(null);
  const [isActive, setIsActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const activeProgressRef = useRef(0);
  const hoverScaleRef = useRef(1);
  
  // Load the texture
  const texture = useLoader(THREE.TextureLoader, memoryPhoto);
  
  useEffect(() => {
    if (texture) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Gentle floating animation
    const time = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(time * 0.3) * 0.05;
    groupRef.current.rotation.z = Math.sin(time * 0.2) * 0.01;
    
    // Hover scale
    const targetScale = hovered ? 1.05 : 1;
    hoverScaleRef.current += (targetScale - hoverScaleRef.current) * delta * 5;
    groupRef.current.scale.setScalar(hoverScaleRef.current);
    
    // Active state transition (depth effect)
    const targetActive = isActive ? 1 : 0;
    activeProgressRef.current += (targetActive - activeProgressRef.current) * delta * 3;
    
    // Depth blur overlay opacity
    if (depthBlurRef.current) {
      (depthBlurRef.current.material as THREE.MeshBasicMaterial).opacity = activeProgressRef.current * 0.3;
    }
    
    // Sepia overlay always visible
    if (sepiaOverlayRef.current) {
      (sepiaOverlayRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15;
    }
    
    // Frame glow when active
    if (frameRef.current) {
      const glowIntensity = activeProgressRef.current * 0.3 + (hovered ? 0.2 : 0.1);
      (frameRef.current.material as THREE.MeshBasicMaterial).opacity = glowIntensity;
    }
  });
  
  const handleClick = () => {
    setIsActive(prev => !prev);
    onActivate?.();
  };
  
  // Calculate aspect ratio (assuming 4:3 for vintage photo)
  const photoWidth = 2;
  const photoHeight = 1.5;
  
  // Family member positions (relative to photo center)
  const familyLabels = [
    { text: "姥姥", position: [0, 0.45, 0.04] as [number, number, number], delay: 0 },      // Back (top)
    { text: "媽媽", position: [0.55, 0, 0.04] as [number, number, number], delay: 0.15 },   // Right
    { text: "二舅", position: [0, -0.1, 0.04] as [number, number, number], delay: 0.3 },    // Center
    { text: "小舅舅", position: [-0.55, 0, 0.04] as [number, number, number], delay: 0.45 }, // Left
  ];
  
  return (
    <group ref={groupRef} position={[0, 0, 0.5]}>
      {/* Golden frame border */}
      <mesh ref={frameRef} position={[0, 0, -0.01]}>
        <planeGeometry args={[photoWidth + 0.15, photoHeight + 0.15]} />
        <meshBasicMaterial
          color="#d4af37"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Main photo */}
      <mesh
        ref={photoRef}
        onClick={handleClick}
        onPointerEnter={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <planeGeometry args={[photoWidth, photoHeight]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      
      {/* Sepia tone overlay */}
      <mesh ref={sepiaOverlayRef} position={[0, 0, 0.001]}>
        <planeGeometry args={[photoWidth, photoHeight]} />
        <meshBasicMaterial
          color="#8B7355"
          transparent
          opacity={0.15}
          blending={THREE.MultiplyBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Depth blur overlay (simulates background blur when clicked) */}
      <mesh ref={depthBlurRef} position={[0, 0, 0.002]}>
        <planeGeometry args={[photoWidth, photoHeight]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      
      {/* Film grain overlay */}
      <FilmGrain visible={true} />
      
      {/* Light leak particles */}
      {[0, 2, 5, 8, 12].map((delay, i) => (
        <LightLeakParticle key={`particle-${i}`} delay={delay} />
      ))}
      
      {/* Light leak flares */}
      {[0, 6, 14].map((delay, i) => (
        <LightLeakFlare key={`flare-${i}`} delay={delay} />
      ))}
      
      {/* Xi's red star at top */}
      <RedStarIllumination visible={xiHovered || isActive} />
      
      {/* Family member labels - appear on click */}
      {familyLabels.map((label, i) => (
        <FamilyLabel
          key={`family-${i}`}
          text={label.text}
          position={label.position}
          visible={isActive}
          delay={label.delay}
        />
      ))}
      
      {/* Vignette effect */}
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[photoWidth + 0.1, photoHeight + 0.1]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.25}
          blending={THREE.MultiplyBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// Confucius quote overlay (rendered in HTML layer)
export const ConfuciusQuoteOverlay = ({ visible }: { visible: boolean }) => {
  const [opacity, setOpacity] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(prev => {
        const target = visible ? 1 : 0;
        return prev + (target - prev) * 0.1;
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [visible]);
  
  if (opacity < 0.01) return null;
  
  return (
    <div
      style={{
        position: "fixed",
        bottom: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: opacity,
        transition: "opacity 0.5s ease",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: "'Noto Serif SC', 'Songti SC', serif",
          fontSize: "18px",
          color: "#fff8e7",
          textAlign: "center",
          letterSpacing: "0.15em",
          textShadow: "0 0 20px rgba(255, 248, 231, 0.5)",
          padding: "16px 32px",
          background: "linear-gradient(to right, transparent, rgba(0,0,0,0.5), transparent)",
        }}
      >
        父母之年，不可不知也
      </div>
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "11px",
          color: "rgba(255, 248, 231, 0.5)",
          textAlign: "center",
          letterSpacing: "0.3em",
          marginTop: "8px",
        }}
      >
        THE KNOWING OF PARENTS' AGE
      </div>
    </div>
  );
};

// Family tree labels overlay (rendered in HTML layer for crisp Chinese text)
export const FamilyTreeLabelsOverlay = ({ visible }: { visible: boolean }) => {
  const [opacity, setOpacity] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(prev => {
        const target = visible ? 1 : 0;
        return prev + (target - prev) * 0.1;
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [visible]);
  
  if (opacity < 0.01) return null;
  
  const labels = [
    { text: "姥姥", position: { top: "32%", left: "50%" }, delay: 0 },      // Back (grandmother)
    { text: "媽媽", position: { top: "48%", left: "62%" }, delay: 150 },    // Right (mother)
    { text: "二舅", position: { top: "52%", left: "50%" }, delay: 300 },    // Center (second uncle)
    { text: "小舅舅", position: { top: "48%", left: "38%" }, delay: 450 },  // Left (little uncle)
  ];
  
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {labels.map((label, i) => (
        <div
          key={`label-${i}`}
          style={{
            position: "absolute",
            top: label.position.top,
            left: label.position.left,
            transform: "translate(-50%, -50%)",
            opacity: opacity,
            animation: visible ? `fadeInUp 0.5s ease ${label.delay}ms forwards` : undefined,
          }}
        >
          <div
            style={{
              fontFamily: "'Noto Serif SC', 'Songti SC', 'SimSun', serif",
              fontSize: "14px",
              color: "#fff8e7",
              textAlign: "center",
              letterSpacing: "0.1em",
              textShadow: "0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.4)",
              padding: "6px 12px",
              background: "linear-gradient(135deg, rgba(0,0,0,0.7), rgba(20,20,20,0.6))",
              borderRadius: "4px",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              backdropFilter: "blur(4px)",
            }}
          >
            {label.text}
          </div>
        </div>
      ))}
      
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translate(-50%, -40%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}
      </style>
    </div>
  );
};
