import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import {
  KeycloakConnectModule,
  ResourceGuard,
  AuthGuard,
} from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // explain
    }),
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const keycloakUrl = configService.get('KEYCLOAK_URL');
        const keycloakRealm = configService.get('KEYCLOAK_REALM');
        const keycloakClientId = configService.get('KEYCLOAK_CLIENT_ID');
        const keycloakSecret = configService.get('KEYCLOAK_CLIENT_SECRET');
        if (
          !keycloakUrl ||
          !keycloakRealm ||
          !keycloakClientId ||
          !keycloakSecret
        ) {
          throw new Error(
            `Keycloak configuration is not defined:  : url : ${keycloakUrl}; realm: ${keycloakRealm}; clientId: ${keycloakClientId}; secret : ${keycloakSecret}`,
          );
        }

        return {
          authServerUrl: keycloakUrl,
          realm: keycloakRealm,
          clientId: keycloakClientId,
          secret: keycloakSecret,
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI'); // explain
        console.log(uri);
        if (!uri) {
          throw new Error('MONGODB_URI is not defined');
        }
        return {
          uri,
        };
      },
    }),
    GameModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
  ],
})
export class AppModule {}
