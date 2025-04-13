import { Test, TestingModule } from '@nestjs/testing';
import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { WsExceptionInterceptor } from './ws.exception.interceptor';
import { GameEventService } from '../game.event/service/game.event.service';
import { firstValueFrom, of, throwError } from 'rxjs';
import { Socket } from 'socket.io';
import { GameEventServiceMock } from '../game.event/service/game.event.service.mock';

describe('WsExceptionInterceptor', () => {
  let interceptor: WsExceptionInterceptor;
  let gameEventService: GameEventService;
  let logger: Logger;

  const mockSocket = {
    id: 'mockSocketId',
    emit: jest.fn(),
  } as unknown as Socket;

  const mockExecutionContext = {
    switchToWs: () => ({
      getClient: () => mockSocket,
    }),
  } as ExecutionContext;

  const mockCallHandler = {
    handle: jest.fn(),
  } as CallHandler;

  beforeEach(async () => {
    logger = new Logger();
    jest.spyOn(logger, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WsExceptionInterceptor,
          useFactory: () => {
            const interceptor = new WsExceptionInterceptor(
              GameEventServiceMock['useValue'],
            );
            (interceptor as any)['logger'] = logger;
            return interceptor;
          },
        },
        GameEventServiceMock,
      ],
    }).compile();

    interceptor = module.get<WsExceptionInterceptor>(WsExceptionInterceptor);
    gameEventService = module.get<GameEventService>(GameEventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should pass through when no error occurs', (done) => {
      const data = { message: 'success' };
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(data));
      const emitErrorSpy = jest.spyOn(gameEventService, 'emitError');
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual(data);
          expect(emitErrorSpy).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle error and emit it through gameEventService', async () => {
      const error = new Error('Test error');
      jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(throwError(() => error));
      const emitErrorSpy = jest.spyOn(gameEventService, 'emitError');
      const loggerSpy = jest.spyOn(logger, 'error');

      try {
        await firstValueFrom(
          interceptor.intercept(mockExecutionContext, mockCallHandler),
        );
      } catch (err) {
        expect(err).toEqual(error);
        expect(emitErrorSpy).toHaveBeenCalledWith(mockSocket, error);
        expect(loggerSpy).toHaveBeenCalledWith(
          `WebSocket Error: ${error.message}`,
          error.stack,
        );
      }
    });

    it('should log error message and stack trace', (done) => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(throwError(() => error));

      const loggerSpy = jest.spyOn(interceptor['logger'], 'error');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            `WebSocket Error: ${error.message}`,
            error.stack,
          );
          done();
        },
      });
    });
  });
});
