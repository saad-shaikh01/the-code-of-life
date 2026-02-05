'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AUTH_CONFIG } from '@/config/constants';

interface Player {
  id: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  isReady: boolean;
}

interface PlayerProgress {
  playerId: string;
  progress: number;
  correctCharacters: number;
  totalCharacters: number;
  hintsUsed: number;
  timeElapsed: number;
}

interface Lobby {
  id: string;
  players: Player[];
  maxPlayers: number;
  puzzleId: string | null;
  status: string;
  createdAt: string;
}

interface MatchData {
  lobbyId: string;
  puzzleId: string;
  encryptedPattern: string;
  difficulty: string;
  countdownSeconds: number;
}

interface GameOverData {
  lobbyId: string;
  winnerId: string;
  winnerUsername: string;
  results: Array<{
    playerId: string;
    username: string;
    score: number;
    timeElapsed: number;
    isCorrect: boolean;
    hintsUsed: number;
  }>;
}

interface BattleError {
  code: string;
  message: string;
}

interface UseBattleSocketReturn {
  isConnected: boolean;
  lobby: Lobby | null;
  matchData: MatchData | null;
  opponentProgress: PlayerProgress | null;
  gameOver: GameOverData | null;
  error: BattleError | null;
  joinLobby: (lobbyId?: string, difficulty?: string) => void;
  leaveLobby: () => void;
  setReady: (isReady: boolean) => void;
  updateProgress: (data: Omit<PlayerProgress, 'playerId' | 'timeElapsed'>) => void;
  submitSolution: (solution: string, timeElapsed: number) => void;
  resetState: () => void;
}

export function useBattleSocket(): UseBattleSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [opponentProgress, setOpponentProgress] = useState<PlayerProgress | null>(null);
  const [gameOver, setGameOver] = useState<GameOverData | null>(null);
  const [error, setError] = useState<BattleError | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    if (!token) return;

    const socket = io(
      `${process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'}/battle`,
      {
        auth: { token },
        transports: ['websocket'],
      }
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('lobby_joined', (data: Lobby) => {
      setLobby(data);
      setError(null);
    });

    socket.on('player_joined', (data: { lobbyId: string; player: Player }) => {
      setLobby((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, data.player],
        };
      });
    });

    socket.on('player_left', (data: { lobbyId: string; playerId: string }) => {
      setLobby((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== data.playerId),
        };
      });
    });

    socket.on('player_ready_changed', (data: { playerId: string; isReady: boolean }) => {
      setLobby((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === data.playerId ? { ...p, isReady: data.isReady } : p
          ),
        };
      });
    });

    socket.on('match_start', (data: MatchData) => {
      setMatchData(data);
      setLobby((prev) => (prev ? { ...prev, status: 'IN_PROGRESS' } : prev));
    });

    socket.on('opponent_progress', (data: PlayerProgress) => {
      setOpponentProgress(data);
    });

    socket.on('game_over', (data: GameOverData) => {
      setGameOver(data);
      setLobby((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
    });

    socket.on('battle_error', (data: BattleError) => {
      setError(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinLobby = useCallback((lobbyId?: string, difficulty?: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('join_lobby', {
      lobbyId,
      puzzleDifficulty: difficulty,
    });
  }, []);

  const leaveLobby = useCallback(() => {
    if (!socketRef.current || !lobby) return;
    socketRef.current.emit('leave_lobby', { lobbyId: lobby.id });
    setLobby(null);
    setMatchData(null);
    setOpponentProgress(null);
    setGameOver(null);
  }, [lobby]);

  const setReady = useCallback((isReady: boolean) => {
    if (!socketRef.current || !lobby) return;
    socketRef.current.emit('player_ready', {
      lobbyId: lobby.id,
      isReady,
    });
  }, [lobby]);

  const updateProgress = useCallback(
    (data: Omit<PlayerProgress, 'playerId' | 'timeElapsed'>) => {
      if (!socketRef.current || !lobby) return;
      socketRef.current.emit('progress_update', {
        lobbyId: lobby.id,
        ...data,
      });
    },
    [lobby]
  );

  const submitSolution = useCallback(
    (solution: string, timeElapsed: number) => {
      if (!socketRef.current || !lobby) return;
      socketRef.current.emit('submit_solution', {
        lobbyId: lobby.id,
        solution,
        timeElapsed,
      });
    },
    [lobby]
  );

  const resetState = useCallback(() => {
    setLobby(null);
    setMatchData(null);
    setOpponentProgress(null);
    setGameOver(null);
    setError(null);
  }, []);

  return {
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
  };
}
