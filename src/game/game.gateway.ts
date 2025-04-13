import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { GameService } from './game.service';
import { Socket } from 'socket.io';
import { SocketMessages } from '../shared/enums/socket.messages.enum';
import { UserService } from '../user/user.service';
import { Roles, WsRoleGuard } from '../ws.role/ws.role.middleware';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { GameEventService } from '../game.event/game.event.service';
import { WsExceptionInterceptor } from '../ws.exception/ws.exception.interceptor';
import {
  GameNotFoundException,
  OpponentNotFoundException,
} from '../exceptions/game.exception';

@UseInterceptors(WsExceptionInterceptor)
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class GameGateway {
  constructor(
    private readonly gameService: GameService,
    private readonly userService: UserService,
    private readonly gameEvent: GameEventService,
  ) {}

  @UseGuards(WsRoleGuard)
  @SubscribeMessage(SocketMessages.NEW_GAME)
  @Roles('Host')
  async handleCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() email: string,
  ) {
    const game = await this.gameService.createGame(email, client.id);
    this.gameEvent.emitGameCreated(client, game);
  }

  @Roles('Player')
  @SubscribeMessage(SocketMessages.JOIN_GAME)
  async handleJoin(
    @MessageBody() joinRequest: { gameId: string; email: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { gameId, email } = joinRequest;

    const game = await this.gameService.joinGame(gameId, email, client.id);
    if (!game) {
      throw new GameNotFoundException(gameId);
    }
    const opponent = this.userService.getOpponent(game.players, email);
    const opponentSocketId = opponent?.currentSocketId;
    if (!opponentSocketId) {
      throw new OpponentNotFoundException();
    }
    this.gameEvent.emitGameJoined(client, game, opponentSocketId, gameId);
  }

  @Roles('Player')
  @SubscribeMessage(SocketMessages.MAKE_MOVE)
  async handleMove(
    @MessageBody()
    moveRequest: {
      gameId: string;
      move: { from: string; to: string };
      email: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { email, gameId, move } = moveRequest;

    const game = await this.gameService.getGameWithPlayers(gameId);
    if (!game) {
      throw new GameNotFoundException(gameId);
    }

    const opponent = this.userService.getOpponent(game.players, email);
    if (!opponent) {
      throw new OpponentNotFoundException();
    }

    const madeMove = this.gameService.makeMove(game, move, opponent);
    if (!madeMove?.move.valid || !madeMove.move.details) {
      client.emit(SocketMessages.ILLEGAL_MOVE);
      return;
    }

    await game.updateOne(madeMove.game).exec();

    const isGameOver = this.gameService.isGameOver(
      madeMove.move.details.status,
    );

    this.gameEvent.emitMoveMade(
      client,
      madeMove.move,
      opponent,
      email,
      isGameOver,
    );
  }
}
