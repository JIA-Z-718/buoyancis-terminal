import React, { useRef, useState, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import type { MemoryPhoto } from "./PhotoInjectionSystem";

interface MemoryStarProps {
  photo: MemoryPhoto;
  index: number;
  onClick: (photo: MemoryPhoto, position: THREE.Vector3) => void;
  guardianColors: Record<string, string>;
}

// Individual Memory Star in 3D space
export const MemoryStar = ({ photo, index, onClick, guardianColors }: MemoryStarProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Position in orbit around center
  const orbitRadius = 6 + (index % 3) * 1.5;
  const orbitOffset = (index / 10) * Math.PI * 2;
  const orbitSpeed = 0.02 + (index % 5) * 0.005;
  const orbitHeight = (Math.sin(index * 0.7) * 2);
  
  // Guardian-based color
  const starColor = photo.guardianId && guardianColors[photo.guardianId] 
    ? guardianColors[photo.guardianId] 
    : "#ffd4a8";
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Orbit around center
    const x = Math.cos(time * orbitSpeed + orbitOffset) * orbitRadius;
    const z = Math.sin(time * orbitSpeed + orbitOffset) * orbitRadius * 0.5;
    const y = orbitHeight + Math.sin(time * 0.3 + index) * 0.3;
    
    groupRef.current.position.set(x, y, z);
    
    // Pulse effect
    if (coreRef.current) {
      const scale = hovered ? 1.8 : 1.2 + Math.sin(time * 2 + index) * 0.1;
      coreRef.current.scale.setScalar(scale);
    }
    
    if (glowRef.current) {
      const glowScale = hovered ? 3.5 : 2 + Math.sin(time * 1.5 + index) * 0.2;
      glowRef.current.scale.setScalar(glowScale);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.5 : 0.25;
    }
  });
  
  const handleClick = () => {
    if (groupRef.current) {
      onClick(photo, groupRef.current.position.clone());
    }
  };
  
  return (
    <group ref={groupRef}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial
          color={starColor}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Core */}
      <mesh
        ref={coreRef}
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
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshBasicMaterial color={starColor} />
      </mesh>
      
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshBasicMaterial
          color={starColor}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

interface MemoryViewerProps {
  photo: MemoryPhoto | null;
  onClose: () => void;
  guardianEffects: Record<string, string>;
}

