import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface MemoryPhoto {
  id: string;
  imageUrl: string;
  description: string;
  date: string;
  guardianId: string | null; // laozi, confucius, likashing, einstein, xi
  createdAt: number;
}

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (photo: MemoryPhoto) => void;
  guardians: { id: string; name: string; nameCn: string; color: string }[];
}

const PhotoUploadModal = ({ isOpen, onClose, onUpload, guardians }: PhotoUploadModalProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [selectedGuardian, setSelectedGuardian] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showParticleEffect, setShowParticleEffect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }, []);

  const processFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return;
    
    setIsUploading(true);
    setShowParticleEffect(true);
    
    // Simulate particle explosion effect delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const photo: MemoryPhoto = {
      id: `memory-${Date.now()}`,
      imageUrl: preview,
      description: description || "A treasured memory",
      date: date || new Date().toISOString().split('T')[0],
      guardianId: selectedGuardian,
      createdAt: Date.now(),
    };
    
    onUpload(photo);
    
    // Reset
    setSelectedFile(null);
    setPreview(null);
    setDescription("");
    setDate("");
    setSelectedGuardian(null);
    setIsUploading(false);
    setShowParticleEffect(false);
    onClose();
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setPreview(null);
      setDescription("");
      setDate("");
      setSelectedGuardian(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.95)",
            backdropFilter: "blur(20px)",
          }}
          onClick={handleClose}
        >
          {/* Particle Explosion Effect */}
          {showParticleEffect && <ParticleExplosion imageUrl={preview!} />}
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(10,10,10,0.95)",
              border: "1px solid rgba(183, 110, 121, 0.3)",
              borderRadius: "16px",
              padding: "40px",
              maxWidth: "600px",
              width: "90%",
              boxShadow: "0 0 100px rgba(183, 110, 121, 0.1)",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{
                fontSize: "10px",
                letterSpacing: "0.5em",
                color: "rgba(183, 110, 121, 0.6)",
                marginBottom: "12px",
              }}>
                NODE #009 · SECURE UPLOAD
              </div>
              <h2 style={{
                fontSize: "24px",
                letterSpacing: "0.15em",
                color: "#B76E79",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 300,
                margin: 0,
              }}>
                INJECT MEMORY FRAGMENT
              </h2>
            </div>

            {!preview ? (
              /* Drag & Drop Zone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#B76E79' : 'rgba(183, 110, 121, 0.3)'}`,
                  borderRadius: "12px",
                  padding: "60px 40px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "rgba(183, 110, 121, 0.05)" : "transparent",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{
                  fontSize: "48px",
                  marginBottom: "16px",
                  opacity: dragOver ? 1 : 0.5,
                }}>
                  ◇
                </div>
                <div style={{
                  fontSize: "14px",
                  letterSpacing: "0.2em",
                  color: dragOver ? "#B76E79" : "rgba(255,255,255,0.5)",
                  marginBottom: "8px",
                }}>
                  DROP IMAGE HERE
                </div>
                <div style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.1em",
                }}>
                  or click to select
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>
            ) : (
              /* Preview & Metadata */
              <div>
                {/* Image Preview */}
                <div style={{
                  position: "relative",
                  marginBottom: "24px",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}>
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      maxHeight: "250px",
                      objectFit: "cover",
                      filter: isUploading ? "blur(10px)" : "none",
                      transition: "filter 0.5s ease",
                    }}
                  />
                  {isUploading && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.7)",
                    }}>
                      <div style={{
                        fontSize: "12px",
                        letterSpacing: "0.3em",
                        color: "#B76E79",
                        animation: "pulse 1s ease infinite",
                      }}>
                        FRAGMENTING INTO STARDUST...
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <input
                  type="text"
                  placeholder="Memory description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(183, 110, 121, 0.2)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "14px",
                    marginBottom: "16px",
                    outline: "none",
                  }}
                />

                {/* Date */}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isUploading}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(183, 110, 121, 0.2)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "14px",
                    marginBottom: "24px",
                    outline: "none",
                  }}
                />

                {/* Guardian Selection */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{
                    fontSize: "10px",
                    letterSpacing: "0.3em",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: "12px",
                  }}>
                    ASSIGN GUARDIAN (OPTIONAL)
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}>
                    {guardians.map((guardian) => (
                      <button
                        key={guardian.id}
                        onClick={() => setSelectedGuardian(
                          selectedGuardian === guardian.id ? null : guardian.id
                        )}
                        disabled={isUploading}
                        style={{
                          padding: "8px 16px",
                          background: selectedGuardian === guardian.id 
                            ? guardian.color 
                            : "rgba(255,255,255,0.05)",
                          border: `1px solid ${guardian.color}`,
                          borderRadius: "20px",
                          color: selectedGuardian === guardian.id ? "#000" : guardian.color,
                          fontSize: "11px",
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {guardian.nameCn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "16px" }}>
                  <button
                    onClick={handleClose}
                    disabled={isUploading}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "12px",
                      letterSpacing: "0.2em",
                      cursor: isUploading ? "not-allowed" : "pointer",
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isUploading}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: isUploading 
                        ? "rgba(183, 110, 121, 0.3)" 
                        : "linear-gradient(135deg, #B76E79, #d4a574)",
                      border: "none",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "12px",
                      letterSpacing: "0.2em",
                      cursor: isUploading ? "not-allowed" : "pointer",
                      boxShadow: "0 0 30px rgba(183, 110, 121, 0.3)",
                    }}
                  >
                    {isUploading ? "INJECTING..." : "INJECT MEMORY"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Particle Explosion Effect Component
const ParticleExplosion = ({ imageUrl }: { imageUrl: string }) => {
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
      // Sample pixels from image
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;
      
      const sampleSize = 80;
      tempCanvas.width = sampleSize;
      tempCanvas.height = sampleSize;
      tempCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
      
      const imageData = tempCtx.getImageData(0, 0, sampleSize, sampleSize);
      const particles: Array<{
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        color: string;
        size: number;
        speed: number;
      }> = [];
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Create particles from image pixels
      for (let y = 0; y < sampleSize; y += 2) {
        for (let x = 0; x < sampleSize; x += 2) {
          const i = (y * sampleSize + x) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const a = imageData.data[i + 3];
          
          if (a > 100) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 500 + 200;
            
            particles.push({
              x: centerX,
              y: centerY,
              targetX: centerX + Math.cos(angle) * distance,
              targetY: centerY + Math.sin(angle) * distance,
              color: `rgba(${r},${g},${b},${a / 255})`,
              size: Math.random() * 3 + 1,
              speed: Math.random() * 0.03 + 0.02,
            });
          }
        }
      }
      
      let progress = 0;
      
      const animate = () => {
        progress += 0.02;
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p) => {
          const ease = 1 - Math.pow(1 - Math.min(progress, 1), 3);
          const currentX = p.x + (p.targetX - p.x) * ease;
          const currentY = p.y + (p.targetY - p.y) * ease;
          
          ctx.beginPath();
          ctx.arc(currentX, currentY, p.size * (1 - ease * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          
          // Add glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
        });
        
        if (progress < 1.5) {
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
        zIndex: 1001,
        pointerEvents: "none",
      }}
    />
  );
};

export { PhotoUploadModal };
export default PhotoUploadModal;
