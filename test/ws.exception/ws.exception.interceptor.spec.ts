import { WsExceptionInterceptor } from '../../src/ws.exception/ws.exception.interceptor';

describe('WsExceptionInterceptor', () => {
  it('should be defined', () => {
    expect(new WsExceptionInterceptor()).toBeDefined();
  });
});
