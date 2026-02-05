'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type AmbientSound = 'rain' | 'birds' | 'wind' | 'ocean' | 'forest' | 'none';

interface AudioState {
  isPlaying: boolean;
  volume: number;
  currentSound: AmbientSound;
}

// Generate ambient sounds using Web Audio API
function createAmbientAudioContext() {
  if (typeof window === 'undefined') return null;

  const AudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
  if (!AudioContext) return null;

  return new AudioContext();
}

/**
 * useAmbientAudio - Hook for managing ambient soundscapes
 * Uses Web Audio API to generate calming background sounds
 */
export function useAmbientAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    gainNode?: GainNode;
    oscillators?: OscillatorNode[];
    noiseNode?: AudioBufferSourceNode;
  }>({});

  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    volume: 0.3,
    currentSound: 'none',
  });

  // Create white/pink noise buffer for rain/wind effects
  const createNoiseBuffer = useCallback((ctx: AudioContext, type: 'white' | 'pink' | 'brown' = 'pink') => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'white') {
        data[i] = white * 0.5;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        // Brown noise
        data[i] = (b0 + white * 0.02) * 0.5;
        b0 = data[i];
      }
    }

    return buffer;
  }, []);

  // Create rain sound
  const createRainSound = useCallback((ctx: AudioContext, gainNode: GainNode) => {
    const noiseBuffer = createNoiseBuffer(ctx, 'pink');
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Add filter for rain-like sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    noiseSource.connect(filter);
    filter.connect(gainNode);
    noiseSource.start();

    return { noiseSource, filter };
  }, [createNoiseBuffer]);

  // Create bird sounds with chirping oscillators
  const createBirdSound = useCallback((ctx: AudioContext, gainNode: GainNode) => {
    const oscillators: OscillatorNode[] = [];

    const createChirp = () => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 2000 + Math.random() * 2000;

      oscGain.gain.setValueAtTime(0, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(gainNode);
      osc.start();

      // Random chirping pattern
      const chirp = () => {
        const now = ctx.currentTime;
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
        oscGain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.frequency.setValueAtTime(2000 + Math.random() * 2000, now);
      };

      const interval = setInterval(chirp, 500 + Math.random() * 2000);
      oscillators.push(osc);

      return { osc, oscGain, interval };
    };

    // Create multiple bird voices
    const birds = [createChirp(), createChirp(), createChirp()];

    return { oscillators, intervals: birds.map(b => b.interval) };
  }, []);

  // Create wind sound
  const createWindSound = useCallback((ctx: AudioContext, gainNode: GainNode) => {
    const noiseBuffer = createNoiseBuffer(ctx, 'brown');
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    // Modulate the filter for wind gusts
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 200;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    noiseSource.connect(filter);
    filter.connect(gainNode);
    noiseSource.start();

    return { noiseSource, filter, lfo };
  }, [createNoiseBuffer]);

  // Create ocean waves
  const createOceanSound = useCallback((ctx: AudioContext, gainNode: GainNode) => {
    const noiseBuffer = createNoiseBuffer(ctx, 'pink');
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    // Wave modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08; // Slow wave rhythm
    lfoGain.gain.value = 0.4;

    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    lfo.start();

    noiseSource.connect(filter);
    filter.connect(gainNode);
    noiseSource.start();

    return { noiseSource, filter, lfo };
  }, [createNoiseBuffer]);

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    if (nodesRef.current.noiseNode) {
      try {
        nodesRef.current.noiseNode.stop();
      } catch {}
    }
    if (nodesRef.current.oscillators) {
      nodesRef.current.oscillators.forEach(osc => {
        try {
          osc.stop();
        } catch {}
      });
    }
    nodesRef.current = {};
  }, []);

  // Play specific sound
  const playSound = useCallback((sound: AmbientSound) => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAmbientAudioContext();
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    stopAllSounds();

    if (sound === 'none') {
      setState(prev => ({ ...prev, isPlaying: false, currentSound: 'none' }));
      return;
    }

    const gainNode = ctx.createGain();
    gainNode.gain.value = state.volume;
    gainNode.connect(ctx.destination);
    nodesRef.current.gainNode = gainNode;

    switch (sound) {
      case 'rain':
        const rain = createRainSound(ctx, gainNode);
        nodesRef.current.noiseNode = rain.noiseSource;
        break;
      case 'birds':
        const birds = createBirdSound(ctx, gainNode);
        nodesRef.current.oscillators = birds.oscillators;
        break;
      case 'wind':
        const wind = createWindSound(ctx, gainNode);
        nodesRef.current.noiseNode = wind.noiseSource;
        break;
      case 'ocean':
        const ocean = createOceanSound(ctx, gainNode);
        nodesRef.current.noiseNode = ocean.noiseSource;
        break;
      case 'forest':
        // Combine rain and birds for forest ambiance
        const forestRain = createRainSound(ctx, gainNode);
        const forestBirds = createBirdSound(ctx, gainNode);
        nodesRef.current.noiseNode = forestRain.noiseSource;
        nodesRef.current.oscillators = forestBirds.oscillators;
        break;
    }

    setState(prev => ({ ...prev, isPlaying: true, currentSound: sound }));
  }, [state.volume, stopAllSounds, createRainSound, createBirdSound, createWindSound, createOceanSound]);

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (state.isPlaying) {
      stopAllSounds();
      setState(prev => ({ ...prev, isPlaying: false }));
    } else if (state.currentSound !== 'none') {
      playSound(state.currentSound);
    }
  }, [state.isPlaying, state.currentSound, playSound, stopAllSounds]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: clampedVolume }));

    if (nodesRef.current.gainNode) {
      nodesRef.current.gainNode.gain.value = clampedVolume;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllSounds();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAllSounds]);

  return {
    ...state,
    playSound,
    toggle,
    setVolume,
    stopAllSounds,
    availableSounds: ['rain', 'birds', 'wind', 'ocean', 'forest'] as AmbientSound[],
  };
}
