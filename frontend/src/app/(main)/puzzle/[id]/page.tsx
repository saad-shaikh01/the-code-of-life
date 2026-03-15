"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Clock,
  Lightbulb,
  Send,
  RotateCcw,
  Trophy,
  X,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { usePuzzle, useSubmitProgress } from "@/hooks";
import { useGameStore } from "@/stores";
import { decoderService } from "@/api";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout";
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Progress,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import { CIPHER_MAP, tokenizeEncryptedPattern } from "@/lib/cipher";
import { GAME_CONFIG } from "@/config/constants";
import { CipherTokenCell } from "@/modules/puzzles/components/CipherTokenCell";
import { DecoderPanel } from "@/modules/puzzles/components/DecoderPanel";

export default function PuzzlePage() {
  const params = useParams();
  const router = useRouter();
  const puzzleId = params.id as string;
  const { addToast } = useToast();

  // Fetch puzzle data
  const { data: puzzleData, isLoading: puzzleLoading } = usePuzzle(puzzleId);
  const submitProgress = useSubmitProgress();

  // Game state
  const {
    currentPuzzle,
    userInput,
    hintsUsed,
    hintsRevealed,
    elapsedTime,
    isCompleted,
    isCorrect,
    similarity,
    symbolMap,
    setPuzzle,
    setUserInput,
    setSymbolMap,
    useHint: revealHint,
    startTimer,
    updateElapsedTime,
    setCompleted,
    calculateScore,
  } = useGameStore();

  // Local state
  const [showResult, setShowResult] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showHintDialog, setShowHintDialog] = React.useState(false);
  const { data: symbolMapData, isLoading: symbolMapLoading } = useQuery({
    queryKey: ["decoder", "symbol-map"],
    queryFn: () => decoderService.getSymbolMap(),
    staleTime: Infinity,
  });

  React.useEffect(() => {
    if (symbolMapData?.data) {
      setSymbolMap(symbolMapData.data);
    }
  }, [setSymbolMap, symbolMapData]);

  // Initialize puzzle in store when loaded
  React.useEffect(() => {
    if (puzzleData?.data && puzzleData.data.id !== currentPuzzle?.id) {
      setPuzzle(puzzleData.data);
    }
  }, [puzzleData, currentPuzzle?.id, setPuzzle]);

  // Timer update interval
  React.useEffect(() => {
    if (!isCompleted) {
      const interval = setInterval(updateElapsedTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isCompleted, updateElapsedTime]);

  // Handle input change - start timer on first input
  const handleInputChange = (value: string) => {
    if (userInput === "" && value !== "") {
      startTimer();
    }
    setUserInput(value);
  };

  // Handle hint request
  const handleUseHint = () => {
    const hint = revealHint();
    if (hint) {
      addToast({
        type: "info",
        title: "Hint Revealed",
        description: hint,
        duration: 10000,
      });
      setShowHintDialog(false);
    } else {
      addToast({
        type: "warning",
        title: "No Hints Available",
        description: "You've used all available hints for this puzzle.",
      });
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!userInput.trim() || !currentPuzzle) return;

    setIsSubmitting(true);
    try {
      const result = await decoderService.validate({
        puzzleId: currentPuzzle.id,
        attempt: userInput.trim(),
      });

      setCompleted(result.data.isCorrect, result.data.similarity);
      setShowResult(true);

      if (result.data.isCorrect) {
        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#F59E0B", "#8B5CF6", "#06B6D4"],
        });

        // Submit progress
        const score = calculateScore();
        await submitProgress.mutateAsync({
          puzzleId: currentPuzzle.id,
          completed: true,
          score,
          timeSpent: elapsedTime,
          hintsUsed,
        });
      }
    } catch {
      addToast({
        type: "error",
        title: "Submission Failed",
        description: "There was an error validating your answer. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle play again
  const handlePlayAgain = () => {
    if (puzzleData?.data) {
      setPuzzle(puzzleData.data);
      setShowResult(false);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (puzzleLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!puzzleData?.data || !currentPuzzle) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-foreground mb-2">Puzzle Not Found</h2>
        <p className="text-muted-foreground mb-4">This puzzle doesn&apos;t exist or has been removed.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const puzzle = currentPuzzle;
  const encryptedTokens = tokenizeEncryptedPattern(puzzle.encryptedPattern);
  const availableHints = Math.min(GAME_CONFIG.HINTS_PER_PUZZLE, puzzle.hints.length) - hintsUsed;
  const decoderMap =
    Object.keys(symbolMap).length > 0 ? symbolMap : CIPHER_MAP;
  const showDecoderPanel = !showResult && !isCompleted;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        <PageHeader
          title={puzzle.title}
          backHref={`/${puzzle.gameMode.toLowerCase()}`}
          actions={
            <div className="flex items-center gap-3">
              <Badge variant="gameMode" gameMode={puzzle.gameMode} />
              <Badge variant="difficulty" difficulty={puzzle.difficulty} />
            </div>
          }
        />

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-6">
            {/* Timer */}
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              <span className="font-mono text-lg text-foreground">{formatTime(elapsedTime)}</span>
            </div>

            {/* Hints */}
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              <span className="text-foreground">
                {availableHints} / {Math.min(GAME_CONFIG.HINTS_PER_PUZZLE, puzzle.hints.length)} hints
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowHintDialog(true)}
            disabled={availableHints === 0 || isCompleted}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Use Hint
          </Button>
        </div>

        {/* Main Puzzle Area */}
        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <Card variant="elevated" glow="gold">
          <CardContent className="py-8">
            {/* Symbol Display */}
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wide">
                Decode this message
              </p>
              <div className="flex flex-wrap justify-center gap-3 py-6">
                {encryptedTokens.map((token, i) =>
                  token === "" ? (
                    <CipherTokenCell
                      key={`gap-${i}`}
                      token={token}
                      gapClassName="w-4 md:w-6"
                    />
                  ) : (
                    <motion.div
                      key={`${token}-${i}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02, type: "spring" }}
                    >
                      <CipherTokenCell
                        token={token}
                        className="min-w-[2.75rem] px-3 py-2 text-lg md:min-w-[3.25rem] md:text-2xl lg:min-w-[3.75rem] lg:text-3xl animate-glow-pulse"
                      />
                    </motion.div>
                  )
                )}
              </div>
            </div>

            {/* Revealed Hints */}
            {hintsRevealed.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm font-medium text-amber-400 mb-2">Hints:</p>
                <ul className="space-y-1">
                  {hintsRevealed.map((hint, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Answer Input */}
            <div className="max-w-2xl mx-auto">
              <Input
                placeholder="Type your decoded message here..."
                value={userInput}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={isCompleted}
                className="text-center text-lg py-4"
              />

              <div className="flex justify-center gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={handlePlayAgain}
                  disabled={!userInput && !isCompleted}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || isCompleted || isSubmitting}
                  isLoading={isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Answer
                </Button>
              </div>
            </div>
          </CardContent>
          </Card>

          {showDecoderPanel && (
            <div className="xl:sticky xl:top-6">
              <DecoderPanel
                symbolMap={decoderMap}
                encryptedPattern={puzzle.encryptedPattern}
                isLoading={symbolMapLoading}
              />
            </div>
          )}
        </div>

        {/* Book Reference */}
        {(puzzle.bookChapter || puzzle.bookSection) && (
          <Card variant="glass" className="text-center">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">
                From: <span className="text-foreground">{puzzle.bookSection || "The Book of Life"}</span>
                {puzzle.bookChapter && `, Chapter ${puzzle.bookChapter}`}
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Hint Dialog */}
      <Dialog open={showHintDialog} onOpenChange={setShowHintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Use a Hint?
            </DialogTitle>
            <DialogDescription>
              You have <span className="text-amber-400 font-semibold">{availableHints}</span> hints remaining.
              Each hint used will reduce your final score by {GAME_CONFIG.POINTS_DEDUCTION_PER_HINT} points.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowHintDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseHint}>
              <Lightbulb className="h-4 w-4 mr-2" />
              Reveal Hint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <AnimatePresence mode="wait">
            {isCorrect ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-emerald-500/20 flex items-center justify-center"
                >
                  <Trophy className="h-10 w-10 text-amber-400" />
                </motion.div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  <span className="text-gradient-gold">Correct!</span>
                </h2>
                <p className="text-muted-foreground mb-6">
                  You&apos;ve decoded the message successfully!
                </p>

                {/* Score breakdown */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <div className="text-4xl font-bold text-amber-400 mb-2">
                    +{calculateScore()}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Base: +{GAME_CONFIG.POINTS_PER_CORRECT}</p>
                    {hintsUsed > 0 && (
                      <p className="text-red-400">
                        Hints: -{hintsUsed * GAME_CONFIG.POINTS_DEDUCTION_PER_HINT}
                      </p>
                    )}
                    {elapsedTime < GAME_CONFIG.TIME_BONUS_THRESHOLD && (
                      <p className="text-emerald-400">
                        Time Bonus: +{Math.floor((GAME_CONFIG.TIME_BONUS_THRESHOLD - elapsedTime) / 2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Original message revealed */}
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-6">
                  <p className="text-sm text-muted-foreground mb-2">The wisdom revealed:</p>
                  <p className="text-foreground italic">&ldquo;{puzzle.originalReflection}&rdquo;</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => router.push(`/${puzzle.gameMode.toLowerCase()}`)}>
                    Back to Puzzles
                  </Button>
                  <Button onClick={() => router.push("/dashboard")}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                  <X className="h-10 w-10 text-muted-foreground" />
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">Not Quite!</h2>
                <p className="text-muted-foreground mb-6">
                  Your answer is {Math.round(similarity * 100)}% similar to the correct message.
                </p>

                {/* Similarity meter */}
                <div className="mb-6">
                  <Progress value={similarity * 100} variant="mystic" size="lg" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {similarity >= 0.8 ? "So close! Try again." :
                     similarity >= 0.5 ? "You're on the right track!" :
                     "Keep trying, use hints if needed."}
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={() => setShowResult(false)}>
                    Try Again
                  </Button>
                  {availableHints > 0 && (
                    <Button onClick={() => { setShowResult(false); setShowHintDialog(true); }}>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Get Hint
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
