import { z } from 'zod';

// ==================== ENUMS ====================

export const BattleStatus = z.enum([
  'WAITING',      // Waiting for opponent
  'STARTING',     // Match found, starting countdown
  'IN_PROGRESS',  // Battle in progress
  'COMPLETED',    // Battle finished
  'CANCELLED',    // Battle cancelled
]);

export type BattleStatus = z.infer<typeof BattleStatus>;

// ==================== PLAYER SCHEMAS ====================

export const playerSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  level: z.number(),
  isReady: z.boolean().default(false),
});

export type Player = z.infer<typeof playerSchema>;

export const playerProgressSchema = z.object({
  playerId: z.string(),
  progress: z.number().min(0).max(100), // Percentage completed
  correctCharacters: z.number(),
  totalCharacters: z.number(),
  hintsUsed: z.number(),
  timeElapsed: z.number(), // Seconds
});

export type PlayerProgress = z.infer<typeof playerProgressSchema>;

// ==================== LOBBY SCHEMAS ====================

export const lobbySchema = z.object({
  id: z.string(),
  players: z.array(playerSchema),
  maxPlayers: z.number().default(2),
  puzzleId: z.string().nullable(),
  status: BattleStatus,
  createdAt: z.string(),
});

export type Lobby = z.infer<typeof lobbySchema>;

// ==================== CLIENT -> SERVER EVENTS ====================

export const joinLobbySchema = z.object({
  event: z.literal('join_lobby'),
  data: z.object({
    lobbyId: z.string().optional(), // Join specific lobby or find match
    puzzleDifficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTER']).optional(),
  }),
});

export type JoinLobbyEvent = z.infer<typeof joinLobbySchema>;

export const leaveLobbySchema = z.object({
  event: z.literal('leave_lobby'),
  data: z.object({
    lobbyId: z.string(),
  }),
});

export type LeaveLobbyEvent = z.infer<typeof leaveLobbySchema>;

export const playerReadySchema = z.object({
  event: z.literal('player_ready'),
  data: z.object({
    lobbyId: z.string(),
    isReady: z.boolean(),
  }),
});

export type PlayerReadyEvent = z.infer<typeof playerReadySchema>;

export const progressUpdateSchema = z.object({
  event: z.literal('progress_update'),
  data: z.object({
    lobbyId: z.string(),
    progress: z.number().min(0).max(100),
    correctCharacters: z.number(),
    totalCharacters: z.number(),
    hintsUsed: z.number(),
  }),
});

export type ProgressUpdateEvent = z.infer<typeof progressUpdateSchema>;

export const submitSolutionSchema = z.object({
  event: z.literal('submit_solution'),
  data: z.object({
    lobbyId: z.string(),
    solution: z.string(),
    timeElapsed: z.number(),
  }),
});

export type SubmitSolutionEvent = z.infer<typeof submitSolutionSchema>;

// ==================== SERVER -> CLIENT EVENTS ====================

export const lobbyJoinedSchema = z.object({
  event: z.literal('lobby_joined'),
  data: lobbySchema,
});

export type LobbyJoinedEvent = z.infer<typeof lobbyJoinedSchema>;

export const playerJoinedSchema = z.object({
  event: z.literal('player_joined'),
  data: z.object({
    lobbyId: z.string(),
    player: playerSchema,
  }),
});

export type PlayerJoinedEvent = z.infer<typeof playerJoinedSchema>;

export const playerLeftSchema = z.object({
  event: z.literal('player_left'),
  data: z.object({
    lobbyId: z.string(),
    playerId: z.string(),
  }),
});

export type PlayerLeftEvent = z.infer<typeof playerLeftSchema>;

export const matchStartSchema = z.object({
  event: z.literal('match_start'),
  data: z.object({
    lobbyId: z.string(),
    puzzleId: z.string(),
    encryptedPattern: z.string(),
    difficulty: z.string(),
    countdownSeconds: z.number(),
  }),
});

export type MatchStartEvent = z.infer<typeof matchStartSchema>;

export const opponentProgressSchema = z.object({
  event: z.literal('opponent_progress'),
  data: playerProgressSchema,
});

export type OpponentProgressEvent = z.infer<typeof opponentProgressSchema>;

export const gameOverSchema = z.object({
  event: z.literal('game_over'),
  data: z.object({
    lobbyId: z.string(),
    winnerId: z.string(),
    winnerUsername: z.string(),
    results: z.array(
      z.object({
        playerId: z.string(),
        username: z.string(),
        score: z.number(),
        timeElapsed: z.number(),
        isCorrect: z.boolean(),
        hintsUsed: z.number(),
      })
    ),
  }),
});

export type GameOverEvent = z.infer<typeof gameOverSchema>;

export const battleErrorSchema = z.object({
  event: z.literal('battle_error'),
  data: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type BattleErrorEvent = z.infer<typeof battleErrorSchema>;

// ==================== UNION TYPES ====================

export const clientEventSchema = z.discriminatedUnion('event', [
  joinLobbySchema,
  leaveLobbySchema,
  playerReadySchema,
  progressUpdateSchema,
  submitSolutionSchema,
]);

export type ClientEvent = z.infer<typeof clientEventSchema>;

export const serverEventSchema = z.discriminatedUnion('event', [
  lobbyJoinedSchema,
  playerJoinedSchema,
  playerLeftSchema,
  matchStartSchema,
  opponentProgressSchema,
  gameOverSchema,
  battleErrorSchema,
]);

export type ServerEvent = z.infer<typeof serverEventSchema>;
