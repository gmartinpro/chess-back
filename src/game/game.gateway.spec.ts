import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { GameServiceMock } from './game.service.mock';
import { GameEventServiceMock } from '../game.event/game.event.service.mock';
import { UserServiceMock } from '../user/user.service.mock';
import { KeycloakService } from '../keycloak/keycloak.service';
import { Reflector } from '@nestjs/core';

const KeycloakServiceMock = {
  provide: KeycloakService,
  useValue: {
    verify: jest.fn().mockResolvedValue({
      email: 'test@example.com',
      realm_access: {
        roles: ['Host', 'Player'],
      },
    }),
  },
};

describe('GameGateway', () => {
  let gateway: GameGateway;
  let keycloakService: KeycloakService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        GameEventServiceMock,
        GameServiceMock,
        UserServiceMock,
        KeycloakServiceMock,
        Reflector,
      ],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
    keycloakService = module.get<KeycloakService>(KeycloakService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
