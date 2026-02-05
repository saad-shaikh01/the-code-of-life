'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, User, ChevronRight, CheckCircle } from 'lucide-react';
import {
  BreathingContainer,
  BreathingText,
  PulsingGlow,
  ParticleEffects,
  GlowBurst,
  FloatingParticles,
  SuccessRipple,
  WisdomCard,
  GlassPanel,
  GlassButton,
  AmbientAudioControl,
  GrowthAvatar,
} from '@/components/zen';
import { Button } from '@/components/ui/button';

type DemoScreen = 'home' | 'puzzle' | 'profile';

export default function ZenDemoPage() {
  const [currentScreen, setCurrentScreen] = useState<DemoScreen>('home');
  const [showParticles, setShowParticles] = useState(false);
  const [showWisdom, setShowWisdom] = useState(false);
  const [puzzleComplete, setPuzzleComplete] = useState(false);

  // Simulate correct answer
  const handleCorrectAnswer = () => {
    setShowParticles(true);
    setTimeout(() => {
      setShowParticles(false);
      setPuzzleComplete(true);
    }, 1500);
  };

  // Reset puzzle state
  const resetPuzzle = () => {
    setPuzzleComplete(false);
    setShowWisdom(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <FloatingParticles count={20} />
      <PulsingGlow color="amber" intensity="low" />

      {/* Particle effects layer */}
      <ParticleEffects trigger={showParticles} type="celebration" intensity={30} />
      <GlowBurst trigger={showParticles} />
      <SuccessRipple trigger={showParticles} />

      {/* Ambient audio control */}
      <AmbientAudioControl />

      {/* Navigation */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
        <GlassPanel className="px-2 py-2">
          <div className="flex gap-2">
            {(['home', 'puzzle', 'profile'] as DemoScreen[]).map((screen) => (
              <button
                key={screen}
                onClick={() => {
                  setCurrentScreen(screen);
                  resetPuzzle();
                }}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                  ${currentScreen === screen
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-white/60 hover:text-white/80'
                  }
                `}
              >
                {screen}
              </button>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Screen content */}
      <AnimatePresence mode="wait">
        {currentScreen === 'home' && (
          <BreathingContainer key="home" className="pt-32 px-4">
            <ZenHomeScreen onNavigate={setCurrentScreen} />
          </BreathingContainer>
        )}

        {currentScreen === 'puzzle' && (
          <BreathingContainer key="puzzle" className="pt-32 px-4">
            <ZenPuzzleScreen
              onCorrectAnswer={handleCorrectAnswer}
              showWisdom={showWisdom}
              setShowWisdom={setShowWisdom}
              puzzleComplete={puzzleComplete}
            />
          </BreathingContainer>
        )}

        {currentScreen === 'profile' && (
          <BreathingContainer key="profile" className="pt-32 px-4">
            <ZenProfileScreen />
          </BreathingContainer>
        )}
      </AnimatePresence>
    </div>
  );
}

// Screen 1: Zen Home
function ZenHomeScreen({ onNavigate }: { onNavigate: (screen: DemoScreen) => void }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <BreathingText className="text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
            The Code of Life
          </span>
        </BreathingText>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xl text-white/60 mb-12"
      >
        Decode wisdom. Transform your mind.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid md:grid-cols-3 gap-6"
      >
        <GlassPanel glow glowColor="amber" className="cursor-pointer" >
          <motion.div
            className="p-6 text-center"
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('puzzle')}
          >
            <div className="p-4 rounded-full bg-amber-500/20 w-fit mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Daily Wisdom</h3>
            <p className="text-sm text-white/50">
              Unlock today&apos;s reflection
            </p>
          </motion.div>
        </GlassPanel>

        <GlassPanel glow glowColor="purple">
          <motion.div
            className="p-6 text-center"
            whileHover={{ scale: 1.02 }}
          >
            <div className="p-4 rounded-full bg-purple-500/20 w-fit mx-auto mb-4">
              <Trophy className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Challenge Mode</h3>
            <p className="text-sm text-white/50">
              Test your skills
            </p>
          </motion.div>
        </GlassPanel>

        <GlassPanel glow glowColor="green" className="cursor-pointer">
          <motion.div
            className="p-6 text-center"
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('profile')}
          >
            <div className="p-4 rounded-full bg-green-500/20 w-fit mx-auto mb-4">
              <User className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your Growth</h3>
            <p className="text-sm text-white/50">
              Watch your journey unfold
            </p>
          </motion.div>
        </GlassPanel>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12"
      >
        <p className="text-sm text-white/30 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Enable ambient sounds for the full Zen experience
        </p>
      </motion.div>
    </div>
  );
}

// Screen 2: Zen Puzzle
function ZenPuzzleScreen({
  onCorrectAnswer,
  showWisdom,
  setShowWisdom,
  puzzleComplete,
}: {
  onCorrectAnswer: () => void;
  showWisdom: boolean;
  setShowWisdom: (show: boolean) => void;
  puzzleComplete: boolean;
}) {
  const [userInput, setUserInput] = useState('');
  const correctAnswer = 'mindfulness';

  const handleSubmit = () => {
    if (userInput.toLowerCase().trim() === correctAnswer) {
      onCorrectAnswer();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!puzzleComplete ? (
          <motion.div
            key="puzzle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center mb-8">
              <BreathingText className="text-2xl font-semibold text-white/80">
                Decode the Pattern
              </BreathingText>
            </div>

            <GlassPanel glow glowColor="amber" className="mb-8">
              <div className="p-8">
                <div className="text-center mb-6">
                  <p className="text-sm text-white/40 mb-4">Encrypted Pattern:</p>
                  <motion.p
                    className="text-3xl font-mono tracking-widest text-amber-400"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    ◈ ● ○ ◇ ◆ ● ◈ ○ ◇ ◆ ◈
                  </motion.p>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-white/40 mb-2">Hint: A state of active, open attention on the present</p>
                </div>

                <div className="flex gap-4">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Enter your answer..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                  <GlassButton variant="primary" onClick={handleSubmit}>
                    Submit
                  </GlassButton>
                </div>

                <p className="text-xs text-white/30 text-center mt-4">
                  Demo: Type &quot;mindfulness&quot; to see the success effect
                </p>
              </div>
            </GlassPanel>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-flex p-4 rounded-full bg-green-500/20 mb-4"
              >
                <CheckCircle className="w-12 h-12 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                Wisdom Unlocked!
              </h2>
              <p className="text-white/60">+50 Growth Points</p>
            </div>

            <WisdomCard
              wisdom="Mindfulness is the aware, balanced acceptance of the present experience. It isn't more complicated than that. It is opening to or receiving the present moment, pleasant or unpleasant, just as it is, without either clinging to it or rejecting it."
              source="The Code of Life"
              chapter={7}
              isRevealed={showWisdom}
              onReveal={() => setShowWisdom(true)}
              className="mb-8"
            />

            <div className="flex justify-center gap-4">
              <GlassButton onClick={() => window.location.reload()}>
                Try Another
              </GlassButton>
              <GlassButton variant="primary">
                Continue Journey <ChevronRight className="w-4 h-4 inline ml-1" />
              </GlassButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Screen 3: Zen Profile with Growth Avatar
function ZenProfileScreen() {
  const [selectedStage, setSelectedStage] = useState(3);

  const stages = [
    { stage: 1, points: 50, label: 'Seed' },
    { stage: 2, points: 250, label: 'Sprout' },
    { stage: 3, points: 800, label: 'Sapling' },
    { stage: 4, points: 2500, label: 'Young Tree' },
    { stage: 5, points: 6000, label: 'Mature Tree' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <BreathingText className="text-2xl font-semibold text-white/80">
          Your Growth Journey
        </BreathingText>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Avatar display */}
        <GlassPanel glow glowColor="green">
          <div className="p-8 flex justify-center">
            <GrowthAvatar
              growthPoints={stages[selectedStage - 1].points}
              growthStage={selectedStage}
              size="xl"
              animated={true}
            />
          </div>
        </GlassPanel>

        {/* Stage selector */}
        <div>
          <GlassPanel className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white/80">
                Growth Stages
              </h3>
              <div className="space-y-3">
                {stages.map((s) => (
                  <motion.button
                    key={s.stage}
                    onClick={() => setSelectedStage(s.stage)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-xl
                      transition-colors
                      ${selectedStage === s.stage
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${selectedStage === s.stage ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'}
                      `}>
                        {s.stage}
                      </span>
                      <span className={selectedStage === s.stage ? 'text-green-400' : 'text-white/70'}>
                        {s.label}
                      </span>
                    </div>
                    <span className="text-sm text-white/40">
                      {s.points.toLocaleString()} pts
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </GlassPanel>

          <GlassPanel glow glowColor="amber">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white/80">
                How to Grow
              </h3>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  Complete daily puzzles for +50 points
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  Maintain streaks for bonus multipliers
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  Unlock achievements for +100 points each
                </li>
              </ul>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
