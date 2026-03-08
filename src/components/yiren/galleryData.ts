// Shared data and types for the Private Gallery

export interface GalleryMemory {
  id: number;
  src: string;
  alt: string;
  caption: string;
  captionEn: string;
}

export interface FloatingPosition {
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: number;
}

export const placeholderMemories: GalleryMemory[] = [
  { id: 1, src: "/placeholder.svg", alt: "Memory 1", caption: "第一個記憶", captionEn: "The First Memory" },
  { id: 2, src: "/placeholder.svg", alt: "Memory 2", caption: "家的溫暖", captionEn: "Warmth of Home" },
  { id: 3, src: "/placeholder.svg", alt: "Memory 3", caption: "東西方的橋樑", captionEn: "Bridge Between Worlds" },
  { id: 4, src: "/placeholder.svg", alt: "Memory 4", caption: "智慧的傳承", captionEn: "Wisdom Passed Down" },
  { id: 5, src: "/placeholder.svg", alt: "Memory 5", caption: "永恆的愛", captionEn: "Eternal Love" },
];

export const floatingPositions: FloatingPosition[] = [
  { x: -20, y: -15, z: 0, rotation: -3, scale: 1 },
  { x: 25, y: 10, z: 10, rotation: 2, scale: 0.9 },
  { x: -15, y: 25, z: -5, rotation: -1, scale: 0.85 },
  { x: 30, y: -20, z: 5, rotation: 4, scale: 0.95 },
  { x: -5, y: 35, z: -10, rotation: -2, scale: 0.8 },
];
