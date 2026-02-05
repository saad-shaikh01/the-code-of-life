'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Bird,
  Wind,
  Waves,
  TreePine,
  X,
  ChevronUp,
} from 'lucide-react';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';

const soundIcons = {
  rain: CloudRain,
  birds: Bird,
  wind: Wind,
  ocean: Waves,
  forest: TreePine,
};

const soundLabels = {
  rain: 'Gentle Rain',
  birds: 'Bird Songs',
  wind: 'Soft Wind',
  ocean: 'Ocean Waves',
  forest: 'Forest Ambiance',
};

/**
 * AmbientAudioControl - Floating audio control widget
 * Allows users to toggle ambient sounds for a Zen experience
 */
export function AmbientAudioControl() {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    isPlaying,
    volume,
    currentSound,
    playSound,
    setVolume,
    stopAllSounds,
    availableSounds,
  } = useAmbientAudio();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-16 right-0 mb-2"
          >
            {/* Glass panel */}
            <div className="relative overflow-hidden rounded-2xl w-64">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
              <div className="absolute inset-0 rounded-2xl border border-white/10" />

              <div className="relative p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-white/80">
                    Ambient Sounds
                  </span>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                {/* Sound options */}
                <div className="space-y-2 mb-4">
                  {availableSounds.map((sound) => {
                    const Icon = soundIcons[sound as keyof typeof soundIcons];
                    const isActive = currentSound === sound && isPlaying;

                    return (
                      <motion.button
                        key={sound}
                        onClick={() => playSound(sound)}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-xl
                          transition-colors
                          ${isActive
                            ? 'bg-amber-500/20 border border-amber-500/30'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                          }
                        `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            isActive ? 'bg-amber-500/30 text-amber-400' : 'bg-white/10 text-white/60'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-sm ${
                            isActive ? 'text-amber-400' : 'text-white/70'
                          }`}
                        >
                          {soundLabels[sound as keyof typeof soundLabels]}
                        </span>

                        {/* Playing indicator */}
                        {isActive && (
                          <motion.div
                            className="ml-auto flex gap-0.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1 bg-amber-400 rounded-full"
                                animate={{
                                  height: [8, 16, 8],
                                }}
                                transition={{
                                  duration: 0.5,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                }}
                              />
                            ))}
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Volume control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-3
                      [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-amber-400
                    "
                  />
                </div>

                {/* Stop button */}
                {isPlaying && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={stopAllSounds}
                    className="w-full mt-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm transition-colors"
                  >
                    Stop All Sounds
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main toggle button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          relative p-4 rounded-full shadow-lg
          transition-colors
          ${isPlaying
            ? 'bg-amber-500/20 border-2 border-amber-500/50'
            : 'bg-black/60 border border-white/10'
          }
          backdrop-blur-xl
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulsing ring when playing */}
        {isPlaying && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-amber-400/50"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {isPlaying ? (
          <Volume2 className="w-5 h-5 text-amber-400" />
        ) : (
          <VolumeX className="w-5 h-5 text-white/60" />
        )}

        {/* Expand indicator */}
        <motion.div
          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-white/10"
          animate={{ rotate: isExpanded ? 180 : 0 }}
        >
          <ChevronUp className="w-3 h-3 text-white/60" />
        </motion.div>
      </motion.button>
    </div>
  );
}
