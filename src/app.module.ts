import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { KeycloakService } from './keycloak/keycloak.service';
import { GameEventService } from './game.event/game.event.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, //TODO: explain
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI'); //TODO: explain
        if (!uri) {
          throw new Error('MONGODB_URI is not defined');
        }
        return {
          uri,
          dbName: 'test',
        };
      },
    }),
    GameModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, KeycloakService, GameEventService],
})
export class AppModule {}
