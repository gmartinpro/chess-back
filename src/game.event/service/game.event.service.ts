import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Game } from '../../schemas/game.schema';
import { SocketMessages } from '../../shared/enums/socket.messages.enum';
import { User } from '../../schemas/user.schema';
import { IMove, IValidMove } from '../../shared/interfaces/engine.interface';

@Injectable()
export class GameEventService {
  constructor() {}

  /**
   * Emit a game created event to the current player.
   * @param client The socket client of the current player.
   * @param game The game object.
   */
  async emitGameCreated(client: Socket, game: Game) {
    await client.join(game.id);
    client.emit(SocketMessages.GAME_CREATED, game);
  }

  /**
   * Emit a game joined event to the opponent and the current player.
   * @param client The socket client of the current player.
   * @param game The game object.
   * @param opponentSocketId The socket ID of the opponent.
   * @param gameId  The ID of the game.
   */
  async emitGameJoined(
    client: Socket,
    game: Game,
    opponentSocketId: string,
    gameId: string,
  ) {
    await client.join(gameId);
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

  /**
   * Emit a move made event to the opponent and the current player.
   * @param client The socket client of the current player.
   * @param move The move made by the current player.
   * @param opponent The opponent user.
   */
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

  /**
   * Emit a game over event to the opponent and the current player.
   * @param client The socket client of the current player.
   * @param details The details of the game over event.
   * @param opponent The opponent user.
   * @param gameId The ID of the game.
   */
  async emitGameOver(
    client: Socket,
    details: IValidMove['details'],
    opponent: User,
    gameId: string,
  ) {
    client.to(opponent.currentSocketId).emit(SocketMessages.GAME_OVER, {
      ...details,
      currentPlayer: opponent.currentSocketId,
    });

    client.emit(SocketMessages.GAME_OVER, {
      ...details,
      currentPlayer: opponent.currentSocketId,
    });

    await client.leave(gameId);
    client.to(opponent.currentSocketId).socketsLeave(gameId);
  }

  /**
   * Emit a leave event to the opponent and the current player.
   * @param client The socket client of the current player.
   * @param winner The user who won the game.
   * @param gameId The ID of the game.
   */
  async emitLeave(client: Socket, winner: User, gameId: string) {
    await client.leave(gameId);
    client.to(winner.currentSocketId).emit(SocketMessages.GAME_OVER, {
      winner,
      status: 'resign',
    });
    client.to(winner.currentSocketId).socketsLeave(gameId);
  }
}
