import { Test, TestingModule } from '@nestjs/testing';
import { GameEventService } from './game.event.service';
import { Socket } from 'socket.io';
import { User } from '../../schemas/user.schema';
import { SocketMessages } from '../../shared/enums/socket.messages.enum';
import { IMove, IValidMove } from '../../shared/interfaces/engine.interface';
import {
  mockGame,
  mockMove,
  mockMoveDetails,
} from '../../game/service/game.service.mock';
import { mockUser } from '../../user/service/user.service.mock';

describe('GameEventService', () => {
  let service: GameEventService;
  let mockClient: jest.Mocked<Socket>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameEventService],
    }).compile();

    service = module.get<GameEventService>(GameEventService);

    // Mock du socket client
    mockClient = {
      emit: jest.fn(),
      join: jest.fn(),
      to: jest.fn().mockReturnThis(),
      leave: jest.fn(),
      socketsLeave: jest.fn(),
    } as unknown as jest.Mocked<Socket>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emitGameCreated', () => {
    it('should join room and emit game created event', async () => {
      const game = mockGame();

      await service.emitGameCreated(mockClient, game);

      const joinSpy = jest.spyOn(mockClient, 'join');
      const emitSpy = jest.spyOn(mockClient, 'emit');

      expect(joinSpy).toHaveBeenCalledWith(game.id);
      expect(emitSpy).toHaveBeenCalledWith(SocketMessages.GAME_CREATED, game);
    });
  });

  describe('emitGameJoined', () => {
    it('should join room and emit appropriate events', async () => {
      const game = mockGame();
      const opponentSocketId = 'socket123';

      await service.emitGameJoined(mockClient, game, opponentSocketId, game.id);

      const toSpy = jest.spyOn(mockClient, 'to');
      const emitSpy = jest.spyOn(mockClient, 'emit');

      expect(toSpy).toHaveBeenCalledWith(opponentSocketId);
      expect(emitSpy).toHaveBeenCalledWith(SocketMessages.PLAYER_JOINED, {
        gameId: game.id,
        status: 'playing',
      });
    });
  });

  describe('emitError', () => {
    it('should emit error message', () => {
      const errorMsg = 'Test error';

      service.emitError(mockClient, errorMsg);

      const emitSpy = jest.spyOn(mockClient, 'emit');
      expect(emitSpy).toHaveBeenCalledWith(SocketMessages.ERROR, errorMsg);
    });
  });

  describe('emitMoveMade', () => {
    it('should emit move to both players', () => {
      const move: IMove = mockMove();
      const mockOpponent: User = mockUser();

      service.emitMoveMade(mockClient, move, mockOpponent);
      const toSpy = jest.spyOn(mockClient, 'to');
      const emitSpy = jest.spyOn(mockClient, 'emit');
      expect(toSpy).toHaveBeenCalledWith(mockOpponent.currentSocketId);
      expect(emitSpy).toHaveBeenCalledWith(
        SocketMessages.MOVE_MADE,
        expect.objectContaining({
          currentPlayer: mockOpponent.currentSocketId,
        }),
      );
    });
  });

  describe('emitGameOver', () => {
    it('should emit game over to both players', async () => {
      const mockOpponent: User = mockUser();
      const mockDetails: IValidMove['details'] = mockMoveDetails({});

      await service.emitGameOver(
        mockClient,
        mockDetails,
        mockOpponent,
        'gameId123',
      );

      const toSpy = jest.spyOn(mockClient, 'to');
      const emitSpy = jest.spyOn(mockClient, 'emit');
      expect(toSpy).toHaveBeenCalledWith(mockOpponent.currentSocketId);
      expect(emitSpy).toHaveBeenCalledWith(SocketMessages.GAME_OVER, {
        currentPlayer: mockOpponent.currentSocketId,
      });
    });
  });

  describe('emitLeave', () => {
    it('should emit game over with resign status to winner', async () => {
      const mockWinner = mockUser('winner123');
      const toSpy = jest.spyOn(mockClient, 'to');
      const emitSpy = jest.spyOn(mockClient, 'emit');
      await service.emitLeave(mockClient, mockWinner, 'gameId123');

      expect(toSpy).toHaveBeenCalledWith(mockWinner.currentSocketId);
      expect(emitSpy).toHaveBeenCalledWith(
        SocketMessages.GAME_OVER,
        expect.objectContaining({
          winner: mockWinner,
          status: 'resign',
        }),
      );
    });
  });
});
