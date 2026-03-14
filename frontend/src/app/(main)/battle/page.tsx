'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Swords,
  Trophy,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useBattleSocket } from '@/hooks/useBattleSocket';
import { useAuthStore } from '@/stores';

type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';

const MAX_RECONNECT_ATTEMPTS = 5;

const difficultyColors: Record<Difficulty, string> = {
  BEGINNER: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-blue-100 text-blue-800',
  ADVANCED: 'bg-purple-100 text-purple-800',
  MASTER: 'bg-red-100 text-red-800',
};

export default function BattlePage() {
  const { user } = useAuthStore();
  const {
    isConnected,
    connectionState,
    reconnectAttempt,
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
    retryConnection,
    resetState,
  } = useBattleSocket();

  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('BEGINNER');
  const [isSearching, setIsSearching] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [playerInput, setPlayerInput] = useState('');
  const [showForfeitDialog, setShowForfeitDialog] = useState(false);

  const currentUserId = user?.id;
  const currentPlayer = currentUserId
    ? lobby?.players.find((player) => player.id === currentUserId)
    : undefined;
  const opponent = currentUserId
    ? lobby?.players.find((player) => player.id !== currentUserId)
    : undefined;
  const myResult = currentUserId
    ? gameOver?.results.find((result) => result.playerId === currentUserId)
    : undefined;
  const opponentResult = currentUserId
    ? gameOver?.results.find((result) => result.playerId !== currentUserId)
    : undefined;
  const myProgress = matchData
    ? Math.min((playerInput.length / matchData.encryptedPattern.length) * 100, 100)
    : 0;
  const hasOpponent = Boolean(opponent);
  const opponentProgressValue = opponentProgress?.progress ?? 0;
  const opponentProgressLabel = opponentProgress
    ? `${opponentProgressValue.toFixed(0)}%`
    : 'Waiting...';
  const isReconnecting = connectionState === 'reconnecting';
  const isConnectionFailure =
    error?.code === 'CONNECT_ERROR' || error?.code === 'RECONNECT_FAILED';
  const reconnectStatusLabel =
    reconnectAttempt > 0
      ? `Attempt ${Math.min(reconnectAttempt, MAX_RECONNECT_ATTEMPTS)}/${MAX_RECONNECT_ATTEMPTS}`
      : 'Restoring your battle session';

  useEffect(() => {
    if (matchData?.countdownSeconds) {
      // Match countdown is driven by socket-delivered battle state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown(matchData.countdownSeconds);

      const interval = setInterval(() => {
        setCountdown((previous) => {
          if (previous === null || previous <= 1) {
            clearInterval(interval);
            return null;
          }

          return previous - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [matchData]);

  useEffect(() => {
    if (matchData && countdown === null && !gameOver) {
      const interval = setInterval(() => {
        setGameTime((previous) => previous + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [countdown, gameOver, matchData]);

  useEffect(() => {
    if (!matchData) {
      return;
    }

    updateProgress({
      progress: myProgress,
      correctCharacters: playerInput.length,
      totalCharacters: matchData.encryptedPattern.length,
      hintsUsed: 0,
    });
  }, [matchData, myProgress, playerInput, updateProgress]);

  const resetLocalUi = () => {
    setCountdown(null);
    setGameTime(0);
    setPlayerInput('');
    setIsSearching(false);
    setShowForfeitDialog(false);
  };

  const handleFindMatch = () => {
    setIsSearching(true);
    setShowForfeitDialog(false);
    joinLobby(undefined, selectedDifficulty);
  };

  const handleCancel = () => {
    resetLocalUi();
    leaveLobby();
  };

  const handleSubmit = () => {
    submitSolution(playerInput, gameTime);
  };

  const handleBackToLobby = () => {
    resetLocalUi();
    resetState();
  };

  const handlePlayAgain = () => {
    resetLocalUi();
    resetState();
    setIsSearching(true);
    joinLobby(undefined, selectedDifficulty);
  };

  const handleRetryConnection = () => {
    retryConnection();
  };

  const handleConfirmForfeit = () => {
    handleCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const reconnectingBanner = isReconnecting ? (
    <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
      <div className="flex items-center justify-center gap-3 text-center text-amber-200">
        <Loader2 className="h-4 w-4 animate-spin" />
        <div>
          <p className="font-medium">Connection lost. Reconnecting...</p>
          <p className="text-sm text-amber-100/80">{reconnectStatusLabel}</p>
        </div>
      </div>
    </div>
  ) : null;

  if (error && !isReconnecting) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">
              {isConnectionFailure ? 'Connection Failed' : 'Battle Error'}
            </h2>
            <p className="text-muted-foreground mb-6">{error.message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={isConnectionFailure ? handleRetryConnection : handleBackToLobby}>
                {isConnectionFailure ? 'Retry Connection' : 'Back to Lobby'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Return to Lobby
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const isWinner = Boolean(
      myResult &&
        myResult.playerId === gameOver.winnerId &&
        myResult.isCorrect,
    );

    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {reconnectingBanner}
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
                  {myResult
                    ? isWinner
                      ? 'Victory!'
                      : 'Better luck next time!'
                    : 'Battle complete!'}
                </h1>
                <p className="text-muted-foreground">
                  Winner: {gameOver.winnerUsername}
                </p>
                {myResult && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You scored {myResult.score} points in{' '}
                    {formatTime(myResult.timeElapsed)}.
                    {opponentResult &&
                      ` ${opponentResult.username} scored ${opponentResult.score}.`}
                  </p>
                )}
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
                <Button variant="outline" onClick={handleBackToLobby}>
                  Back to Lobby
                </Button>
                <Button onClick={handlePlayAgain}>
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

  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          {reconnectingBanner}
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
      </div>
    );
  }

  if (matchData && countdown === null) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {reconnectingBanner}

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
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowForfeitDialog(true)}
            >
              Forfeit
            </Button>
          </div>

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
                {hasOpponent ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        {opponent?.username || 'Opponent'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {opponentProgressLabel}
                      </span>
                    </div>
                    <Progress value={opponentProgressValue} variant="gold" />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Hints used: {opponentProgress?.hintsUsed ?? 0}
                    </div>
                  </>
                ) : (
                  <div className="h-full rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3 text-muted-foreground" />
                    <p className="font-semibold">Waiting for opponent...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Opponent progress will appear here once they reconnect or
                      send an update.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Decrypt the message:</h2>
            <div className="p-4 bg-muted rounded-lg font-mono text-lg mb-4 break-all">
              {matchData.encryptedPattern}
            </div>
            <textarea
              value={playerInput}
              onChange={(event) => setPlayerInput(event.target.value)}
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

        <Dialog open={showForfeitDialog} onOpenChange={setShowForfeitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Forfeit match?</DialogTitle>
              <DialogDescription>
                Leaving now will end your battle and your opponent will be
                declared the winner.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForfeitDialog(false)}>
                Continue Playing
              </Button>
              <Button variant="destructive" onClick={handleConfirmForfeit}>
                Yes, Forfeit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (lobby) {
    const allReady =
      lobby.players.length === lobby.maxPlayers &&
      lobby.players.every((player) => player.isReady);

    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {reconnectingBanner}
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

              {!hasOpponent && (
                <div className="mb-6 rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-muted-foreground" />
                  <p className="font-semibold">Waiting for opponent...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Searching for a {selectedDifficulty.toLowerCase()} player
                    to join your lobby.
                  </p>
                </div>
              )}

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
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{player.username}</p>
                          {player.id === currentUserId && (
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Level {player.level}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        player.isReady
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }
                    >
                      {player.isReady ? 'Ready' : 'Not Ready'}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Leave
                </Button>
                <Button
                  onClick={() => setReady(!currentPlayer?.isReady)}
                  className="flex-1"
                  disabled={!currentPlayer || lobby.players.length < lobby.maxPlayers}
                >
                  {currentPlayer
                    ? currentPlayer.isReady
                      ? 'Not Ready'
                      : 'Ready'
                    : 'Waiting for your player slot...'}
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

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {reconnectingBanner}
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
              <p className="text-muted-foreground">
                {isReconnecting
                  ? 'Reconnecting to the battle server...'
                  : 'Connecting to server...'}
              </p>
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
                {(
                  ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTER'] as Difficulty[]
                ).map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedDifficulty === difficulty
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Badge className={difficultyColors[difficulty]}>
                      {difficulty}
                    </Badge>
                  </button>
                ))}
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
