import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KeycloakConnect, { KeycloakConfig, Token } from 'keycloak-connect';

@Injectable()
export class KeycloakService {
  private keycloak: KeycloakConnect.Keycloak;

  constructor(private readonly configService: ConfigService) {
    const keycloakUrl = this.configService.get('KEYCLOAK_URL');
    const keycloakRealm = this.configService.get('KEYCLOAK_REALM');
    const keycloakClientId = this.configService.get('KEYCLOAK_CLIENT_ID');
    if (!keycloakUrl || !keycloakRealm || !keycloakClientId) {
      throw new Error(
        `Keycloak configuration is not defined:  : url : ${keycloakUrl}; realm: ${keycloakRealm}; clientId: ${keycloakClientId}; `,
      );
    }

    const keycloakConfig: KeycloakConfig = {
      'ssl-required': 'external',
      'confidential-port': 0,
      realm: keycloakRealm,
      'auth-server-url': keycloakUrl,
      resource: keycloakClientId,
    };
    this.keycloak = new KeycloakConnect({}, keycloakConfig);
  }

  async verify(token: Token): Promise<any> {
    try {
      const grant = await this.keycloak.grantManager.createGrant({
        access_token: token,
      });
      const accessToken = await this.keycloak.grantManager.validateGrant(grant);
      return accessToken.access_token;
    } catch (error) {
      throw new Error(`Erreur lors de la validation du token : ${error}`);
    }
  }
}
