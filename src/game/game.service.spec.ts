import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { getModelToken } from '@nestjs/mongoose';
import { Game, GameDocument } from '../schemas/game.schema';
import { Model, Query } from 'mongoose';
import {
  LOSER_EMAIL,
  mockUser,
  UserServiceMock,
  usersMock,
  WINNER_EMAIL,
} from '../user/user.service.mock';
import { EngineServiceMock } from '../engine/engine.service.mock';
import { EngineService } from '../engine/engine.service';
import { createMock } from '@golevelup/ts-jest';
import {
  GameNotFoundException,
  IllegalMoveException,
} from '../exceptions/game.exception';
import { NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import {
  mockGame,
  mockGameDoc,
  mockMove,
  mockMoveDetails,
  mockValidMove,
} from './game.service.mock';

describe('GameService', () => {
  let service: GameService;
  let engineService: EngineService;
  let userService: UserService;
  let gameModel: Model<GameDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        UserServiceMock,
        EngineServiceMock,
        {
          provide: getModelToken('Game'),
          useValue: {
            new: jest.fn().mockResolvedValue(mockGame()),
            constructor: jest.fn().mockReturnThis(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            create: jest.fn().mockResolvedValue(mockGame()),
            remove: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
            populate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    gameModel = module.get<Model<GameDocument>>(getModelToken('Game'));
    engineService = module.get<EngineService>(EngineService);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isLegalMove', () => {
    it('should be true if move is valid and contains details', () => {
      const move = mockMove(true, {});
      expect(service.isLegalMove(move)).toBeTruthy();
    });

    it('should be false if move has no details', () => {
      const move = mockMove(true, undefined);
      expect(service.isLegalMove(move)).toBeFalsy();
    });

    it('should be false if move is not valid', () => {
      const move = mockMove(false, {});
      expect(service.isLegalMove(move)).toBeFalsy();
    });
  });

  describe('undoMove', () => {
    it('should call engine undoMove', () => {
      const undoMoveSpy = jest.spyOn(engineService, 'undoMove');
      service.undoMove(mockGame());
      expect(undoMoveSpy).toHaveBeenCalledWith(mockGame().id);
    });
  });

  it('should findAndUpdatePlayerSocket ?', async () => {
    const findOneSpy = jest.spyOn(gameModel, 'findOne');
    findOneSpy.mockReturnValueOnce(
      createMock<Query<GameDocument, GameDocument>>({
        exec: jest.fn().mockResolvedValueOnce(mockGameDoc()),
      }),
    );
    await service.getGameWithPlayers('game1');

    expect(findOneSpy).toHaveBeenCalledWith({ id: 'game1' });
  });

  describe('buildEndPayload', () => {
    it('should set winner when status is checkmate and winner exists', () => {
      const game = mockGameDoc({
        players: usersMock,
      });

      const moveDetails = mockMoveDetails({
        fen: 'final-position',
        status: 'checkmate',
        isGameOver: true,
      });

      const result = service.buildEndPayload(game, moveDetails, WINNER_EMAIL);

      expect(result.fen).toBe('final-position');
      expect(result.status).toBe('checkmate');
      expect(result.winner).toBe(game.players[0]);
    });

    it('should set winner when status is resign and winner exists', () => {
      const game = mockGameDoc({
        players: usersMock,
      });

      const moveDetails = mockMoveDetails({
        fen: 'final-position',
        status: 'resign',
        isGameOver: true,
      });

      const result = service.buildEndPayload(game, moveDetails, WINNER_EMAIL);

      expect(result.winner).toBe(game.players[0]);
    });

    it('should not set winner when status is draw even if winner email provided', () => {
      const game = mockGameDoc({
        players: usersMock,
      });

      const moveDetails = mockMoveDetails({
        fen: 'draw-position',
        status: 'draw',
        isGameOver: true,
      });

      const result = service.buildEndPayload(game, moveDetails, WINNER_EMAIL);

      expect(result.fen).toBe('draw-position');
      expect(result.status).toBe('draw');
      expect(result.winner).toBeUndefined();
    });

    it('should update game state without setting winner when email does not match', () => {
      const game = mockGameDoc();

      const moveDetails = mockMoveDetails({
        fen: 'checkmate-position',
        status: 'checkmate',
        isGameOver: true,
      });

      const result = service.buildEndPayload(
        game,
        moveDetails,
        'nonexistent@gmail.com',
      );

      expect(result.fen).toBe('checkmate-position');
      expect(result.status).toBe('checkmate');
      expect(result.winner).toBeUndefined();
    });
  });

  describe('buildUpdatePayload', () => {
    it('should update game state with move details and new current player', () => {
      const game = mockGameDoc();
      const opponent = mockUser('player2', 3000, LOSER_EMAIL, 'player2');
      const move = mockValidMove({
        fen: 'new-position',
        status: 'playing',
        isGameOver: false,
      });

      const result = service.buildUpdatePayload(game, move, opponent);

      expect(result.fen).toBe('new-position');
      expect(result.status).toBe('playing');
      expect(result.currentPlayer).toBe(opponent);
    });

    it('should preserve other game properties while updating state', () => {
      const initialGame = mockGameDoc({
        id: 'game123',
        players: usersMock,
      });

      const opponent = initialGame.players[1];
      const move = mockValidMove({
        fen: 'updated-position',
        status: 'playing',
        isGameOver: false,
      });

      const result = service.buildUpdatePayload(initialGame, move, opponent);

      expect(result.id).toBe('game123');
      expect(result.players).toHaveLength(2);
      expect(result.fen).toBe('updated-position');
      expect(result.currentPlayer).toBe(opponent);
    });

    it('should handle different game statuses', () => {
      const game = mockGameDoc();
      const opponent = mockUser(
        'player2',
        3000,
        'opponent@gmail.com',
        'player2',
      );
      const move = mockValidMove({
        fen: 'new-position',
        status: 'playing',
        isGameOver: false,
      });

      const result = service.buildUpdatePayload(game, move, opponent);

      expect(result.status).toBe('playing');
      expect(result.fen).toBe('new-position');
      expect(result.currentPlayer).toBe(opponent);
    });
  });

  describe('makeMove', () => {
    const moveRequest = {
      from: 'e2',
      to: 'e4',
    };

    it('should process a valid move successfully', () => {
      const game = mockGameDoc();
      const opponent = mockUser('player2', 3000, LOSER_EMAIL, 'player2');
      const validMove = mockValidMove({
        fen: 'new-position',
        status: 'playing',
        isGameOver: false,
      });

      const makeMoveSpy = jest
        .spyOn(engineService, 'makeMove')
        .mockReturnValue(validMove);

      const result = service.makeMove(
        game,
        moveRequest,
        opponent,
        WINNER_EMAIL,
      );

      expect(makeMoveSpy).toHaveBeenCalledWith(game.id, moveRequest);
      expect(result.move).toBe(validMove);
      expect(result.game.fen).toBe('new-position');
      expect(result.game.currentPlayer).toBe(opponent);
    });

    it('should handle game over scenario', () => {
      const game = mockGameDoc({
        players: usersMock,
      });
      const opponent = mockUser('player2', 3000, LOSER_EMAIL, 'player2');
      const gameOverMove = mockValidMove({
        fen: 'checkmate-position',
        status: 'checkmate',
        isGameOver: true,
      });

      jest.spyOn(engineService, 'makeMove').mockReturnValue(gameOverMove);

      const result = service.makeMove(
        game,
        moveRequest,
        opponent,
        WINNER_EMAIL,
      );

      expect(result.move.details.isGameOver).toBe(true);
      expect(result.game.status).toBe('checkmate');
      expect(result.game.winner).toBe(game.players[0]);
    });

    it('should throw GameNotFoundException if game is not found', () => {
      const opponent = mockUser('player2', 3000, LOSER_EMAIL, 'player2');

      expect(() =>
        service.makeMove(
          null as unknown as GameDocument,
          moveRequest,
          opponent,
          WINNER_EMAIL,
        ),
      ).toThrow(GameNotFoundException);
    });

    it('should throw IllegalMoveException for illegal move', () => {
      const game = mockGameDoc();
      const opponent = mockUser('player2', 3000, LOSER_EMAIL, 'player2');
      const invalidMove = mockMove(false);

      jest.spyOn(engineService, 'makeMove').mockReturnValue(invalidMove);

      expect(() =>
        service.makeMove(game, moveRequest, opponent, WINNER_EMAIL),
      ).toThrow(IllegalMoveException);
    });

    it('should call buildUpdatePayload for ongoing game', () => {
      const game = mockGameDoc();
      const opponent = mockUser('player2', 3000, LOSER_EMAIL, 'player2');
      const validMove = mockValidMove({
        fen: 'new-position',
        status: 'playing',
        isGameOver: false,
      });

      jest.spyOn(engineService, 'makeMove').mockReturnValue(validMove);
      const buildUpdateSpy = jest.spyOn(service, 'buildUpdatePayload');

      service.makeMove(game, moveRequest, opponent, WINNER_EMAIL);

      expect(buildUpdateSpy).toHaveBeenCalledWith(game, validMove, opponent);
    });

    it('should call buildEndPayload for finished game', () => {
      const game = mockGameDoc();
      const opponent = mockUser('player2', 3000, LOSER_EMAIL, 'player2');
      const gameOverMove = mockValidMove({
        fen: 'checkmate-position',
        status: 'checkmate',
        isGameOver: true,
      });

      jest.spyOn(engineService, 'makeMove').mockReturnValue(gameOverMove);
      const buildEndSpy = jest.spyOn(service, 'buildEndPayload');

      service.makeMove(game, moveRequest, opponent, WINNER_EMAIL);

      expect(buildEndSpy).toHaveBeenCalledWith(
        game,
        gameOverMove.details,
        WINNER_EMAIL,
      );
    });
  });
  describe('joinGame', () => {
    const gameId = 'game123';
    const email = 'player@test.com';
    const socketId = 'socket123';

    it('should successfully join a game', async () => {
      const user = mockUser('socket123', 3000, email, 'player');
      const game = mockGameDoc({
        id: gameId,
        players: [mockUser()],
        status: 'pending',
      });

      jest
        .spyOn(userService, 'findAndUpdatePlayerSocket')
        .mockResolvedValue(user);

      jest.spyOn(service, 'getGameWithPlayers').mockResolvedValue(game);

      const result = await service.joinGame(gameId, email, socketId);

      expect(result?.players).toHaveLength(2);
      expect(result?.players).toContain(user);
      expect(result?.status).toBe('playing');
    });

    it('should throw NotFoundException when game is not found', async () => {
      const user = mockUser('socket123', 3000, email, 'player');
      jest
        .spyOn(userService, 'findAndUpdatePlayerSocket')
        .mockResolvedValue(user);
      jest.spyOn(service, 'getGameWithPlayers').mockResolvedValue(null);

      await expect(service.joinGame(gameId, email, socketId)).rejects.toThrow(
        new NotFoundException(
          `Game with id ${gameId} not found or already full : no player(s) inside`,
        ),
      );
    });

    it('should throw NotFoundException when game is full', async () => {
      const user = mockUser('socket123', 3000, email, 'player');
      const fullGame = mockGameDoc({
        id: gameId,
        players: usersMock,
      });

      jest
        .spyOn(userService, 'findAndUpdatePlayerSocket')
        .mockResolvedValue(user);
      jest.spyOn(service, 'getGameWithPlayers').mockResolvedValue(fullGame);

      await expect(service.joinGame(gameId, email, socketId)).rejects.toThrow(
        new NotFoundException(
          `Game with id ${gameId} not found or already full : 2 player(s) inside`,
        ),
      );
    });
  });

  describe('getGame', () => {
    const gameId = 'game123';

    it('should return game when found', async () => {
      const expectedGame = mockGameDoc({
        id: gameId,
        status: 'pending',
      });

      const findOneSpy = jest.spyOn(gameModel, 'findOne');
      findOneSpy.mockReturnValueOnce(
        createMock<Query<GameDocument, GameDocument>>({
          exec: jest.fn().mockResolvedValueOnce(expectedGame),
        }),
      );

      const result = await service.getGame(gameId);

      expect(findOneSpy).toHaveBeenCalledWith({ id: gameId });
      expect(result).toBe(expectedGame);
    });

    it('should return null when game is not found', async () => {
      const findOneSpy = jest.spyOn(gameModel, 'findOne');
      findOneSpy.mockReturnValueOnce(
        createMock<Query<GameDocument, GameDocument>>({
          exec: jest.fn().mockResolvedValueOnce(null),
        }),
      );

      const result = await service.getGame(gameId);

      expect(findOneSpy).toHaveBeenCalledWith({ id: gameId });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const findOneSpy = jest.spyOn(gameModel, 'findOne');
      findOneSpy.mockReturnValueOnce(
        createMock<Query<GameDocument, GameDocument>>({
          exec: jest.fn().mockRejectedValueOnce(new Error('DB Error')),
        }),
      );

      await expect(service.getGame(gameId)).rejects.toThrow('DB Error');
    });
  });

  describe('createGame', () => {
    const email = 'player@test.com';
    const socketId = 'socket123';

    it('should create a new game successfully', async () => {
      const user = mockUser(socketId, 3000, email, 'player');
      const gameId = 'abc123';
      const initialFen = 'starting-position';

      jest
        .spyOn(userService, 'findAndUpdatePlayerSocket')
        .mockResolvedValue(user);

      jest.spyOn(engineService, 'newGame').mockReturnValue(initialFen);

      const mockSavedGame = mockGameDoc({
        id: gameId,
        players: [user],
        status: 'pending',
        fen: initialFen,
        currentPlayer: user,
      });

      const createGameSpy = jest
        .spyOn(gameModel, 'create')
        .mockResolvedValue(mockSavedGame as any);

      const result = await service.createGame(email, socketId);

      expect(createGameSpy).toHaveBeenCalledWith({
        id: expect.any(String),
        players: [user],
        status: 'pending',
        fen: initialFen,
        currentPlayer: user,
      });
      expect(result.id).toBeDefined();
      expect(result.players).toEqual([user]);
      expect(result.status).toBe('pending');
      expect(result.fen).toBe(initialFen);
      expect(result.currentPlayer).toBe(user);
    });

    it('should initialize game with engine', async () => {
      const user = mockUser(socketId, 3000, email, 'player');
      const initialFen = 'starting-position';
      const mockSavedGame = mockGameDoc({
        players: [user],
        fen: initialFen,
      });

      jest
        .spyOn(userService, 'findAndUpdatePlayerSocket')
        .mockResolvedValue(user);

      const engineServiceNewGameSpy = jest
        .spyOn(engineService, 'newGame')
        .mockReturnValue(initialFen);

      jest.spyOn(gameModel, 'create').mockResolvedValue(mockSavedGame as any);

      await service.createGame(email, socketId);

      expect(engineServiceNewGameSpy).toHaveBeenCalled();
      expect(engineServiceNewGameSpy).toHaveReturnedWith(initialFen);
    });

    it('should handle database errors during save', async () => {
      const user = mockUser(socketId, 3000, email, 'player');

      jest
        .spyOn(userService, 'findAndUpdatePlayerSocket')
        .mockResolvedValue(user);

      jest.spyOn(gameModel, 'create').mockRejectedValue(new Error('DB Error'));

      await expect(service.createGame(email, socketId)).rejects.toThrow(
        'DB Error',
      );
    });
  });
});
