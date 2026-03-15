import { Test, TestingModule } from '@nestjs/testing';
import { BattleGateway } from './battle.gateway';
import { BattleService } from './battle.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  user?: { userId: string; username: string };
}

interface MockSocket extends AuthenticatedSocket {
  join: jest.Mock;
  leave: jest.Mock;
  to: jest.Mock;
  emit: jest.Mock;
}

interface MockServer {
  to: jest.Mock;
  emit: jest.Mock;
}

interface InvalidPayloadMessage {
  message: string;
  errors: unknown[];
}

describe('BattleGateway', () => {
  let gateway: BattleGateway;
  let mockServer: MockServer;

  const mockBattleService = {
    joinLobby: jest.fn(),
    leaveLobby: jest.fn(),
    setPlayerReady: jest.fn(),
    startMatch: jest.fn(),
    updateProgress: jest.fn(),
    submitSolution: jest.fn(),
    handlePlayerDisconnect: jest.fn(),
  };

  const createMockSocket = (userId: string, username: string): MockSocket => {
    const socket = {
      id: `socket_${Math.random()}`,
      user: { userId, username },
      join: jest.fn(),
      leave: jest.fn<Promise<void>, [string]>(),
      to: jest.fn(),
      emit: jest.fn(),
    } as unknown as MockSocket;

    socket.to.mockReturnValue(socket);

    return socket;
  };

  const createMockServer = (): MockServer => {
    const server = {
      to: jest.fn(),
      emit: jest.fn(),
    };

    server.to.mockReturnValue(server);

    return server;
  };

  const getEmittedPayload = (
    socket: MockSocket,
    eventName: string,
  ): unknown => {
    const calls = socket.emit.mock.calls as unknown[][];
    const matchingCall = calls.find(([emittedEvent]) => {
      return emittedEvent === eventName;
    });

    return matchingCall?.[1];
  };

  const isInvalidPayloadMessage = (
    payload: unknown,
  ): payload is InvalidPayloadMessage => {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const candidate = payload as {
      message?: unknown;
      errors?: unknown;
    };

    return (
      candidate.message === 'Invalid payload' && Array.isArray(candidate.errors)
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattleGateway,
        {
          provide: BattleService,
          useValue: mockBattleService,
        },
      ],
    })
      .overrideGuard(WsJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    gateway = module.get<BattleGateway>(BattleGateway);

    // Mock the WebSocket server
    mockServer = createMockServer();
    gateway.server = mockServer as unknown as Server;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('Connection Lifecycle', () => {
    it('should handle connection', () => {
      const socket = createMockSocket('user-1', 'TestUser');

      gateway.handleConnection(socket);

      expect(socket.id).toBeDefined();
    });

    it('should handle disconnection', async () => {
      const socket = createMockSocket('user-1', 'TestUser');

      await gateway.handleDisconnect(socket);

      expect(mockBattleService.handlePlayerDisconnect).toHaveBeenCalledWith(
        socket.id,
      );
    });

    it('should cleanup on disconnect', async () => {
      const socket = createMockSocket('user-1', 'TestUser');

      mockBattleService.handlePlayerDisconnect.mockResolvedValue(undefined);

      await gateway.handleDisconnect(socket);

      expect(mockBattleService.handlePlayerDisconnect).toHaveBeenCalledWith(
        socket.id,
      );
    });
  });

  describe('Lobby Management', () => {
    it('should join lobby successfully', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyData = {
        id: 'lobby-123',
        players: [
          {
            id: 'user-1',
            username: 'TestUser',
            avatarUrl: null,
            level: 1,
            isReady: false,
          },
        ],
        maxPlayers: 2,
        puzzleId: null,
        status: 'WAITING',
        createdAt: new Date().toISOString(),
      };

      mockBattleService.joinLobby.mockResolvedValue(lobbyData);

      const result = await gateway.handleJoinLobby(socket, {});

      expect(result).toEqual({ event: 'lobby_joined', data: lobbyData });
      expect(socket.join).toHaveBeenCalledWith(`lobby:${lobbyData.id}`);
    });

    it('should return error if user not authenticated', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      socket.user = undefined;

      const result = await gateway.handleJoinLobby(socket, {});

      expect(result).toEqual({
        event: 'battle_error',
        data: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
      });
    });

    it('emits payload validation errors for invalid join_lobby messages', async () => {
      const socket = createMockSocket('user-1', 'TestUser');

      const result = await gateway.handleJoinLobby(socket, {
        lobbyId: 12345,
        puzzleDifficulty: 'IMPOSSIBLE',
      });

      expect(result).toBeUndefined();
      const errorPayload = getEmittedPayload(socket, 'error');
      expect(isInvalidPayloadMessage(errorPayload)).toBe(true);
      if (!isInvalidPayloadMessage(errorPayload)) {
        throw new Error('Expected invalid payload error event');
      }
      expect(errorPayload.errors).toEqual(expect.any(Array));
      expect(socket.emit).toHaveBeenCalledWith('battle_error', {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid payload',
      });
      expect(mockBattleService.joinLobby).not.toHaveBeenCalled();
    });

    it('should leave lobby successfully', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';

      mockBattleService.leaveLobby.mockResolvedValue(undefined);

      const result = await gateway.handleLeaveLobby(socket, { lobbyId });

      expect(result).toEqual({
        event: 'left_lobby',
        data: { success: true },
      });
      expect(socket.leave).toHaveBeenCalledWith(`lobby:${lobbyId}`);
      expect(mockBattleService.leaveLobby).toHaveBeenCalledWith(
        lobbyId,
        'user-1',
      );
    });

    it('should notify players on join', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyData = {
        id: 'lobby-123',
        players: [
          {
            id: 'user-1',
            username: 'TestUser',
            avatarUrl: null,
            level: 1,
            isReady: false,
          },
        ],
        maxPlayers: 2,
        puzzleId: null,
        status: 'WAITING',
        createdAt: new Date().toISOString(),
      };

      mockBattleService.joinLobby.mockResolvedValue(lobbyData);

      await gateway.handleJoinLobby(socket, {});

      expect(socket.to).toHaveBeenCalledWith(`lobby:${lobbyData.id}`);
    });

    it('should notify players on leave', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';

      mockBattleService.leaveLobby.mockResolvedValue(undefined);

      await gateway.handleLeaveLobby(socket, { lobbyId });

      expect(mockServer.to).toHaveBeenCalledWith(`lobby:${lobbyId}`);
      expect(mockServer.emit).toHaveBeenCalled();
    });
  });

  describe('Game Flow', () => {
    it('emits payload validation errors for invalid player_ready messages', async () => {
      const socket = createMockSocket('user-1', 'TestUser');

      const result = await gateway.handlePlayerReady(socket, {
        lobbyId: 'lobby-123',
        isReady: 'yes',
      });

      expect(result).toBeUndefined();
      const errorPayload = getEmittedPayload(socket, 'error');
      expect(isInvalidPayloadMessage(errorPayload)).toBe(true);
      if (!isInvalidPayloadMessage(errorPayload)) {
        throw new Error('Expected invalid payload error event');
      }
      expect(errorPayload.errors).toEqual(expect.any(Array));
      expect(mockBattleService.setPlayerReady).not.toHaveBeenCalled();
    });

    it('should handle ready state changes', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';

      mockBattleService.setPlayerReady.mockResolvedValue({ allReady: false });

      const result = await gateway.handlePlayerReady(socket, {
        lobbyId,
        isReady: true,
      });

      expect(result).toEqual({
        event: 'ready_updated',
        data: { success: true },
      });
      expect(mockBattleService.setPlayerReady).toHaveBeenCalledWith(
        lobbyId,
        'user-1',
        true,
      );
    });

    it('should start match when all ready', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';
      const matchData = {
        lobbyId,
        puzzleId: 'puzzle-123',
        encryptedPattern: 'test-pattern',
        difficulty: 'BEGINNER',
        countdownSeconds: 5,
      };

      mockBattleService.setPlayerReady.mockResolvedValue({ allReady: true });
      mockBattleService.startMatch.mockResolvedValue(matchData);

      await gateway.handlePlayerReady(socket, { lobbyId, isReady: true });

      expect(mockBattleService.startMatch).toHaveBeenCalledWith(lobbyId);
      expect(mockServer.to).toHaveBeenCalledWith(`lobby:${lobbyId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('match_start', matchData);
    });

    it('should update progress', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';
      const progressData = {
        lobbyId,
        progress: 50,
        correctCharacters: 10,
        totalCharacters: 20,
        hintsUsed: 1,
      };

      mockBattleService.updateProgress.mockResolvedValue(undefined);

      await gateway.handleProgressUpdate(socket, progressData);

      expect(mockBattleService.updateProgress).toHaveBeenCalledWith(
        lobbyId,
        'user-1',
        progressData,
      );
      expect(socket.to).toHaveBeenCalledWith(`lobby:${lobbyId}`);
    });

    it('emits payload validation errors for out-of-range progress updates', async () => {
      const socket = createMockSocket('user-1', 'TestUser');

      const result = await gateway.handleProgressUpdate(socket, {
        lobbyId: 'lobby-123',
        progress: 150,
        correctCharacters: 10,
        totalCharacters: 20,
        hintsUsed: 1,
      });

      expect(result).toBeUndefined();
      expect(socket.emit).toHaveBeenCalledWith(
        'battle_error',
        expect.objectContaining({
          code: 'INVALID_PAYLOAD',
        }),
      );
      expect(mockBattleService.updateProgress).not.toHaveBeenCalled();
    });

    it('should submit solution and end game', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';
      const solutionData = {
        lobbyId,
        solution: 'test solution',
        timeElapsed: 120,
      };
      const submitResult = {
        isCorrect: true,
        gameOver: true,
        winnerId: 'user-1',
        winnerUsername: 'TestUser',
        results: [
          {
            playerId: 'user-1',
            username: 'TestUser',
            score: 1000,
            timeElapsed: 120,
            isCorrect: true,
            hintsUsed: 0,
          },
        ],
      };

      mockBattleService.submitSolution.mockResolvedValue(submitResult);

      const result = await gateway.handleSubmitSolution(socket, solutionData);

      expect(result).toEqual({
        event: 'solution_submitted',
        data: { isCorrect: true },
      });
      expect(mockServer.to).toHaveBeenCalledWith(`lobby:${lobbyId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('game_over', {
        lobbyId,
        winnerId: submitResult.winnerId,
        winnerUsername: submitResult.winnerUsername,
        results: submitResult.results,
      });
    });

    it('emits payload validation errors when submit_solution is missing the solution', async () => {
      const socket = createMockSocket('user-1', 'TestUser');

      const result = await gateway.handleSubmitSolution(socket, {
        lobbyId: 'lobby-123',
        timeElapsed: 120,
      });

      expect(result).toBeUndefined();
      expect(socket.emit).toHaveBeenCalledWith(
        'battle_error',
        expect.objectContaining({
          code: 'INVALID_PAYLOAD',
        }),
      );
      expect(mockBattleService.submitSolution).not.toHaveBeenCalled();
    });

    it('should handle incorrect solution without ending game', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';
      const solutionData = {
        lobbyId,
        solution: 'wrong solution',
        timeElapsed: 120,
      };
      const submitResult = {
        isCorrect: false,
        gameOver: false,
      };

      mockBattleService.submitSolution.mockResolvedValue(submitResult);

      const result = await gateway.handleSubmitSolution(socket, solutionData);

      expect(result).toEqual({
        event: 'solution_submitted',
        data: { isCorrect: false },
      });
      expect(mockServer.emit).not.toHaveBeenCalledWith(
        'game_over',
        expect.any(Object),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle join lobby errors', async () => {
      const socket = createMockSocket('user-1', 'TestUser');

      mockBattleService.joinLobby.mockRejectedValue(new Error('Join failed'));

      const result = await gateway.handleJoinLobby(socket, {});

      expect(result).toEqual({
        event: 'battle_error',
        data: { code: 'JOIN_FAILED', message: 'Failed to join lobby' },
      });
    });

    it('should handle leave lobby errors', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';

      mockBattleService.leaveLobby.mockRejectedValue(new Error('Leave failed'));

      const result = await gateway.handleLeaveLobby(socket, { lobbyId });

      expect(result).toEqual({
        event: 'battle_error',
        data: { code: 'LEAVE_FAILED', message: 'Failed to leave lobby' },
      });
    });

    it('should handle player ready errors', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';

      mockBattleService.setPlayerReady.mockRejectedValue(
        new Error('Ready failed'),
      );

      const result = await gateway.handlePlayerReady(socket, {
        lobbyId,
        isReady: true,
      });

      expect(result).toEqual({
        event: 'battle_error',
        data: {
          code: 'READY_FAILED',
          message: 'Failed to update ready state',
        },
      });
    });

    it('should handle submit solution errors', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const solutionData = {
        lobbyId: 'lobby-123',
        solution: 'test',
        timeElapsed: 120,
      };

      mockBattleService.submitSolution.mockRejectedValue(
        new Error('Submit failed'),
      );

      const result = await gateway.handleSubmitSolution(socket, solutionData);

      expect(result).toEqual({
        event: 'battle_error',
        data: { code: 'SUBMIT_FAILED', message: 'Failed to submit solution' },
      });
    });
  });
});
