import { Test, TestingModule } from '@nestjs/testing';
import { GameEventService } from './game.event.service';

describe('GameEventService', () => {
  let service: GameEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameEventService],
    }).compile();

    service = module.get<GameEventService>(GameEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
