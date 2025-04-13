import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakService } from './keycloak.service';
import { ConfigService } from '@nestjs/config';

describe('KeycloakService', () => {
  let service: KeycloakService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeycloakService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'KEYCLOAK_URL':
                  return 'test';
                case 'KEYCLOAK_REALM':
                  return 'myrealm';
                case 'KEYCLOAK_CLIENT_ID':
                  return 'myclient';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<KeycloakService>(KeycloakService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
