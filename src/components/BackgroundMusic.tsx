import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Music, Waves, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAmbientTones } from "@/hooks/useAmbientTones";
import { useCustomMusic, CustomMusic } from "@/hooks/useCustomMusic";
import AudioWaveform from "@/components/AudioWaveform";
import MusicUploader from "@/components/music/MusicUploader";
import CustomMusicList from "@/components/music/CustomMusicList";

type MusicTheme = "blue-forest" | "quantum" | "so-high";

// Try Supabase storage first, then fall back to local files
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const STORAGE_MUSIC_FILES: Record<MusicTheme, string> = {
  "blue-forest": `${SUPABASE_URL}/storage/v1/object/public/audio/blue-forest.mp3`,
  "quantum": `${SUPABASE_URL}/storage/v1/object/public/audio/quantum.mp3`,
  "so-high": `${SUPABASE_URL}/storage/v1/object/public/audio/so-high.mp3`,
};

const LOCAL_MUSIC_FILES: Record<MusicTheme, string> = {
  "blue-forest": "/audio/blue-forest.mp3",
  "quantum": "/audio/quantum.mp3",
  "so-high": "/audio/so-high.mp3",
};

interface BackgroundMusicProps {
  defaultTheme?: MusicTheme;
}

const BackgroundMusic = ({ defaultTheme = "blue-forest" }: BackgroundMusicProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showControls, setShowControls] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<MusicTheme>(defaultTheme);
  const [currentCustomMusic, setCurrentCustomMusic] = useState<CustomMusic | null>(null);
  const [usingSynthesis, setUsingSynthesis] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const fileAnalyserRef = useRef<AnalyserNode | null>(null);
  
  const { startTones, stopTones, setVolume: setSynthVolume, cleanup, getAnalyser } = useAmbientTones();
  const { customMusic, publicMusic, addMusic, removeMusic, renameMusic, reorderMusic, togglePublic } = useCustomMusic();

  const getOrCreateAudioElement = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      // Required for WebAudio analyser when loading from public storage/CDN.
      // Must be set before `src`.
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const ensureFileAnalyserGraph = useCallback(() => {
    const audio = getOrCreateAudioElement();

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      // Don't await; `resume()` must be initiated from a user gesture.
      ctx.resume().catch(() => {
        // Ignore: we will fall back to synthesized tones if file playback fails.
      });
    }

    if (!mediaSourceRef.current) {
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      mediaSourceRef.current = source;
      fileAnalyserRef.current = analyser;
    }

    return fileAnalyserRef.current;
  }, [getOrCreateAudioElement]);

  const tryPlayAudioFile = useCallback(async (theme: MusicTheme): Promise<boolean> => {
    // Try storage URL first, then local file
    const urls = [STORAGE_MUSIC_FILES[theme], LOCAL_MUSIC_FILES[theme]];
    const audio = getOrCreateAudioElement();

    // Keep element settings in sync
    audio.loop = true;
    audio.volume = volume;

    // Ensure analyser graph is attached to THIS audio element (single element reused)
    const analyser = ensureFileAnalyserGraph();

    for (const url of urls) {
      console.log(`[BackgroundMusic] Trying to play audio from: ${url}`);
      try {
        // Important: call play() immediately (within the click handler's async flow)
        // instead of waiting for canplaythrough; this avoids autoplay policy issues.
        audio.src = url;
        audio.load();
        const playPromise = audio.play();
        if (playPromise) {
          await playPromise;
        }

        console.log(`[BackgroundMusic] Successfully playing audio file: ${url}`);
        setAnalyserNode(analyser);
        setUsingSynthesis(false);
        return true;
      } catch (error) {
        console.log(`[BackgroundMusic] Audio file playback failed for ${url}:`, error);
        // try next URL
      }
    }

    console.log(`[BackgroundMusic] No audio files playable for theme ${theme}, falling back to synthesis`);
    return false;
  }, [ensureFileAnalyserGraph, getOrCreateAudioElement, volume]);

  const playSynthesis = useCallback((theme: MusicTheme) => {
    console.log(`[BackgroundMusic] Starting synthesized ambient for theme: ${theme}`);
    const result = startTones(theme, volume);
    console.log(`[BackgroundMusic] Synthesis started:`, result);
    setUsingSynthesis(true);
    // Get analyser from synthesis
    setTimeout(() => {
      const synthAnalyser = getAnalyser();
      console.log(`[BackgroundMusic] Synthesis analyser:`, synthAnalyser ? 'available' : 'null');
      setAnalyserNode(synthAnalyser);
    }, 100);
  }, [startTones, volume, getAnalyser]);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      // keep the element for reuse; just reset position
      try {
        audioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }
    stopTones();
    setAnalyserNode(null);
  }, [stopTones]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      stopAll();
      setIsPlaying(false);
      return;
    }

    // Try audio file first, fallback to synthesis
    const success = await tryPlayAudioFile(currentTheme);
    if (!success) {
      playSynthesis(currentTheme);
    }
    setIsPlaying(true);
  }, [isPlaying, currentTheme, tryPlayAudioFile, playSynthesis, stopAll]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (usingSynthesis) {
      setSynthVolume(newVolume);
    }
  }, [usingSynthesis, setSynthVolume]);

  const handleThemeChange = useCallback(async (theme: MusicTheme) => {
    if (theme === currentTheme && isPlaying && !currentCustomMusic) {
      togglePlay();
      return;
    }

    setCurrentTheme(theme);
    setCurrentCustomMusic(null);
    stopAll();

    // Try audio file first, fallback to synthesis
    const success = await tryPlayAudioFile(theme);
    if (!success) {
      playSynthesis(theme);
    }
    setIsPlaying(true);
  }, [currentTheme, currentCustomMusic, isPlaying, togglePlay, stopAll, tryPlayAudioFile, playSynthesis]);

  const playCustomMusic = useCallback(async (music: CustomMusic) => {
    if (currentCustomMusic?.id === music.id && isPlaying) {
      togglePlay();
      return;
    }

    stopAll();
    setCurrentCustomMusic(music);

    const audio = getOrCreateAudioElement();
    audio.loop = true;
    audio.volume = volume;
    audio.src = music.url;
    audio.load();

    try {
      const analyser = ensureFileAnalyserGraph();
      await audio.play();
      setAnalyserNode(analyser);
      setUsingSynthesis(false);
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play custom music:", error);
    }
  }, [currentCustomMusic, ensureFileAnalyserGraph, getOrCreateAudioElement, isPlaying, togglePlay, stopAll, volume]);

  const handleUploadComplete = useCallback((music: { name: string; url: string }) => {
    const newMusic = addMusic(music);
    setShowUploader(false);
    playCustomMusic(newMusic);
  }, [addMusic, playCustomMusic]);

  const handleRemoveCustomMusic = useCallback((id: string) => {
    if (currentCustomMusic?.id === id) {
      stopAll();
      setIsPlaying(false);
      setCurrentCustomMusic(null);
    }
    removeMusic(id);
  }, [currentCustomMusic, stopAll, removeMusic]);

  // Keyboard shortcut: M to toggle music
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key.toLowerCase() === "m" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <div
        className="relative"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Main toggle button */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlay}
                className={`
                  h-12 w-12 rounded-full backdrop-blur-md shadow-xl
                  border-2 transition-all duration-300
                  ${isPlaying 
                    ? 'bg-primary/20 border-primary/60 text-primary shadow-primary/25' 
                    : 'bg-background/90 border-primary/40 hover:border-primary/70 hover:bg-primary/10 animate-pulse-subtle'
                  }
                `}
                aria-label={isPlaying ? "Pause background music" : "Play background music"}
              >
                {isPlaying ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <Music className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-1.5">
              <span>{isPlaying ? "暫停音樂" : "播放背景音樂"}</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">M</kbd>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Pulsing ring indicator when not playing */}
        {!isPlaying && (
          <span className="absolute inset-0 rounded-full animate-ping-slow bg-primary/20 pointer-events-none" />
        )}

        {/* Expanded controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-12 bottom-0 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg min-w-[220px]"
            >
              <div className="space-y-3">
                {/* Waveform visualization */}
                <div className="flex justify-center py-1">
                  <AudioWaveform
                    analyserNode={analyserNode}
                    isPlaying={isPlaying}
                    barCount={20}
                    className="h-6"
                  />
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-2">
                  <VolumeX className="h-3 w-3 text-muted-foreground" />
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.01}
                    className="flex-1"
                  />
                  <Volume2 className="h-3 w-3 text-muted-foreground" />
                </div>

                {/* Theme buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {(["blue-forest", "quantum", "so-high"] as MusicTheme[]).map((theme) => (
                    <Button
                      key={theme}
                      variant={currentTheme === theme && isPlaying && !currentCustomMusic ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleThemeChange(theme)}
                      className="text-xs px-2 py-1 h-7 capitalize"
                    >
                      <Music className="h-3 w-3 mr-1" />
                      {theme.replace("-", " ")}
                    </Button>
                  ))}
                </div>

                {/* Custom music list */}
                <CustomMusicList
                  customMusic={customMusic}
                  publicMusic={publicMusic}
                  currentCustomMusic={currentCustomMusic}
                  isPlaying={isPlaying}
                  onPlay={playCustomMusic}
                  onRemove={handleRemoveCustomMusic}
                  onRename={renameMusic}
                  onReorder={reorderMusic}
                  onTogglePublic={togglePublic}
                />

                {/* Upload button / Uploader */}
                {showUploader ? (
                  <MusicUploader
                    onUploadComplete={handleUploadComplete}
                    onClose={() => setShowUploader(false)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploader(true)}
                    className="w-full h-7 text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    上傳自訂音樂
                  </Button>
                )}

                {/* Status indicator */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  {isPlaying && usingSynthesis && (
                    <>
                      <Waves className="h-3 w-3" />
                      <span>Synthesized ambient</span>
                    </>
                  )}
                  {isPlaying && currentCustomMusic && (
                    <span>正在播放: {currentCustomMusic.name}</span>
                  )}
                  {isPlaying && !usingSynthesis && !currentCustomMusic && (
                    <span>Playing audio file</span>
                  )}
                  {!isPlaying && (
                    <span>Click to play ambient music</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BackgroundMusic;
