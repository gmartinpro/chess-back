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
    const chess = this.boards.get(gameId);
    if (!chess) return { valid: false }; // Erreur

    const result = chess.move(moveRequest);
    if (!result) return { valid: false }; // Erreur

    const status = this.getGameStatus(chess);
    return {
      valid: true,
      details: {
        from: result.from,
        to: result.to,
        san: result.san,
        fen: chess.fen(),
        status,
      },
    };
  }

  undoIllegalMove(gameId: string) {
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
}
