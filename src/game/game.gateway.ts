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
import { UseGuards } from '@nestjs/common';

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
  ) {}

  @UseGuards(WsRoleGuard)
  @SubscribeMessage(SocketMessages.NEW_GAME)
  @Roles('Host')
  async handleCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() email: string,
  ) {
    const game = await this.gameService.createGame(email, client.id);
    client.join(game.id);
    client.emit(SocketMessages.GAME_CREATED, game);
  }

  @Roles('Player')
  @SubscribeMessage(SocketMessages.JOIN_GAME)
  async handleJoin(
    @MessageBody() joinRequest: { gameId: string; email: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { gameId, email } = joinRequest;
    const game = await this.gameService.joinGame(gameId, email, client.id);
    if (game) {
      client.join(gameId);
      client.emit(SocketMessages.PLAYER_JOINED, { gameId, status: 'playing' });
      const opponent = this.userService.getOpponent(game.players, email);
      const opponentSocketId = opponent?.currentSocketId;

      if (opponentSocketId) {
        client
          .to(opponentSocketId)
          .emit(SocketMessages.GAME_STARTED, { ...game, status: 'playing' });
      }
    } else {
      client.emit(SocketMessages.ERROR, 'Game not found');
    }
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
      client.emit(SocketMessages.ERROR, `Game with id ${gameId} not found`);
      return;
    }
    const opponent = this.userService.getOpponent(game.players, email);

    if (!opponent) {
      client.emit(SocketMessages.ERROR, `Opponent not found`);
      return;
    }

    const madeMove = this.gameService.makeMove(game, move, opponent);

    if (!madeMove?.move.valid || !madeMove.move.details) {
      client.emit(SocketMessages.ILLEGAL_MOVE);
      return;
    }

    await game.updateOne(madeMove.game).exec();
    // Test for illegal move
    // if (move.from === 'd2') {
    //   this.gameService.undoIllegalMove(gameId);
    //   client.emit(SocketMessages.ILLEGAL_MOVE);
    //   return;
    // }

    const isGameOver = ['stalemate', 'draw', 'checkmate'].includes(
      madeMove.move.details.status,
    );
    if (opponent) {
      client
        .to(opponent.currentSocketId)
        .emit(
          isGameOver ? SocketMessages.GAME_OVER : SocketMessages.MOVE_MADE,
          {
            ...madeMove.move.details,
            currentPlayer: opponent.currentSocketId,
            winner: isGameOver ? email : null,
          },
        );
    }

    client.emit(
      isGameOver ? SocketMessages.GAME_OVER : SocketMessages.MOVE_MADE,
      {
        ...madeMove.move.details,
        currentPlayer: opponent.currentSocketId,
        winner: isGameOver ? email : null,
      },
    );
  }
}
