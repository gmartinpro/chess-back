import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { EngineService } from '../engine/engine.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Game, GameSchema } from '../schemas/game.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { UserService } from '../user/user.service';
import { KeycloakService } from '../keycloak/keycloak.service';
import { GameEventService } from '../game.event/game.event.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [
    GameService,
    GameGateway,
    EngineService,
    UserService,
    KeycloakService,
    GameEventService,
  ],
})
export class GameModule {}
