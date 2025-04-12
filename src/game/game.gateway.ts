import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { GameService } from './game.service';
import { Socket } from 'socket.io';
import { SocketMessages } from '../shared/enums/socket.messages.enum';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class GameGateway {
  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage(SocketMessages.NEW_GAME)
  handleCreate(@ConnectedSocket() client: Socket) {
    const game = this.gameService.createGame(client.id);
    client.join(game.id);
    client.emit(SocketMessages.GAME_CREATED, game);
  }

  @SubscribeMessage(SocketMessages.JOIN_GAME)
  handleJoin(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
    const game = this.gameService.joinGame(gameId, client.id);
    if (game) {
      client.join(gameId);
      client.emit(SocketMessages.PLAYER_JOINED, { ...game, status: 'playing' });
    } else {
      client.emit(SocketMessages.ERROR, 'Game not found');
    }
  }

  @SubscribeMessage(SocketMessages.MAKE_MOVE)
  handleMove(
    @MessageBody()
    moveRequest: { gameId: string; move: { from: string; to: string } },
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.gameService.makeMove(
      moveRequest.gameId,
      moveRequest.move,
    );

    // Test for illegal move
    // if (moveRequest.move.from === 'd2') {
    //   this.gameService.undoIllegalMove(moveRequest.gameId);
    //   client.emit(SocketMessages.ILLEGAL_MOVE);
    //   return;
    // }
    if (!result?.valid || !result.details) {
      client.emit(SocketMessages.ILLEGAL_MOVE);
      return;
    }

    const opponent = this.gameService.getOpponent(
      moveRequest.gameId,
      client.id,
    );

    const isGameOver = ['stalemate', 'draw', 'checkmate'].includes(
      result.details.status,
    );
    console.log({ isGameOver });
    if (opponent) {
      client
        .to(opponent)
        .emit(
          isGameOver ? SocketMessages.GAME_OVER : SocketMessages.MOVE_MADE,
          {
            ...result.details,
            currentPlayer: opponent,
            winner: isGameOver ? client.id : null,
          },
        );
    }

    client.emit(
      isGameOver ? SocketMessages.GAME_OVER : SocketMessages.MOVE_MADE,
      {
        ...result.details,
        currentPlayer: opponent,
        winner: isGameOver ? client.id : null,
      },
    );
  }
}
