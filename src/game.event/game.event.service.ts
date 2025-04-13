import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Game } from '../schemas/game.schema';
import { SocketMessages } from '../shared/enums/socket.messages.enum';
import { User } from '../schemas/user.schema';
import { IMove } from '../shared/interfaces/engine.interface';

@Injectable()
export class GameEventService {
  constructor() {}

  emitGameCreated(client: Socket, game: Game) {
    client.join(game.id);
    client.emit(SocketMessages.GAME_CREATED, game);
  }

  emitGameJoined(
    client: Socket,
    game: Game,
    opponentSocketId: string,
    gameId: string,
  ) {
    client.join(gameId);
    client.emit(SocketMessages.PLAYER_JOINED, {
      gameId,
      status: 'playing',
    });
    client
      .to(opponentSocketId)
      .emit(SocketMessages.GAME_STARTED, { ...game, status: 'playing' });
  }

  emitError(client: Socket, msg: string) {
    client.emit(SocketMessages.ERROR, msg);
  }

  emitMoveMade(
    client: Socket,
    move: IMove,
    opponent: User,
    email: string,
    isGameOver: boolean,
  ) {
    client
      .to(opponent.currentSocketId)
      .emit(isGameOver ? SocketMessages.GAME_OVER : SocketMessages.MOVE_MADE, {
        ...move.details,
        currentPlayer: opponent.currentSocketId,
        winner: isGameOver ? email : null,
      });

    client.emit(
      isGameOver ? SocketMessages.GAME_OVER : SocketMessages.MOVE_MADE,
      {
        ...move.details,
        currentPlayer: opponent.currentSocketId,
        winner: isGameOver ? email : null,
      },
    );
  }
}