// Full-screen Memory Viewer with Glassmorphism
export const MemoryViewer = ({ photo, onClose, guardianEffects }: MemoryViewerProps) => {
  const [showParticles, setShowParticles] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  useEffect(() => {
    if (photo) {
      setShowParticles(true);
      const timer = setTimeout(() => setShowParticles(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [photo]);
  
  const guardianEffect = photo?.guardianId ? guardianEffects[photo.guardianId] : null;
  
  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.95)",
            cursor: "pointer",
          }}
        >
          {/* Particle Gathering Effect */}
          {showParticles && (
            <ParticleGatherEffect imageUrl={photo.imageUrl} />
          )}
          
          {/* Guardian-themed overlay effect */}
          {guardianEffect === "water" && (
            <div className="water-ripple-effect" style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at center, transparent 0%, rgba(136, 204, 255, 0.05) 50%, transparent 100%)",
              animation: "waterRipple 3s ease-in-out infinite",
              pointerEvents: "none",
            }} />
          )}
          {guardianEffect === "order" && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(0deg, transparent 49%, rgba(255, 248, 231, 0.03) 50%, transparent 51%)",
              backgroundSize: "100% 20px",
              pointerEvents: "none",
            }} />
          )}
          {guardianEffect === "gold" && (
            <div style={{
              position: "absolute",
              inset: 0,
              boxShadow: "inset 0 0 200px rgba(212, 165, 116, 0.1)",
              pointerEvents: "none",
            }} />
          )}
          {guardianEffect === "time" && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at center, rgba(0, 212, 255, 0.05) 0%, transparent 70%)",
              animation: "timePulse 2s ease-in-out infinite",
              pointerEvents: "none",
            }} />
          )}
          {guardianEffect === "power" && (
            <div style={{
              position: "absolute",
              inset: 0,
              boxShadow: "inset 0 0 150px rgba(255, 32, 32, 0.08)",
              pointerEvents: "none",
            }} />
          )}
          
          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ delay: showParticles ? 1.5 : 0, duration: 0.5, type: "spring" }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "80vw",
              maxHeight: "80vh",
            }}
          >
            {/* Glassmorphism Card */}
            <div style={{
              background: "rgba(20, 20, 20, 0.7)",
              backdropFilter: "blur(30px)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
              boxShadow: "0 25px 100px rgba(0,0,0,0.5)",
            }}>
              {/* Image */}
              <div style={{ position: "relative" }}>
                <img
                  src={photo.imageUrl}
                  alt={photo.description}
                  onLoad={() => setImageLoaded(true)}
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "60vh",
                    objectFit: "contain",
                    opacity: imageLoaded && !showParticles ? 1 : 0,
                    transition: "opacity 0.5s ease",
                  }}
                />
              </div>
              
              {/* Metadata Overlay */}
              <div style={{
                padding: "24px 32px",
                background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
              }}>
                <div style={{
                  fontSize: "11px",
                  letterSpacing: "0.3em",
                  color: "rgba(183, 110, 121, 0.7)",
                  marginBottom: "8px",
                }}>
                  {photo.date}
                </div>
                <h3 style={{
                  fontSize: "20px",
                  color: "#fff",
                  margin: 0,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                }}>
                  {photo.description}
                </h3>
                {photo.guardianId && (
                  <div style={{
                    marginTop: "16px",
                    fontSize: "10px",
                    letterSpacing: "0.3em",
                    color: "rgba(255,255,255,0.4)",
                  }}>
                    GUARDIAN: {photo.guardianId.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Close hint */}
            <div style={{
              position: "absolute",
              bottom: "-40px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "10px",
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.3)",
            }}>
              CLICK ANYWHERE TO CLOSE
            </div>
          </motion.div>
          
          <style>{`
            @keyframes waterRipple {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.2); opacity: 0.3; }
            }
            @keyframes timePulse {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 0.8; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Particle Gathering Effect - particles form the image
const ParticleGatherEffect = ({ imageUrl }: { imageUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const img = new Image();
    img.src = imageUrl;
    
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;
      
      // Scale image to fit
      const maxWidth = canvas.width * 0.6;
      const maxHeight = canvas.height * 0.6;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      
      const sampleSize = 100;
      tempCanvas.width = sampleSize;
      tempCanvas.height = Math.round(sampleSize * (height / width));
      tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
      
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      
      interface Particle {
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        color: string;
        size: number;
      }
      
      const particles: Particle[] = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const startX = centerX - width / 2;
      const startY = centerY - height / 2;
      
      // Create particles from scattered positions to image positions
      for (let y = 0; y < tempCanvas.height; y += 1) {
        for (let x = 0; x < tempCanvas.width; x += 1) {
          const i = (y * tempCanvas.width + x) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const a = imageData.data[i + 3];
          
          if (a > 50) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 800 + 300;
            
            particles.push({
              x: centerX + Math.cos(angle) * distance,
              y: centerY + Math.sin(angle) * distance,
              targetX: startX + (x / tempCanvas.width) * width,
              targetY: startY + (y / tempCanvas.height) * height,
              color: `rgba(${r},${g},${b},${a / 255})`,
              size: 2,
            });
          }
        }
      }
      
      let progress = 0;
      
      const animate = () => {
        progress += 0.015;
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p) => {
          // Smooth ease-out
          const ease = 1 - Math.pow(1 - Math.min(progress, 1), 4);
          const currentX = p.x + (p.targetX - p.x) * ease;
          const currentY = p.y + (p.targetY - p.y) * ease;
          
          ctx.beginPath();
          ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });
        
        if (progress < 1.3) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    };
  }, [imageUrl]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2001,
        pointerEvents: "none",
      }}
    />
  );
};

export default MemoryStar;
