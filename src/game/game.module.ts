import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { EngineService } from '../engine/engine.service';

@Module({
  providers: [GameService, GameGateway, EngineService],
  controllers: [GameController],
})
export class GameModule {}
