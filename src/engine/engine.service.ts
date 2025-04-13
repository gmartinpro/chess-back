import { Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';
import { IMoveRequest, IMove } from '../shared/interfaces/engine.interface';
import { GameStatus } from '../shared/types/game.types';

@Injectable()
export class EngineService {
  private boards = new Map<string, Chess>();

  newGame(gameId: string): string {
    const chess = new Chess();
    this.boards.set(gameId, chess);
    return chess.fen();
  }

  makeMove(gameId: string, moveRequest: IMoveRequest): IMove {
    try {
      const chess = this.boards.get(gameId);
      if (!chess) return { valid: false };

      const result = chess.move(moveRequest);

      const status = this.getGameStatus(chess);

      const isGameOver = this.isGameOver(status);

      return {
        valid: true,
        details: {
          from: result.from,
          to: result.to,
          san: result.san,
          fen: chess.fen(),
          status,
          isGameOver,
        },
      };
    } catch {
      return { valid: false };
    }
  }

  undoMove(gameId: string) {
    const chess = this.boards.get(gameId);
    if (chess) {
      chess.undo();
    }
  }

  private getGameStatus(chess: Chess): GameStatus {
    if (chess.isCheckmate()) return 'checkmate';
    if (chess.isStalemate()) return 'stalemate';
    if (chess.isDraw()) return 'draw';
    return 'playing';
  }

  private isGameOver(status: GameStatus): boolean {
    return ['stalemate', 'draw', 'checkmate'].includes(status);
  }
}
