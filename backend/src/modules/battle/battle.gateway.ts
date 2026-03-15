import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  joinLobbyMessageSchema,
  leaveLobbyMessageSchema,
  pingMessageSchema,
  playerReadyMessageSchema,
  progressUpdateMessageSchema,
  submitSolutionMessageSchema,
  type JoinLobbyMessage,
  type LeaveLobbyMessage,
  type PingMessage,
  type PlayerReadyMessage,
  type ProgressUpdateMessage,
  type SubmitSolutionMessage,
} from '@code-of-life/shared';
import { type ZodIssue, type ZodType } from 'zod';
import { BattleService } from './battle.service';
import { WsJwtGuard } from './ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  user?: { userId: string; username: string };
}

@WebSocketGateway({
  namespace: '/battle',
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
})
export class BattleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BattleGateway.name);

  constructor(private readonly battleService: BattleService) {}

  private validatePayload<T>(
    client: AuthenticatedSocket,
    schema: ZodType<T>,
    payload: unknown,
  ): T | null {
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      this.emitInvalidPayload(client, parsed.error.issues);
      return null;
    }

    return parsed.data;
  }

  private emitInvalidPayload(
    client: AuthenticatedSocket,
    issues: ZodIssue[],
  ): void {
    client.emit('error', {
      message: 'Invalid payload',
      errors: issues,
    });
    client.emit('battle_error', {
      code: 'INVALID_PAYLOAD',
      message: 'Invalid payload',
    });
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Authentication will be handled when they try to join a lobby
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up player from any lobbies
    await this.battleService.handlePlayerDisconnect(client.id);
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload?: unknown,
  ) {
    const data = this.validatePayload<PingMessage>(
      client,
      pingMessageSchema,
      payload ?? {},
    );
    if (!data) {
      return;
    }

    client.emit('pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('join_lobby')
  @UseGuards(WsJwtGuard)
  async handleJoinLobby(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ) {
    const data = this.validatePayload<JoinLobbyMessage>(
      client,
      joinLobbyMessageSchema,
      payload,
    );
    if (!data) {
      return;
    }

    try {
      const user = client.user;
      if (!user) {
        return {
          event: 'battle_error',
          data: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        };
      }

      const lobby = await this.battleService.joinLobby(
        client.id,
        user.userId,
        user.username,
        data.lobbyId,
        data.puzzleDifficulty,
      );

      // Join the Socket.IO room for this lobby
      await client.join(`lobby:${lobby.id}`);

      // Notify other players in the lobby
      client.to(`lobby:${lobby.id}`).emit('player_joined', {
        lobbyId: lobby.id,
        player: {
          id: user.userId,
          username: user.username,
          avatarUrl: null,
          level: 1,
          isReady: false,
        },
      });

      return { event: 'lobby_joined', data: lobby };
    } catch (error) {
      this.logger.error('Join lobby error:', error);
      return {
        event: 'battle_error',
        data: { code: 'JOIN_FAILED', message: 'Failed to join lobby' },
      };
    }
  }

  @SubscribeMessage('leave_lobby')
  @UseGuards(WsJwtGuard)
  async handleLeaveLobby(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ) {
    const data = this.validatePayload<LeaveLobbyMessage>(
      client,
      leaveLobbyMessageSchema,
      payload,
    );
    if (!data) {
      return;
    }

    try {
      const user = client.user;
      if (!user) return;

      await this.battleService.leaveLobby(data.lobbyId, user.userId);

      // Leave the Socket.IO room
      await client.leave(`lobby:${data.lobbyId}`);

      // Notify other players
      this.server.to(`lobby:${data.lobbyId}`).emit('player_left', {
        lobbyId: data.lobbyId,
        playerId: user.userId,
      });

      return { event: 'left_lobby', data: { success: true } };
    } catch (error) {
      this.logger.error('Leave lobby error:', error);
      return {
        event: 'battle_error',
        data: { code: 'LEAVE_FAILED', message: 'Failed to leave lobby' },
      };
    }
  }

  @SubscribeMessage('player_ready')
  @UseGuards(WsJwtGuard)
  async handlePlayerReady(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ) {
    const data = this.validatePayload<PlayerReadyMessage>(
      client,
      playerReadyMessageSchema,
      payload,
    );
    if (!data) {
      return;
    }

    try {
      const user = client.user;
      if (!user) return;

      const result = await this.battleService.setPlayerReady(
        data.lobbyId,
        user.userId,
        data.isReady,
      );

      // Broadcast ready state to all players in lobby
      this.server.to(`lobby:${data.lobbyId}`).emit('player_ready_changed', {
        lobbyId: data.lobbyId,
        playerId: user.userId,
        isReady: data.isReady,
      });

      // Check if all players are ready to start
      if (result.allReady) {
        const matchData = await this.battleService.startMatch(data.lobbyId);

        this.server.to(`lobby:${data.lobbyId}`).emit('match_start', matchData);
      }

      return { event: 'ready_updated', data: { success: true } };
    } catch (error) {
      this.logger.error('Player ready error:', error);
      return {
        event: 'battle_error',
        data: { code: 'READY_FAILED', message: 'Failed to update ready state' },
      };
    }
  }

  @SubscribeMessage('progress_update')
  @UseGuards(WsJwtGuard)
  async handleProgressUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ) {
    const data = this.validatePayload<ProgressUpdateMessage>(
      client,
      progressUpdateMessageSchema,
      payload,
    );
    if (!data) {
      return;
    }

    try {
      const user = client.user;
      if (!user) return;

      // Store progress
      await this.battleService.updateProgress(data.lobbyId, user.userId, data);

      // Broadcast to other players in the lobby
      client.to(`lobby:${data.lobbyId}`).emit('opponent_progress', {
        playerId: user.userId,
        progress: data.progress,
        correctCharacters: data.correctCharacters,
        totalCharacters: data.totalCharacters,
        hintsUsed: data.hintsUsed,
        timeElapsed: 0, // Will be calculated server-side
      });
    } catch (error) {
      this.logger.error('Progress update error:', error);
    }
  }

  @SubscribeMessage('submit_solution')
  @UseGuards(WsJwtGuard)
  async handleSubmitSolution(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ) {
    const data = this.validatePayload<SubmitSolutionMessage>(
      client,
      submitSolutionMessageSchema,
      payload,
    );
    if (!data) {
      return;
    }

    try {
      const user = client.user;
      if (!user) return;

      const result = await this.battleService.submitSolution(
        data.lobbyId,
        user.userId,
        data.solution,
        data.timeElapsed,
      );

      if (result.gameOver) {
        // Broadcast game over to all players
        this.server.to(`lobby:${data.lobbyId}`).emit('game_over', {
          lobbyId: data.lobbyId,
          winnerId: result.winnerId,
          winnerUsername: result.winnerUsername,
          results: result.results,
        });
      }

      return {
        event: 'solution_submitted',
        data: { isCorrect: result.isCorrect },
      };
    } catch (error) {
      this.logger.error('Submit solution error:', error);
      return {
        event: 'battle_error',
        data: { code: 'SUBMIT_FAILED', message: 'Failed to submit solution' },
      };
    }
  }
}
