import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import memoryPhoto from "@/assets/memory-young-mother.jpg";

// Peripheral nebula particles - black and white, circling the photo
const PeripheralNebula = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 10000;
  
  const { positions, colors, angles, radii, speeds, zOffsets } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const angles = new Float32Array(particleCount);
    const radii = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const zOffsets = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      // Start particles in a ring around the photo (minimum radius ~2.5)
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 8; // Between 2.5 and 10.5
      const z = (Math.random() - 0.5) * 4;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = z;
      
      angles[i] = angle;
      radii[i] = radius;
      speeds[i] = 0.02 + Math.random() * 0.03; // Slow orbital speed
      zOffsets[i] = Math.random() * Math.PI * 2;
      
      // Black and white gradient - mostly white with some gray
      const brightness = 0.3 + Math.random() * 0.7;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;
    }
    
    return { positions, colors, angles, radii, speeds, zOffsets };
  }, []);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < particleCount; i++) {
      // Update angle for orbital motion
      angles[i] += speeds[i] * 0.01;
      
      // Gentle z-axis oscillation
      const zWave = Math.sin(time * 0.2 + zOffsets[i]) * 0.3;
      
      positions[i * 3] = Math.cos(angles[i]) * radii[i];
      positions[i * 3 + 1] = Math.sin(angles[i]) * radii[i];
      positions[i * 3 + 2] += zWave * 0.001;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Core memory photo with parallax tilt and breathing glow
const CorePhoto = () => {
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  const texture = useLoader(THREE.TextureLoader, memoryPhoto);
  
  useEffect(() => {
    if (texture) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Get normalized mouse position (-1 to 1)
    const mouseX = (state.mouse.x * viewport.width) / viewport.width;
    const mouseY = (state.mouse.y * viewport.height) / viewport.height;
    
    // Apply 3D parallax tilt (max ~8 degrees)
    const maxTilt = 0.14; // ~8 degrees in radians
    groupRef.current.rotation.y = mouseX * maxTilt;
    groupRef.current.rotation.x = -mouseY * maxTilt * 0.7;
    
    // Breathing white outer glow
    if (outerGlowRef.current) {
      const breathe = 0.15 + Math.sin(time * 0.8) * 0.08;
      (outerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = breathe;
      
      // Slight scale pulse
      const glowScale = 1 + Math.sin(time * 0.8) * 0.02;
      outerGlowRef.current.scale.setScalar(glowScale);
    }
    
    // Frame subtle glow
    if (frameRef.current) {
      const frameGlow = 0.08 + Math.sin(time * 0.6) * 0.03;
      (frameRef.current.material as THREE.MeshBasicMaterial).opacity = frameGlow;
    }
  });
  
  // Photo dimensions (4:3 vintage aspect)
  const photoWidth = 2.4;
  const photoHeight = 1.8;
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Outer breathing glow - white */}
      <mesh ref={outerGlowRef} position={[0, 0, -0.03]}>
        <planeGeometry args={[photoWidth + 0.6, photoHeight + 0.6]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Secondary glow layer */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[photoWidth + 0.35, photoHeight + 0.35]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Frame border - subtle white */}
      <mesh ref={frameRef} position={[0, 0, -0.01]}>
        <planeGeometry args={[photoWidth + 0.12, photoHeight + 0.12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>
      
      {/* Main photo */}
      <mesh>
        <planeGeometry args={[photoWidth, photoHeight]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      
      {/* Subtle film grain overlay */}
      <FilmGrain width={photoWidth} height={photoHeight} />
    </group>
  );
};

// Minimal film grain effect
const FilmGrain = ({ width, height }: { width: number; height: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const grainShader = useMemo(() => ({
    uniforms: {
      time: { value: 0 },
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
      varying vec2 vUv;
      
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      
      void main() {
        vec2 st = vUv * 80.0 + time;
        float noise = random(st);
        gl_FragColor = vec4(vec3(noise), 0.04);
      }
    `,
  }), []);
  
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        material.uniforms.time.value = state.clock.elapsedTime * 8;
      }
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0.001]}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        {...grainShader}
        transparent
        blending={THREE.MultiplyBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// Main scene
const PureScene = () => {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <PeripheralNebula />
      <CorePhoto />
    </>
  );
};

// Pure Node 009 Gallery
const PureNode009 = () => {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#000000",
      overflow: "hidden",
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#000000" }}
      >
        <PureScene />
      </Canvas>
    </div>
  );
};

export default PureNode009;
