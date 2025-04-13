import {
  GameNotFoundException,
  OpponentNotFoundException,
  IllegalMoveException,
} from './game.exception';

describe('Game Exceptions', () => {
  describe('GameNotFoundException', () => {
    it('should create exception with default message', () => {
      const exception = new GameNotFoundException();
      expect(exception.message).toBe('Game not found');
    });

    it('should create exception with game id in message', () => {
      const gameId = 'abc123';
      const exception = new GameNotFoundException(gameId);
      expect(exception.message).toBe(`Game with id ${gameId} not found`);
    });

    it('should inherit from NotFoundException', () => {
      const exception = new GameNotFoundException();
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(GameNotFoundException);
    });
  });

  describe('OpponentNotFoundException', () => {
    it('should create exception with correct message', () => {
      const exception = new OpponentNotFoundException();
      expect(exception.message).toBe('Opponent not found');
    });

    it('should inherit from NotFoundException', () => {
      const exception = new OpponentNotFoundException();
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(OpponentNotFoundException);
    });
  });

  describe('IllegalMoveException', () => {
    it('should create exception with correct message', () => {
      const exception = new IllegalMoveException();
      expect(exception.message).toBe('Illegal move');
    });

    it('should inherit from BadRequestException', () => {
      const exception = new IllegalMoveException();
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(IllegalMoveException);
    });
  });
});
