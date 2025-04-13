import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { GameService } from '../service/game.service';
import { Socket } from 'socket.io';
import { SocketMessages } from '../../shared/enums/socket.messages.enum';
import { UserService } from '../../user/service/user.service';
import { Roles, WsRoleGuard } from '../../ws.role/ws.role.guard';
import { Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { GameEventService } from '../../game.event/service/game.event.service';
import { WsExceptionInterceptor } from '../../ws.exception/ws.exception.interceptor';
import {
  GameNotFoundException,
  OpponentNotFoundException,
} from '../exception/game.exception';

@UseInterceptors(WsExceptionInterceptor)
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
})
export class GameGateway {
  private readonly logger = new Logger(GameGateway.name);
  constructor(
    private readonly gameService: GameService,
    private readonly userService: UserService,
    private readonly gameEvent: GameEventService,
  ) {}

  /**
   * Handles the connection of a client.
   * @param client The socket client.
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handles the disconnection of a client.
   * @param client The socket client.
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté: ${client.id}`);
  }

  /**
   * Handles the creation of a new game.
   * @param client The socket client.
   * @param email The email of the host.
   */
  @Roles('Host')
  @UseGuards(WsRoleGuard)
  @SubscribeMessage(SocketMessages.NEW_GAME)
  async handleCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() email: string,
  ) {
    this.logger.log(
      `Handle create from ${client.id}: ${JSON.stringify(email)}`,
    );
    const game = await this.gameService.createGame(email, client.id);
    await this.gameEvent.emitGameCreated(client, game);
  }

  /**
   * Handles the joining of a game.
   * @param joinRequest The request containing the game ID and email.
   * @param client The socket client.
   */
  @Roles('Player')
  @SubscribeMessage(SocketMessages.JOIN_GAME)
  async handleJoin(
    @MessageBody() joinRequest: { gameId: string; email: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Handle join from ${client.id}: ${JSON.stringify(joinRequest.gameId)}`,
    );
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
    await this.gameEvent.emitGameJoined(client, game, opponentSocketId, gameId);
  }

  /**
   * Handles the leaving of a game.
   * @param leaveRequest The request containing the game ID and email.
   * @param client The socket client.
   */
  @Roles('Player')
  @SubscribeMessage(SocketMessages.LEAVE_GAME)
  async handleLeave(
    @MessageBody() leaveRequest: { gameId: string; email: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { gameId, email } = leaveRequest;
    const game = await this.gameService.getGameWithPlayers(gameId);

    if (!game) {
      throw new GameNotFoundException(gameId);
    }
    const opponent = this.userService.getOpponent(game.players, email);
    const opponentSocketId = opponent?.currentSocketId;
    if (!opponentSocketId) {
      return;
    }
    game.winner = opponent;
    await game.save();
    await this.gameEvent.emitLeave(client, opponent, gameId);
  }

  /**
   * Handles a move made by a player.
   * @param moveRequest The request containing the game ID, move details, and email.
   * @param client The socket client.
   */
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

    try {
      const madeMove = this.gameService.makeMove(game, move, opponent, email);

      await game.updateOne(madeMove.game).exec();

      if (madeMove.move.details.isGameOver) {
        await this.gameEvent.emitGameOver(
          client,
          { ...madeMove.move.details, winner: madeMove.game.winner },
          opponent,
          gameId,
        );
        return;
      }

      this.gameEvent.emitMoveMade(client, madeMove.move, opponent);
    } catch (err) {
      this.gameService.undoMove(game);
      client.emit(SocketMessages.ILLEGAL_MOVE, err);
    }
  }
}
