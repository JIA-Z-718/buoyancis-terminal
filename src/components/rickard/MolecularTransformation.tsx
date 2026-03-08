import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// Molecular node that transforms from organic to digital
const TransformingNode = ({ 
  position, 
  delay, 
  phase 
}: { 
  position: [number, number, number]; 
  delay: number;
  phase: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [localPhase, setLocalPhase] = useState(0);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const delayedTime = Math.max(0, time - delay);
    
    // Calculate transformation progress (0 = organic, 1 = digital)
    const transformProgress = Math.min(1, delayedTime * 0.3);
    setLocalPhase(transformProgress);
    
    // Organic: smooth rotation, Digital: sharp rotation
    const rotationSpeed = THREE.MathUtils.lerp(0.5, 2, transformProgress);
    meshRef.current.rotation.x += 0.01 * rotationSpeed;
    meshRef.current.rotation.y += 0.015 * rotationSpeed;
    
    // Scale pulsing - organic breathes, digital pulses sharply
    const organicPulse = Math.sin(time * 2) * 0.1;
    const digitalPulse = Math.sin(time * 8) * 0.05;
    const pulse = THREE.MathUtils.lerp(organicPulse, digitalPulse, transformProgress);
    meshRef.current.scale.setScalar(1 + pulse);
    
    // Position drift
    meshRef.current.position.y = position[1] + Math.sin(time + delay) * 0.2;
  });

  // Morph between sphere (organic) and box (digital)
  const geometry = useMemo(() => {
    return localPhase < 0.5 
      ? new THREE.IcosahedronGeometry(0.3, 2)
      : new THREE.OctahedronGeometry(0.35, 0);
  }, [localPhase]);

  // Color transition: warm amber to digital gold
  const color = useMemo(() => {
    return new THREE.Color().lerpColors(
      new THREE.Color("#D4A574"), // Organic amber
      new THREE.Color("#FFD700"), // Digital gold
      localPhase
    );
  }, [localPhase]);

  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <MeshDistortMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3 + localPhase * 0.4}
        distort={0.3 - localPhase * 0.25}
        speed={2 + localPhase * 3}
        roughness={0.4 - localPhase * 0.3}
        metalness={localPhase * 0.8}
      />
    </mesh>
  );
};

// Connection bonds between molecules using Line2 approach
const MolecularBond = ({ 
  start, 
  end 
}: { 
  start: [number, number, number]; 
  end: [number, number, number];
}) => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    // Pulsing scale effect
    const scale = 1 + Math.sin(time * 3) * 0.1;
    ref.current.scale.set(scale, scale, scale);
  });

  // Create a tube geometry for the bond
  const tubeGeometry = useMemo(() => {
    const path = new THREE.LineCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...end)
    );
    return new THREE.TubeGeometry(path, 1, 0.02, 8, false);
  }, [start, end]);

  return (
    <group ref={ref}>
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial 
          color="#FFB347" 
          transparent 
          opacity={0.5}
        />
      </mesh>
    </group>
  );
};

// Transformation particles
const TransformationParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 200;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Spread around the molecular structure
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1 + Math.random() * 2;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return [pos, vel];
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Spiral inward/outward motion
      const angle = time * 0.5 + i * 0.1;
      const radius = 1.5 + Math.sin(time + i) * 0.5;
      
      positions[i3] += Math.cos(angle) * 0.01;
      positions[i3 + 1] += velocities[i3 + 1] + Math.sin(time * 2 + i) * 0.005;
      positions[i3 + 2] += Math.sin(angle) * 0.01;
      
      // Reset particles that drift too far
      const dist = Math.sqrt(
        positions[i3] ** 2 + 
        positions[i3 + 1] ** 2 + 
        positions[i3 + 2] ** 2
      );
      
      if (dist > 4) {
        positions[i3] *= 0.3;
        positions[i3 + 1] *= 0.3;
        positions[i3 + 2] *= 0.3;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#FFD700"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// Central data core that emerges
const DataCore = () => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.02;
      coreRef.current.rotation.z = Math.sin(time) * 0.2;
      
      // Emerge after initial phase
      const emerge = Math.min(1, Math.max(0, (time - 2) * 0.5));
      coreRef.current.scale.setScalar(emerge * 0.5);
    }
    
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.03;
      ringRef.current.rotation.x = Math.sin(time * 0.5) * 0.3;
    }
  });

  return (
    <group>
      {/* Central core */}
      <mesh ref={coreRef}>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FF8C00"
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Orbital ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.7, 0.02, 16, 100]} />
        <meshStandardMaterial
          color="#B8860B"
          emissive="#DAA520"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};

// Main scene
const MolecularScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [phase, setPhase] = useState(0);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
    
    // Update global phase
    const time = state.clock.elapsedTime;
    setPhase(Math.min(1, time * 0.1));
  });

  // Molecular structure positions (oat-inspired hexagonal pattern)
  const nodePositions: [number, number, number][] = [
    [0, 0, 0],
    [1.2, 0.3, 0],
    [-1.2, 0.3, 0],
    [0.6, 1, 0.5],
    [-0.6, 1, 0.5],
    [0.6, -0.8, -0.3],
    [-0.6, -0.8, -0.3],
    [0, 0.5, 1],
    [0, -0.5, -1],
  ];

  // Bonds between nodes
  const bonds: [[number, number, number], [number, number, number]][] = [
    [nodePositions[0], nodePositions[1]],
    [nodePositions[0], nodePositions[2]],
    [nodePositions[0], nodePositions[7]],
    [nodePositions[0], nodePositions[8]],
    [nodePositions[1], nodePositions[3]],
    [nodePositions[2], nodePositions[4]],
    [nodePositions[1], nodePositions[5]],
    [nodePositions[2], nodePositions[6]],
    [nodePositions[3], nodePositions[4]],
    [nodePositions[5], nodePositions[6]],
  ];

  return (
    <group ref={groupRef}>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#FFD700" />
      <pointLight position={[-5, -5, 5]} intensity={0.5} color="#FFA500" />
      
      {/* Molecular nodes */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
        {nodePositions.map((pos, i) => (
          <TransformingNode
            key={i}
            position={pos}
            delay={i * 0.3}
            phase={phase}
          />
        ))}
        
        {/* Bonds */}
        {bonds.map(([start, end], i) => (
          <MolecularBond key={i} start={start} end={end} />
        ))}
      </Float>
      
      {/* Transformation particles */}
      <TransformationParticles />
      
      {/* Emerging data core */}
      <DataCore />
    </group>
  );
};

// Main component
const MolecularTransformation = () => {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-black to-black" />
      
      {/* 3D Canvas */}
      <div className="h-[500px] md:h-[600px] relative z-10">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <MolecularScene />
        </Canvas>
      </div>
      
      {/* Text overlay */}
      <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none z-20">
        <div className="text-center px-6">
          <p className="text-amber-400/60 text-sm tracking-widest uppercase mb-2">
            Molecular-Level Assets
          </p>
          <h3 className="text-2xl md:text-3xl text-white/90 font-light">
            From <span className="text-amber-400">Enzyme</span> to{" "}
            <span className="text-amber-300">Algorithm</span>
          </h3>
          <p className="text-white/50 text-sm mt-3 max-w-md mx-auto">
            Witnessing the transformation of biological precision into digital truth.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MolecularTransformation;
