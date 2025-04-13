import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError } from 'rxjs';
import { Socket } from 'socket.io';
import { GameEventService } from '../game.event/game.event.service';

@Injectable()
export class WsExceptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WsExceptionInterceptor.name);
  constructor(private readonly gameEventService: GameEventService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const client = context.switchToWs().getClient<Socket>();

    return next.handle().pipe(
      catchError((error) => {
        this.logger.error(`WebSocket Error: ${error.message}`, error.stack);
        this.gameEventService.emitError(client, error);
        throw error;
      }),
    );
  }
}
