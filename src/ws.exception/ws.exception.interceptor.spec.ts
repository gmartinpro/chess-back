import { GameEventService } from '../game.event/game.event.service';
import { WsExceptionInterceptor } from './ws.exception.interceptor';

describe('WsExceptionInterceptor', () => {
  it('should be defined', () => {
    expect(new WsExceptionInterceptor(new GameEventService())).toBeDefined(); // TODO: change
  });
});
