import { Test, TestingModule } from '@nestjs/testing';
import { BattleService } from './battle.service';
import { PrismaService } from '../../prisma';
import { Difficulty } from '@prisma/client';

describe('BattleService', () => {
  let service: BattleService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    puzzle: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BattleService>(BattleService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Lobby Management', () => {
    it('should create new lobby', async () => {
      const socketId = 'socket-123';
      const userId = 'user-123';
      const username = 'TestUser';

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        currentLevel: 5,
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      const lobby = await service.joinLobby(
        socketId,
        userId,
        username,
        undefined,
        'BEGINNER',
      );

      expect(lobby).toHaveProperty('id');
      expect(lobby.players).toHaveLength(1);
      expect(lobby.players[0].username).toBe(username);
      expect(lobby.maxPlayers).toBe(2);
      expect(lobby.status).toBe('WAITING');
    });

    it('should join existing lobby', async () => {
      const socket1 = 'socket-1';
      const user1 = 'user-1';
      const socket2 = 'socket-2';
      const user2 = 'user-2';

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: user1,
        currentLevel: 1,
        avatarUrl: null,
      });

      // Create first lobby
      const lobby1 = await service.joinLobby(
        socket1,
        user1,
        'User1',
        undefined,
        'BEGINNER',
      );

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: user2,
        currentLevel: 2,
        avatarUrl: null,
      });

      // Join same lobby (should find waiting lobby with matching difficulty)
      const lobby2 = await service.joinLobby(
        socket2,
        user2,
        'User2',
        undefined,
        'BEGINNER',
      );

      expect(lobby1.id).toBe(lobby2.id);
      expect(lobby2.players).toHaveLength(2);
    });

    it('should prevent joining full lobby', async () => {
      const socket1 = 'socket-1';
      const user1 = 'user-1';
      const socket2 = 'socket-2';
      const user2 = 'user-2';
      const socket3 = 'socket-3';
      const user3 = 'user-3';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      // Create and fill lobby
      const lobby1 = await service.joinLobby(
        socket1,
        user1,
        'User1',
        undefined,
        'BEGINNER',
      );
      await service.joinLobby(socket2, user2, 'User2', lobby1.id);

      // Try to join full lobby
      await expect(
        service.joinLobby(socket3, user3, 'User3', lobby1.id),
      ).rejects.toThrow('Lobby is full');
    });

    it('should cleanup empty lobbies', async () => {
      const socketId = 'socket-123';
      const userId = 'user-123';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      const lobby = await service.joinLobby(
        socketId,
        userId,
        'TestUser',
        undefined,
        'BEGINNER',
      );

      await service.leaveLobby(lobby.id, userId);

      // Lobby should be deleted
      expect(service.getLobby(lobby.id)).toBeUndefined();
    });

    it('should create separate lobbies for different difficulties', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      const lobby1 = await service.joinLobby(
        'socket-1',
        'user-1',
        'User1',
        undefined,
        'BEGINNER',
      );
      const lobby2 = await service.joinLobby(
        'socket-2',
        'user-2',
        'User2',
        undefined,
        'INTERMEDIATE',
      );

      expect(lobby1.id).not.toBe(lobby2.id);
    });
  });

  describe('Player Disconnect Edge Cases', () => {
    it('should remove player from lobby on disconnect', async () => {
      const socketId = 'socket-123';
      const userId = 'user-123';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      const lobby = await service.joinLobby(
        socketId,
        userId,
        'TestUser',
        undefined,
        'BEGINNER',
      );

      await service.handlePlayerDisconnect(socketId);

      expect(service.getLobby(lobby.id)).toBeUndefined();
    });

    it('should delete lobby when last player leaves', async () => {
      const socket1 = 'socket-1';
      const user1 = 'user-1';
      const socket2 = 'socket-2';
      const user2 = 'user-2';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      const lobby = await service.joinLobby(
        socket1,
        user1,
        'User1',
        undefined,
        'BEGINNER',
      );
      await service.joinLobby(socket2, user2, 'User2', lobby.id);

      // First player leaves
      await service.leaveLobby(lobby.id, user1);
      expect(service.getLobby(lobby.id)).toBeDefined();

      // Second player leaves
      await service.leaveLobby(lobby.id, user2);
      expect(service.getLobby(lobby.id)).toBeUndefined();
    });

    it('should handle disconnect during match', async () => {
      const socket1 = 'socket-1';
      const user1 = 'user-1';
      const socket2 = 'socket-2';
      const user2 = 'user-2';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      mockPrismaService.puzzle.findMany.mockResolvedValue([
        {
          id: 'puzzle-123',
          difficulty: Difficulty.BEGINNER,
          gameMode: 'CHALLENGE',
          encryptedPattern: 'test-pattern',
          originalReflection: 'test-solution',
        },
      ]);

      // Create lobby with 2 players
      const lobby = await service.joinLobby(
        socket1,
        user1,
        'User1',
        undefined,
        'BEGINNER',
      );
      await service.joinLobby(socket2, user2, 'User2', lobby.id);

      // Set both ready
      await service.setPlayerReady(lobby.id, user1, true);
      await service.setPlayerReady(lobby.id, user2, true);

      // Start match
      await service.startMatch(lobby.id);

      // Player 1 disconnects during match
      await service.handlePlayerDisconnect(socket1);

      // Lobby should still exist with player 2
      const updatedLobby = service.getLobby(lobby.id);
      expect(updatedLobby).toBeDefined();
      expect(updatedLobby?.players.size).toBe(1);
    });

    it('should cleanup socket-to-player mapping', async () => {
      const socketId = 'socket-123';
      const userId = 'user-123';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      await service.joinLobby(socketId, userId, 'TestUser', undefined, 'BEGINNER');

      await service.handlePlayerDisconnect(socketId);

      // Attempting to disconnect again should not cause errors
      await expect(
        service.handlePlayerDisconnect(socketId),
      ).resolves.toBeUndefined();
    });
  });

  describe('Multiple Connections', () => {
    it('should handle same user with multiple sockets', async () => {
      const socket1 = 'socket-1';
      const socket2 = 'socket-2';
      const userId = 'user-123';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      // First connection
      const lobby1 = await service.joinLobby(
        socket1,
        userId,
        'TestUser',
        undefined,
        'BEGINNER',
      );

      // Second connection (e.g., page refresh)
      const lobby2 = await service.joinLobby(
        socket2,
        userId,
        'TestUser',
        lobby1.id,
      );

      expect(lobby2.players).toHaveLength(1);
      expect(lobby2.players[0].id).toBe(userId);
    });

    it('should cleanup old connection on new join', async () => {
      const socket1 = 'socket-1';
      const socket2 = 'socket-2';
      const userId = 'user-123';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      // Join with first socket
      const lobby1 = await service.joinLobby(
        socket1,
        userId,
        'TestUser',
        undefined,
        'BEGINNER',
      );

      // Disconnect first socket
      await service.handlePlayerDisconnect(socket1);

      // Join with second socket
      const lobby2 = await service.joinLobby(
        socket2,
        userId,
        'TestUser',
        undefined,
        'BEGINNER',
      );

      // Should create new lobby since old one was cleaned up
      expect(lobby2.id).not.toBe(lobby1.id);
    });
  });

  describe('Game Flow', () => {
    it('should set player ready status', async () => {
      const socketId = 'socket-123';
      const userId = 'user-123';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      const lobby = await service.joinLobby(
        socketId,
        userId,
        'TestUser',
        undefined,
        'BEGINNER',
      );

      const result = await service.setPlayerReady(lobby.id, userId, true);

      expect(result.allReady).toBe(false); // Only 1 player in 2-player lobby
    });

    it('should detect when all players are ready', async () => {
      const socket1 = 'socket-1';
      const user1 = 'user-1';
      const socket2 = 'socket-2';
      const user2 = 'user-2';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      const lobby = await service.joinLobby(
        socket1,
        user1,
        'User1',
        undefined,
        'BEGINNER',
      );
      await service.joinLobby(socket2, user2, 'User2', lobby.id);

      await service.setPlayerReady(lobby.id, user1, true);
      const result = await service.setPlayerReady(lobby.id, user2, true);

      expect(result.allReady).toBe(true);
    });

    it('should start match with random puzzle', async () => {
      const socket1 = 'socket-1';
      const user1 = 'user-1';
      const socket2 = 'socket-2';
      const user2 = 'user-2';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      mockPrismaService.puzzle.findMany.mockResolvedValue([
        {
          id: 'puzzle-123',
          difficulty: Difficulty.BEGINNER,
          gameMode: 'CHALLENGE',
          encryptedPattern: 'encrypted-test',
          originalReflection: 'test-solution',
        },
      ]);

      const lobby = await service.joinLobby(
        socket1,
        user1,
        'User1',
        undefined,
        'BEGINNER',
      );
      await service.joinLobby(socket2, user2, 'User2', lobby.id);

      const match = await service.startMatch(lobby.id);

      expect(match).toHaveProperty('puzzleId');
      expect(match).toHaveProperty('encryptedPattern');
      expect(match.lobbyId).toBe(lobby.id);
      expect(match.countdownSeconds).toBe(5);
    });

    it('should update player progress', async () => {
      const socketId = 'socket-123';
      const userId = 'user-123';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      mockPrismaService.puzzle.findMany.mockResolvedValue([
        {
          id: 'puzzle-123',
          originalReflection: 'test-solution',
        },
      ]);

      const lobby = await service.joinLobby(
        socketId,
        userId,
        'TestUser',
        undefined,
        'BEGINNER',
      );
      await service.startMatch(lobby.id);

      await service.updateProgress(lobby.id, userId, {
        progress: 50,
        correctCharacters: 10,
        totalCharacters: 20,
        hintsUsed: 1,
      });

      const lobbyData = service.getLobby(lobby.id);
      const progress = lobbyData?.progress.get(userId);

      expect(progress).toBeDefined();
      expect(progress?.progress).toBe(50);
      expect(progress?.hintsUsed).toBe(1);
    });

    it('should handle correct solution submission', async () => {
      const socketId = 'socket-123';
      const userId = 'user-123';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      mockPrismaService.puzzle.findMany.mockResolvedValue([
        {
          id: 'puzzle-123',
          originalReflection: 'test-solution',
          encryptedPattern: 'encrypted',
          difficulty: Difficulty.BEGINNER,
          gameMode: 'CHALLENGE',
        },
      ]);

      const lobby = await service.joinLobby(
        socketId,
        userId,
        'TestUser',
        undefined,
        'BEGINNER',
      );
      await service.startMatch(lobby.id);

      const result = await service.submitSolution(
        lobby.id,
        userId,
        'test-solution',
        120,
      );

      expect(result.isCorrect).toBe(true);
      expect(result.gameOver).toBe(true);
      expect(result.winnerId).toBe(userId);
    });

    it('should handle incorrect solution submission', async () => {
      const socket1 = 'socket-1';
      const user1 = 'user-1';
      const socket2 = 'socket-2';
      const user2 = 'user-2';

      mockPrismaService.user.findUnique.mockResolvedValue({
        currentLevel: 1,
        avatarUrl: null,
      });

      mockPrismaService.puzzle.findMany.mockResolvedValue([
        {
          id: 'puzzle-123',
          originalReflection: 'test-solution',
          encryptedPattern: 'encrypted',
          difficulty: Difficulty.BEGINNER,
          gameMode: 'CHALLENGE',
        },
      ]);

      // Create lobby with 2 players
      const lobby = await service.joinLobby(
        socket1,
        user1,
        'User1',
        undefined,
        'BEGINNER',
      );
      await service.joinLobby(socket2, user2, 'User2', lobby.id);
      await service.startMatch(lobby.id);

      // First player submits incorrect solution
      const result = await service.submitSolution(
        lobby.id,
        user1,
        'wrong-solution',
        120,
      );

      // Game should not end because second player hasn't submitted
      expect(result.isCorrect).toBe(false);
      expect(result.gameOver).toBe(false);
    });
  });
});
