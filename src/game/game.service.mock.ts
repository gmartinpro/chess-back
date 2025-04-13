import { GameService } from './game.service';

export const GameServiceMock = {
  provide: GameService,
  useValue: {
    createGame: jest.fn(),
    getGame: jest.fn(),
    joinGame: jest.fn(),
    makeMove: jest.fn(),
    buildUpdatePayload: jest.fn(),
    buildEndPayload: jest.fn(),
    undoMove: jest.fn(),
    getGameWithPlayers: jest.fn(),
    isLegalMove: jest.fn(),
    canJoinGame: jest.fn(),
  },
};
