import { Injectable } from '@nestjs/common';
import { IGame } from '../shared/interfaces/game.interface';
import { EngineService } from '../engine/engine.service';
import { IMove, IMoveRequest } from '../shared/interfaces/engine.interface';
import { nanoid } from 'nanoid';

@Injectable()
export class GameService {
  private games = new Map<string, IGame>();

  constructor(private readonly engine: EngineService) {}

  createGame(hostId: string): IGame {
    const gameId = nanoid(6);
    const game: IGame = {
      id: gameId,
      players: [hostId],
      status: 'pending',
      fen: this.engine.newGame(gameId),
      currentPlayer: hostId,
    };

    this.games.set(gameId, game);

    return game;
  }

  joinGame(gameId: string, playerId: string): IGame | null {
    const game = this.games.get(gameId);
    if (!game || game.players.length >= 2) {
      return null;
      // Error handling: game not found or already full
    }

    game.players.push(playerId);
    game.status = 'playing';

    return game;
  }

  makeMove(gameId: string, move: IMoveRequest): IMove | null {
    const game = this.games.get(gameId);
    if (!game) {
      return null;
    }
    return this.engine.makeMove(gameId, move);
  }

  undoIllegalMove(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      this.engine.undoIllegalMove(gameId);
    }
  }

  getGame(gameId: string): IGame | null {
    return this.games.get(gameId) || null;
  }

  getOpponent(gameId: string, playerId: string): string | null {
    const game = this.games.get(gameId);

    if (!game) {
      return null;
    }

    const opponent = game.players.find((player) => player !== playerId);
    return opponent ?? null;
  }
}
