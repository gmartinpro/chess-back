import { GameStatus } from '../types/game.types';

export interface IMoveDetails {
  from: string;
  to: string;
  san: string; // Standard Algebraic Notation => Représentation du dernier coup
  fen: string; // Forsyth-Edwards Notation => État de l'échiquier
  status: GameStatus;
}
export interface IMove {
  valid: boolean;
  details?: IMoveDetails;
}

export interface IMoveRequest {
  from: string;
  to: string;
}
