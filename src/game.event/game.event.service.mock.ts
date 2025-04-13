import { GameEventService } from './game.event.service';

export const GameEventServiceMock = {
  provide: GameEventService,
  useValue: {
    emitGameCreated: jest.fn(),
    emitGameJoined: jest.fn(),
    emitGameOver: jest.fn(),
    emitLeave: jest.fn(),
  },
};
