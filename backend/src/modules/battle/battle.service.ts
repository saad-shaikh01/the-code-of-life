import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Difficulty, Puzzle } from '@prisma/client';

interface Player {
  id: string;
  socketId: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  isReady: boolean;
}

interface PlayerProgress {
  progress: number;
  correctCharacters: number;
  totalCharacters: number;
  hintsUsed: number;
  timeElapsed: number;
  solution?: string;
  isCorrect?: boolean;
}

interface Lobby {
  id: string;
  players: Map<string, Player>;
  maxPlayers: number;
  puzzleId: string | null;
  puzzle: Puzzle | null;
  status: 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  difficulty: Difficulty;
  createdAt: Date;
  startedAt: Date | null;
  progress: Map<string, PlayerProgress>;
}

@Injectable()
export class BattleService {
  private readonly logger = new Logger(BattleService.name);
  private lobbies: Map<string, Lobby> = new Map();
  private playerToLobby: Map<string, string> = new Map();
  private socketToPlayer: Map<string, string> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  private generateLobbyId(): string {
    return `lobby_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  async joinLobby(
    socketId: string,
    userId: string,
    username: string,
    lobbyId?: string,
    puzzleDifficulty?: string,
  ): Promise<{
    id: string;
    players: Array<{ id: string; username: string; avatarUrl: string | null; level: number; isReady: boolean }>;
    maxPlayers: number;
    puzzleId: string | null;
    status: string;
    createdAt: string;
  }> {
    // Track socket to player mapping
    this.socketToPlayer.set(socketId, userId);

    let lobby: Lobby | undefined;

    if (lobbyId) {
      // Join specific lobby
      lobby = this.lobbies.get(lobbyId);
      if (!lobby) {
        throw new Error('Lobby not found');
      }
      if (lobby.players.size >= lobby.maxPlayers) {
        throw new Error('Lobby is full');
      }
    } else {
      // Find available lobby or create new one
      const difficulty = (puzzleDifficulty as Difficulty) || Difficulty.BEGINNER;

      // Look for waiting lobby with matching difficulty
      for (const [id, existingLobby] of this.lobbies) {
        if (
          existingLobby.status === 'WAITING' &&
          existingLobby.players.size < existingLobby.maxPlayers &&
          existingLobby.difficulty === difficulty
        ) {
          lobby = existingLobby;
          break;
        }
      }

      // Create new lobby if none found
      if (!lobby) {
        const newLobbyId = this.generateLobbyId();
        lobby = {
          id: newLobbyId,
          players: new Map(),
          maxPlayers: 2,
          puzzleId: null,
          puzzle: null,
          status: 'WAITING',
          difficulty,
          createdAt: new Date(),
          startedAt: null,
          progress: new Map(),
        };
        this.lobbies.set(newLobbyId, lobby);
      }
    }

    // Get user data for level
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentLevel: true, avatarUrl: true },
    });

    // Add player to lobby
    const player: Player = {
      id: userId,
      socketId,
      username,
      avatarUrl: user?.avatarUrl || null,
      level: user?.currentLevel || 1,
      isReady: false,
    };

    lobby.players.set(userId, player);
    this.playerToLobby.set(userId, lobby.id);

    return {
      id: lobby.id,
      players: Array.from(lobby.players.values()).map((p) => ({
        id: p.id,
        username: p.username,
        avatarUrl: p.avatarUrl,
        level: p.level,
        isReady: p.isReady,
      })),
      maxPlayers: lobby.maxPlayers,
      puzzleId: lobby.puzzleId,
      status: lobby.status,
      createdAt: lobby.createdAt.toISOString(),
    };
  }

  async leaveLobby(lobbyId: string, userId: string): Promise<void> {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    const player = lobby.players.get(userId);
    if (player) {
      this.socketToPlayer.delete(player.socketId);
    }

    lobby.players.delete(userId);
    this.playerToLobby.delete(userId);

    // Clean up empty lobbies
    if (lobby.players.size === 0) {
      this.lobbies.delete(lobbyId);
    }
  }

  async handlePlayerDisconnect(socketId: string): Promise<void> {
    const userId = this.socketToPlayer.get(socketId);
    if (!userId) return;

    const lobbyId = this.playerToLobby.get(userId);
    if (lobbyId) {
      await this.leaveLobby(lobbyId, userId);
    }

    this.socketToPlayer.delete(socketId);
  }

  async setPlayerReady(
    lobbyId: string,
    userId: string,
    isReady: boolean,
  ): Promise<{ allReady: boolean }> {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) throw new Error('Lobby not found');

    const player = lobby.players.get(userId);
    if (!player) throw new Error('Player not in lobby');

    player.isReady = isReady;

    // Check if all players are ready
    const allReady =
      lobby.players.size === lobby.maxPlayers &&
      Array.from(lobby.players.values()).every((p) => p.isReady);

    return { allReady };
  }

  async startMatch(lobbyId: string): Promise<{
    lobbyId: string;
    puzzleId: string;
    encryptedPattern: string;
    difficulty: string;
    countdownSeconds: number;
  }> {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) throw new Error('Lobby not found');

    // Get a random puzzle of the specified difficulty
    const puzzles = await this.prisma.puzzle.findMany({
      where: {
        difficulty: lobby.difficulty,
        gameMode: 'CHALLENGE',
      },
      take: 10,
    });

    if (puzzles.length === 0) {
      throw new Error('No puzzles available');
    }

    const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];

    lobby.puzzleId = puzzle.id;
    lobby.puzzle = puzzle;
    lobby.status = 'STARTING';
    lobby.startedAt = new Date();

    // Initialize progress for all players
    for (const playerId of lobby.players.keys()) {
      lobby.progress.set(playerId, {
        progress: 0,
        correctCharacters: 0,
        totalCharacters: puzzle.originalReflection.length,
        hintsUsed: 0,
        timeElapsed: 0,
      });
    }

    // Set status to IN_PROGRESS after countdown
    setTimeout(() => {
      const currentLobby = this.lobbies.get(lobbyId);
      if (currentLobby && currentLobby.status === 'STARTING') {
        currentLobby.status = 'IN_PROGRESS';
      }
    }, 5000);

    return {
      lobbyId: lobby.id,
      puzzleId: puzzle.id,
      encryptedPattern: puzzle.encryptedPattern,
      difficulty: puzzle.difficulty,
      countdownSeconds: 5,
    };
  }

  async updateProgress(
    lobbyId: string,
    userId: string,
    data: {
      progress: number;
      correctCharacters: number;
      totalCharacters: number;
      hintsUsed: number;
    },
  ): Promise<void> {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    const currentProgress = lobby.progress.get(userId);
    if (!currentProgress) return;

    lobby.progress.set(userId, {
      ...currentProgress,
      ...data,
      timeElapsed: lobby.startedAt
        ? Math.floor((Date.now() - lobby.startedAt.getTime()) / 1000)
        : 0,
    });
  }

  async submitSolution(
    lobbyId: string,
    userId: string,
    solution: string,
    timeElapsed: number,
  ): Promise<{
    isCorrect: boolean;
    gameOver: boolean;
    winnerId?: string;
    winnerUsername?: string;
    results?: Array<{
      playerId: string;
      username: string;
      score: number;
      timeElapsed: number;
      isCorrect: boolean;
      hintsUsed: number;
    }>;
  }> {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || !lobby.puzzle) {
      throw new Error('Lobby or puzzle not found');
    }

    // Check if solution is correct (case-insensitive, trimmed)
    const isCorrect =
      solution.trim().toLowerCase() ===
      lobby.puzzle.originalReflection.trim().toLowerCase();

    // Update player's progress
    const progress = lobby.progress.get(userId);
    if (progress) {
      progress.solution = solution;
      progress.isCorrect = isCorrect;
      progress.timeElapsed = timeElapsed;
      progress.progress = isCorrect ? 100 : progress.progress;
    }

    // Check if game is over (someone won or all submitted)
    const allSubmitted = Array.from(lobby.progress.values()).every(
      (p) => p.solution !== undefined,
    );
    const hasWinner = isCorrect;

    if (hasWinner || allSubmitted) {
      lobby.status = 'COMPLETED';

      // Calculate scores
      const results = Array.from(lobby.players.entries()).map(([playerId, player]) => {
        const playerProgress = lobby.progress.get(playerId);
        const playerIsCorrect = playerProgress?.isCorrect || false;
        const playerTime = playerProgress?.timeElapsed || 0;
        const hints = playerProgress?.hintsUsed || 0;

        // Score calculation: base points for correct, bonus for speed, penalty for hints
        let score = 0;
        if (playerIsCorrect) {
          score = 1000;
          score += Math.max(0, (300 - playerTime) * 2); // Time bonus
          score -= hints * 50; // Hint penalty
        } else {
          score = Math.floor((playerProgress?.progress || 0) * 5); // Partial credit
        }

        return {
          playerId,
          username: player.username,
          score: Math.max(0, score),
          timeElapsed: playerTime,
          isCorrect: playerIsCorrect,
          hintsUsed: hints,
        };
      });

      // Find winner (correct solution with best time)
      const winners = results
        .filter((r) => r.isCorrect)
        .sort((a, b) => a.timeElapsed - b.timeElapsed);

      const winner = winners[0];

      return {
        isCorrect,
        gameOver: true,
        winnerId: winner?.playerId,
        winnerUsername: winner?.username,
        results,
      };
    }

    return { isCorrect, gameOver: false };
  }

  getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbies.get(lobbyId);
  }

  getPlayerLobby(userId: string): string | undefined {
    return this.playerToLobby.get(userId);
  }
}
