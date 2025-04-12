import { WsAuthMiddleware } from './ws.auth.middleware';

describe('WsAuthMiddleware', () => {
  it('should be defined', () => {
    expect(new WsAuthMiddleware()).toBeDefined();
  });
});
