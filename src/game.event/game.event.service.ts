import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Game } from '../schemas/game.schema';
import { SocketMessages } from '../shared/enums/socket.messages.enum';
import { User } from '../schemas/user.schema';
import { IMove, IValidMove } from '../shared/interfaces/engine.interface';

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

  emitMoveMade(client: Socket, move: IMove, opponent: User) {
    client.to(opponent.currentSocketId).emit(SocketMessages.MOVE_MADE, {
      ...move.details,
      currentPlayer: opponent.currentSocketId,
    });

    client.emit(SocketMessages.MOVE_MADE, {
      ...move.details,
      currentPlayer: opponent.currentSocketId,
    });
  }

  emitGameOver(client: Socket, details: IValidMove['details'], opponent: User) {
    client.to(opponent.currentSocketId).emit(SocketMessages.GAME_OVER, {
      ...details,
      currentPlayer: opponent.currentSocketId,
    });

    client.emit(SocketMessages.GAME_OVER, {
      ...details,
      currentPlayer: opponent.currentSocketId,
    });
  }

  emitLeave(client: Socket, winner: User) {
    client.to(winner.currentSocketId).emit(SocketMessages.GAME_OVER, {
      winner,
      status: 'resign',
    });
  }
}
