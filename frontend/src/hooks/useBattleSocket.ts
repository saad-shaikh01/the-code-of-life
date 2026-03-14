'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

interface JoinLobbyPayload {
  lobbyId?: string;
  puzzleDifficulty?: string;
}

interface UseBattleSocketReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  reconnectAttempt: number;
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
  retryConnection: () => void;
  resetState: () => void;
}

const HEARTBEAT_INTERVAL_MS = 25_000;
const PONG_TIMEOUT_MS = 5_000;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 2_000;

function upsertPlayer(players: Player[], player: Player): Player[] {
  const existingIndex = players.findIndex((existing) => existing.id === player.id);

  if (existingIndex === -1) {
    return [...players, player];
  }

  return players.map((existing) =>
    existing.id === player.id ? player : existing,
  );
}

export function useBattleSocket(): UseBattleSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const pongTimeoutRef = useRef<number | null>(null);
  const lastJoinPayloadRef = useRef<JoinLobbyPayload | null>(null);
  const shouldRejoinRef = useRef(false);
  const manualDisconnectRef = useRef(false);
  const manualReconnectRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('connecting');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [opponentProgress, setOpponentProgress] =
    useState<PlayerProgress | null>(null);
  const [gameOver, setGameOver] = useState<GameOverData | null>(null);
  const [error, setError] = useState<BattleError | null>(null);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current !== null) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (pongTimeoutRef.current !== null) {
      window.clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  const clearBattleState = useCallback(() => {
    setLobby(null);
    setMatchData(null);
    setOpponentProgress(null);
    setGameOver(null);
    setError(null);
  }, []);

  const startHeartbeat = useCallback(
    (socket: Socket) => {
      clearHeartbeat();

      heartbeatIntervalRef.current = window.setInterval(() => {
        if (!socket.connected) {
          return;
        }

        socket.emit('ping', { timestamp: Date.now() });

        if (pongTimeoutRef.current !== null) {
          window.clearTimeout(pongTimeoutRef.current);
        }

        pongTimeoutRef.current = window.setTimeout(() => {
          if (!socket.connected) {
            return;
          }

          manualReconnectRef.current = true;
          shouldRejoinRef.current = Boolean(lastJoinPayloadRef.current);
          clearHeartbeat();
          setIsConnected(false);
          setConnectionState('reconnecting');
          setError(null);
          socket.disconnect();
          socket.connect();
        }, PONG_TIMEOUT_MS);
      }, HEARTBEAT_INTERVAL_MS);
    },
    [clearHeartbeat],
  );

  useEffect(() => {
    const token = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);

    if (!token) {
      // Battle routes are guarded, but the hook still needs to settle cleanly if no token exists.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConnectionState('disconnected');
       
      setError({
        code: 'AUTH_REQUIRED',
        message: 'Authentication required to join battle mode.',
      });
      return;
    }

    const socket = io(
      `${process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'}/battle`,
      {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY_MS,
      },
    );

    socketRef.current = socket;
    const manager = socket.io;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionState('connected');
      setReconnectAttempt(0);
      setError(null);
      startHeartbeat(socket);

      if (shouldRejoinRef.current && lastJoinPayloadRef.current) {
        socket.emit('join_lobby', lastJoinPayloadRef.current);
        shouldRejoinRef.current = false;
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      clearHeartbeat();

      if (manualDisconnectRef.current) {
        manualDisconnectRef.current = false;
        setConnectionState('disconnected');
        return;
      }

      if (manualReconnectRef.current) {
        manualReconnectRef.current = false;
        setConnectionState('reconnecting');
        return;
      }

      if (lastJoinPayloadRef.current) {
        shouldRejoinRef.current = true;
      }

      if (reason === 'io client disconnect') {
        setConnectionState('disconnected');
        return;
      }

      setConnectionState('reconnecting');
    });

    socket.on('pong', () => {
      if (pongTimeoutRef.current !== null) {
        window.clearTimeout(pongTimeoutRef.current);
        pongTimeoutRef.current = null;
      }
    });

    socket.on('lobby_joined', (data: Lobby) => {
      setLobby(data);
      setError(null);
    });

    socket.on('player_joined', (data: { lobbyId: string; player: Player }) => {
      setLobby((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          players: upsertPlayer(prev.players, data.player),
        };
      });
    });

    socket.on('player_left', (data: { lobbyId: string; playerId: string }) => {
      setLobby((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          players: prev.players.filter((player) => player.id !== data.playerId),
        };
      });
    });

    socket.on(
      'player_ready_changed',
      (data: { lobbyId: string; playerId: string; isReady: boolean }) => {
        setLobby((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            players: prev.players.map((player) =>
              player.id === data.playerId
                ? { ...player, isReady: data.isReady }
                : player,
            ),
          };
        });
      },
    );

    socket.on('match_start', (data: MatchData) => {
      setMatchData(data);
      setGameOver(null);
      setOpponentProgress(null);
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

    socket.on('connect_error', () => {
      if (socket.active) {
        setConnectionState('reconnecting');
        return;
      }

      setConnectionState('disconnected');
      setError({
        code: 'CONNECT_ERROR',
        message: 'Unable to connect to the battle server.',
      });
    });

    manager.on('reconnect_attempt', (attempt: number) => {
      setReconnectAttempt(attempt);
      setConnectionState('reconnecting');
    });

    manager.on('reconnect', () => {
      setReconnectAttempt(0);
      setConnectionState('connected');
      setError(null);
    });

    manager.on('reconnect_failed', () => {
      setConnectionState('disconnected');
      setError({
        code: 'RECONNECT_FAILED',
        message:
          'Connection failed after multiple attempts. You can retry or return to the lobby.',
      });
    });

    return () => {
      clearHeartbeat();
      manualDisconnectRef.current = true;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [clearHeartbeat, startHeartbeat]);

  const joinLobby = useCallback((lobbyId?: string, difficulty?: string) => {
    const payload = {
      lobbyId,
      puzzleDifficulty: difficulty,
    };

    lastJoinPayloadRef.current = payload;
    shouldRejoinRef.current = false;
    setError(null);

    if (!socketRef.current) {
      return;
    }

    if (socketRef.current.connected) {
      socketRef.current.emit('join_lobby', payload);
      return;
    }

    shouldRejoinRef.current = true;
    setConnectionState('connecting');
    socketRef.current.connect();
  }, []);

  const leaveLobby = useCallback(() => {
    const socket = socketRef.current;
    const lobbyId = lobby?.id;

    if (socket && lobbyId && socket.connected) {
      socket.emit('leave_lobby', { lobbyId });
    }

    lastJoinPayloadRef.current = null;
    shouldRejoinRef.current = false;
    setReconnectAttempt(0);
    clearBattleState();
  }, [clearBattleState, lobby?.id]);

  const setReady = useCallback(
    (isReady: boolean) => {
      if (!socketRef.current || !lobby || !socketRef.current.connected) {
        return;
      }

      socketRef.current.emit('player_ready', {
        lobbyId: lobby.id,
        isReady,
      });
    },
    [lobby],
  );

  const updateProgress = useCallback(
    (data: Omit<PlayerProgress, 'playerId' | 'timeElapsed'>) => {
      if (!socketRef.current || !lobby || !socketRef.current.connected) {
        return;
      }

      socketRef.current.emit('progress_update', {
        lobbyId: lobby.id,
        ...data,
      });
    },
    [lobby],
  );

  const submitSolution = useCallback(
    (solution: string, timeElapsed: number) => {
      if (!socketRef.current || !lobby || !socketRef.current.connected) {
        return;
      }

      socketRef.current.emit('submit_solution', {
        lobbyId: lobby.id,
        solution,
        timeElapsed,
      });
    },
    [lobby],
  );

  const retryConnection = useCallback(() => {
    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    setError(null);
    setReconnectAttempt(0);

    if (lastJoinPayloadRef.current) {
      shouldRejoinRef.current = true;
    }

    if (socket.connected) {
      if (shouldRejoinRef.current && lastJoinPayloadRef.current) {
        socket.emit('join_lobby', lastJoinPayloadRef.current);
        shouldRejoinRef.current = false;
      }
      return;
    }

    setConnectionState('connecting');
    socket.connect();
  }, []);

  const resetState = useCallback(() => {
    lastJoinPayloadRef.current = null;
    shouldRejoinRef.current = false;
    setReconnectAttempt(0);
    clearBattleState();
  }, [clearBattleState]);

  return {
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
  };
}
