import { GameStatus } from '../types/game.types';

export interface IGame {
  id: string;
  players: string[];
  status: GameStatus;
  fen: string; // Forsyth-Edwards Notation => État de l'échiquier
  currentPlayer: string;
}
