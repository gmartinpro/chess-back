import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { KeycloakService } from '../keycloak/keycloak.service';
import { Token } from 'keycloak-connect';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class WsRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly keycloakService: KeycloakService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token: Token = client.handshake.auth.token;

    if (!token) {
      throw new WsException('No token found');
    }

    try {
      const decodedToken = await this.keycloakService.verify(token);
      const requiredRoles = this.reflector.get<string[]>(
        'roles',
        context.getHandler(),
      );

      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      const userRoles = decodedToken.content.realm_access?.roles || [];
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        throw new WsException('Access denied : insufficient permissions');
      }

      client.data.user = decodedToken;
      return true;
    } catch (err) {
      throw new WsException(err);
    }
  }
}
