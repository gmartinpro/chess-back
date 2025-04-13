import { EngineService } from './engine.service';

export const EngineServiceMock = {
  provide: EngineService,
  useValue: {
    newGame: jest.fn(),
    makeMove: jest.fn(),
    undoMove: jest.fn(),
    getGameStatus: jest.fn(),
    isGameOver: jest.fn(),
  },
};
