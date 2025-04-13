import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { GameServiceMock } from '../service/game.service.mock';
import { GameEventServiceMock } from '../../game.event/service/game.event.service.mock';
import { UserServiceMock } from '../../user/service/user.service.mock';
import { KeycloakService } from '../../keycloak/service/keycloak.service';
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
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
