'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { useBattleSocket } from '@/hooks/useBattleSocket';

type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';

const difficultyColors: Record<Difficulty, string> = {
  BEGINNER: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-blue-100 text-blue-800',
  ADVANCED: 'bg-purple-100 text-purple-800',
  MASTER: 'bg-red-100 text-red-800',
};

export default function BattlePage() {
  const {
    isConnected,
    lobby,
    matchData,
    opponentProgress,
    gameOver,
    error,
    joinLobby,
    leaveLobby,
    setReady,
    updateProgress,
    submitSolution,
    resetState,
  } = useBattleSocket();

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('BEGINNER');
  const [isSearching, setIsSearching] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [playerInput, setPlayerInput] = useState('');
  const [myProgress, setMyProgress] = useState(0);

  // Handle match countdown
  useEffect(() => {
    if (matchData?.countdownSeconds) {
      setCountdown(matchData.countdownSeconds);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [matchData]);

  // Handle game timer
  useEffect(() => {
    if (matchData && countdown === null && !gameOver) {
      const interval = setInterval(() => {
        setGameTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [matchData, countdown, gameOver]);

  // Update progress based on input
  useEffect(() => {
    if (!matchData) return;

    const totalChars = matchData.encryptedPattern.length;
    const progress = Math.min((playerInput.length / totalChars) * 100, 100);
    setMyProgress(progress);

    updateProgress({
      progress,
      correctCharacters: playerInput.length,
      totalCharacters: totalChars,
      hintsUsed: 0,
    });
  }, [playerInput, matchData, updateProgress]);

  const handleFindMatch = () => {
    setIsSearching(true);
    joinLobby(undefined, selectedDifficulty);
  };

  const handleCancel = () => {
    setIsSearching(false);
    leaveLobby();
  };

  const handleSubmit = () => {
    submitSolution(playerInput, gameTime);
  };

  const handlePlayAgain = () => {
    resetState();
    setPlayerInput('');
    setGameTime(0);
    setMyProgress(0);
    setIsSearching(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Connection Error</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={resetState}>Try Again</Button>
          </Card>
        </div>
      </div>
    );
  }

  // Game Over state
  if (gameOver) {
    const isWinner = gameOver.results.some(
      (r) => r.playerId === gameOver.winnerId && r.isCorrect
    );
    const myResult = gameOver.results[0]; // TODO: Get actual user's result

    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  {isWinner ? (
                    <Trophy className="h-20 w-20 mx-auto mb-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-20 w-20 mx-auto mb-4 text-red-500" />
                  )}
                </motion.div>
                <h1 className="text-3xl font-bold mb-2">
                  {isWinner ? 'Victory!' : 'Better luck next time!'}
                </h1>
                <p className="text-muted-foreground">
                  Winner: {gameOver.winnerUsername}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {gameOver.results.map((result, index) => (
                  <motion.div
                    key={result.playerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      result.playerId === gameOver.winnerId
                        ? 'bg-yellow-50 border-2 border-yellow-200'
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{result.username}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatTime(result.timeElapsed)}
                          {result.isCorrect && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{result.score}</p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={handlePlayAgain}>
                  Back to Lobby
                </Button>
                <Button onClick={handleFindMatch}>
                  <Swords className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Countdown state
  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="text-center"
        >
          <p className="text-8xl font-bold text-primary">{countdown}</p>
          <p className="text-xl text-muted-foreground mt-4">Get Ready!</p>
        </motion.div>
      </div>
    );
  }

  // In-game state
  if (matchData && countdown === null) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with timer and progress */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Badge className={difficultyColors[matchData.difficulty as Difficulty]}>
                {matchData.difficulty}
              </Badge>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">{formatTime(gameTime)}</span>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              Forfeit
            </Button>
          </div>

          {/* Progress comparison */}
          <Card className="p-4 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">You</span>
                  <span className="text-sm text-muted-foreground">
                    {myProgress.toFixed(0)}%
                  </span>
                </div>
                <Progress value={myProgress} variant="default" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Opponent</span>
                  <span className="text-sm text-muted-foreground">
                    {opponentProgress?.progress.toFixed(0) || 0}%
                  </span>
                </div>
                <Progress
                  value={opponentProgress?.progress || 0}
                  variant="gold"
                />
              </div>
            </div>
          </Card>

          {/* Puzzle */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Decrypt the message:</h2>
            <div className="p-4 bg-muted rounded-lg font-mono text-lg mb-4 break-all">
              {matchData.encryptedPattern}
            </div>
            <textarea
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              className="w-full p-4 border rounded-lg font-mono min-h-[120px] resize-none"
              placeholder="Type your solution here..."
            />
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleSubmit}>
              <Zap className="h-4 w-4 mr-2" />
              Submit Solution
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby state
  if (lobby) {
    const currentPlayer = lobby.players[0]; // TODO: Identify current user
    const allReady = lobby.players.length === lobby.maxPlayers &&
      lobby.players.every((p) => p.isReady);

    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8">
              <div className="text-center mb-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h1 className="text-2xl font-bold mb-2">Battle Lobby</h1>
                <p className="text-muted-foreground">
                  {lobby.players.length}/{lobby.maxPlayers} players
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {lobby.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={player.avatarUrl}
                        alt={player.username}
                        fallback={player.username}
                      />
                      <div>
                        <p className="font-semibold">{player.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Level {player.level}
                        </p>
                      </div>
                    </div>
                    <Badge className={player.isReady ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                      {player.isReady ? 'Ready' : 'Not Ready'}
                    </Badge>
                  </div>
                ))}

                {/* Waiting for opponent */}
                {lobby.players.length < lobby.maxPlayers && (
                  <div className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-muted-foreground/30">
                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Waiting for opponent...
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Leave
                </Button>
                <Button
                  onClick={() => setReady(!currentPlayer?.isReady)}
                  className="flex-1"
                  disabled={lobby.players.length < lobby.maxPlayers}
                >
                  {currentPlayer?.isReady ? 'Not Ready' : 'Ready'}
                </Button>
              </div>

              {allReady && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  All players ready! Match starting soon...
                </p>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Default: Find Match screen
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Swords className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Battle Mode</h1>
          <p className="text-lg text-muted-foreground">
            Challenge other players in real-time puzzle battles!
          </p>
        </motion.div>

        <Card className="p-8">
          {!isConnected ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Connecting to server...</p>
            </div>
          ) : isSearching ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Finding Opponent...</h2>
              <p className="text-muted-foreground mb-6">
                Searching for a {selectedDifficulty.toLowerCase()} match
              </p>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-6">Select Difficulty</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTER'] as Difficulty[]).map(
                  (diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedDifficulty === diff
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <Badge className={difficultyColors[diff]}>{diff}</Badge>
                    </button>
                  )
                )}
              </div>
              <Button className="w-full" size="lg" onClick={handleFindMatch}>
                <Swords className="h-5 w-5 mr-2" />
                Find Match
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
