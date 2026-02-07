import { Test, TestingModule } from '@nestjs/testing';
import { BattleGateway } from './battle.gateway';
import { BattleService } from './battle.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  user?: { userId: string; username: string };
}

describe('BattleGateway', () => {
  let gateway: BattleGateway;
  let battleService: BattleService;

  const mockBattleService = {
    joinLobby: jest.fn(),
    leaveLobby: jest.fn(),
    setPlayerReady: jest.fn(),
    startMatch: jest.fn(),
    updateProgress: jest.fn(),
    submitSolution: jest.fn(),
    handlePlayerDisconnect: jest.fn(),
  };

  const createMockSocket = (userId: string, username: string): AuthenticatedSocket => {
    const socket: Partial<AuthenticatedSocket> = {
      id: `socket_${Math.random()}`,
      user: { userId, username },
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    return socket as AuthenticatedSocket;
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
    battleService = module.get<BattleService>(BattleService);

    // Mock the WebSocket server
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('Connection Lifecycle', () => {
    it('should handle connection', async () => {
      const socket = createMockSocket('user-1', 'TestUser');

      await gateway.handleConnection(socket);

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
      const lobbyId = 'lobby-123';

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

      expect(result.event).toBe('lobby_joined');
      expect(result.data).toEqual(lobbyData);
      expect(socket.join).toHaveBeenCalledWith(`lobby:${lobbyData.id}`);
    });

    it('should return error if user not authenticated', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      socket.user = undefined;

      const result: any = await gateway.handleJoinLobby(socket, {});

      expect(result.event).toBe('battle_error');
      expect(result.data.code).toBe('AUTH_REQUIRED');
    });

    it('should leave lobby successfully', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';

      mockBattleService.leaveLobby.mockResolvedValue(undefined);

      const result: any = await gateway.handleLeaveLobby(socket, { lobbyId });

      expect(result.event).toBe('left_lobby');
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

      expect(gateway.server.to).toHaveBeenCalledWith(`lobby:${lobbyId}`);
      expect(gateway.server.emit).toHaveBeenCalled();
    });
  });

  describe('Game Flow', () => {
    it('should handle ready state changes', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';

      mockBattleService.setPlayerReady.mockResolvedValue({ allReady: false });

      const result: any = await gateway.handlePlayerReady(socket, {
        lobbyId,
        isReady: true,
      });

      expect(result.event).toBe('ready_updated');
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
      expect(gateway.server.to).toHaveBeenCalledWith(`lobby:${lobbyId}`);
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'match_start',
        matchData,
      );
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

      const result: any = await gateway.handleSubmitSolution(socket, solutionData);

      expect(result.event).toBe('solution_submitted');
      expect(result.data.isCorrect).toBe(true);
      expect(gateway.server.to).toHaveBeenCalledWith(`lobby:${lobbyId}`);
      expect(gateway.server.emit).toHaveBeenCalledWith('game_over', {
        lobbyId,
        winnerId: submitResult.winnerId,
        winnerUsername: submitResult.winnerUsername,
        results: submitResult.results,
      });
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

      const result: any = await gateway.handleSubmitSolution(socket, solutionData);

      expect(result.event).toBe('solution_submitted');
      expect(result.data.isCorrect).toBe(false);
      expect(gateway.server.emit).not.toHaveBeenCalledWith('game_over', expect.any(Object));
    });
  });

  describe('Error Handling', () => {
    it('should handle join lobby errors', async () => {
      const socket = createMockSocket('user-1', 'TestUser');

      mockBattleService.joinLobby.mockRejectedValue(new Error('Join failed'));

      const result: any = await gateway.handleJoinLobby(socket, {});

      expect(result.event).toBe('battle_error');
      expect(result.data.code).toBe('JOIN_FAILED');
    });

    it('should handle leave lobby errors', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';

      mockBattleService.leaveLobby.mockRejectedValue(new Error('Leave failed'));

      const result: any = await gateway.handleLeaveLobby(socket, { lobbyId });

      expect(result.event).toBe('battle_error');
      expect(result.data.code).toBe('LEAVE_FAILED');
    });

    it('should handle player ready errors', async () => {
      const socket = createMockSocket('user-1', 'TestUser');
      const lobbyId = 'lobby-123';

      mockBattleService.setPlayerReady.mockRejectedValue(
        new Error('Ready failed'),
      );

      const result: any = await gateway.handlePlayerReady(socket, {
        lobbyId,
        isReady: true,
      });

      expect(result.event).toBe('battle_error');
      expect(result.data.code).toBe('READY_FAILED');
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

      const result: any = await gateway.handleSubmitSolution(socket, solutionData);

      expect(result.event).toBe('battle_error');
      expect(result.data.code).toBe('SUBMIT_FAILED');
    });
  });
});
