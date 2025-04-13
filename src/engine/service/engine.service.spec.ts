import { Test, TestingModule } from '@nestjs/testing';
import { EngineService } from './engine.service';
import { Chess, Move } from 'chess.js';
import { mockMove } from '../../game/service/game.service.mock';

jest.mock('chess.js', () => {
  return {
    Chess: jest.fn().mockImplementation(() => ({
      fen: jest.fn().mockReturnValue('initial fen'),
      move: jest.fn().mockReturnValue({
        from: 'e2',
        to: 'e4',
        san: 'e4',
      }),
      undo: jest.fn(),
      isCheckmate: jest.fn().mockReturnValue(false),
      isStalemate: jest.fn().mockReturnValue(false),
      isDraw: jest.fn().mockReturnValue(false),
    })),
  };
});

describe('EngineService', () => {
  let service: EngineService;
  let chessMock: jest.Mocked<Chess>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EngineService],
    }).compile();

    service = module.get<EngineService>(EngineService);
    chessMock = new Chess() as jest.Mocked<Chess>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('newGame', () => {
    it('should create a new chess game and return initial FEN', () => {
      const gameId = 'test123';
      const initialFen = new Chess().fen();

      const result = service.newGame(gameId);

      expect(result).toBe(initialFen);
      expect(service['boards'].has(gameId)).toBeTruthy();
    });
  });

  describe('makeMove', () => {
    it('should successfully make a valid move', () => {
      const gameId = 'test123';
      service.newGame(gameId); // TODO: should be mocked
      jest.spyOn(chessMock, 'move').mockReturnValue({
        from: 'e2',
        to: 'e4',
        san: 'e4',
      } as Move);

      const result = service.makeMove(gameId, { from: 'e2', to: 'e4' });

      expect(result.valid).toBeTruthy();
      expect(result.details).toBeDefined();
      expect(result.details?.from).toBe('e2');
      expect(result.details?.to).toBe('e4');
      expect(result.details?.status).toBe('playing');
      expect(result.details?.isGameOver).toBeFalsy();
    });
  });

  describe('undoMove', () => {
    it('should undo last move', () => {
      const gameId = 'test123';
      const chess = new Chess();
      service.newGame(gameId);

      jest
        .spyOn(service, 'makeMove')
        .mockReturnValue(mockMove(true, { from: 'e2', to: 'e4' }));
      const initialFen = chess.fen();
      service.undoMove(gameId);

      const board = service['boards'].get(gameId);
      expect(board?.fen()).toBe(initialFen);
    });

    it('should do nothing when game not found', () => {
      expect(() => service.undoMove('nonexistent')).not.toThrow();
    });
  });

  describe('getGameStatus', () => {
    describe('getGameStatus', () => {
      it('should return checkmate status', () => {
        const checkmateSpyOn = jest
          .spyOn(chessMock, 'isCheckmate')
          .mockReturnValue(true);
        jest.spyOn(chessMock, 'isStalemate').mockReturnValue(false);
        jest.spyOn(chessMock, 'isDraw').mockReturnValue(false);
        expect(service['getGameStatus'](chessMock)).toBe('checkmate');
        expect(checkmateSpyOn).toHaveBeenCalled();
      });

      it('should return stalemate status', () => {
        jest.spyOn(chessMock, 'isCheckmate').mockReturnValue(false);
        const stalemateSpyOn = jest
          .spyOn(chessMock, 'isStalemate')
          .mockReturnValue(true);
        jest.spyOn(chessMock, 'isDraw').mockReturnValue(false);
        expect(service['getGameStatus'](chessMock)).toBe('stalemate');
        expect(stalemateSpyOn).toHaveBeenCalled();
      });

      it('should return draw status', () => {
        jest.spyOn(chessMock, 'isCheckmate').mockReturnValue(false);
        jest.spyOn(chessMock, 'isStalemate').mockReturnValue(false);
        const drawSpyOn = jest.spyOn(chessMock, 'isDraw').mockReturnValue(true);
        expect(service['getGameStatus'](chessMock)).toBe('draw');
        expect(drawSpyOn).toHaveBeenCalled();
      });

      it('should return playing status when no other condition is met', () => {
        expect(service['getGameStatus'](chessMock)).toBe('playing');
        const checkmateSpyOn = jest
          .spyOn(chessMock, 'isCheckmate')
          .mockReturnValue(false);
        const stalemateSpyOn = jest
          .spyOn(chessMock, 'isStalemate')
          .mockReturnValue(false);
        const drawSpyOn = jest
          .spyOn(chessMock, 'isDraw')
          .mockReturnValue(false);
        expect(checkmateSpyOn).toHaveBeenCalled();
        expect(stalemateSpyOn).toHaveBeenCalled();
        expect(drawSpyOn).toHaveBeenCalled();
      });
    });
  });

  describe('isGameOver', () => {
    it('should correctly identify game over states', () => {
      expect(service['isGameOver']('playing')).toBeFalsy();
      expect(service['isGameOver']('checkmate')).toBeTruthy();
      expect(service['isGameOver']('stalemate')).toBeTruthy();
      expect(service['isGameOver']('draw')).toBeTruthy();
    });
  });
});
