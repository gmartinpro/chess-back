import { User } from '../../schemas/user.schema';
import { GameStatus } from '../types/game.types';

export interface IMoveDetails {
  from: string;
  to: string;
  san: string; // Standard Algebraic Notation => Représentation du dernier coup
  fen: string; // Forsyth-Edwards Notation => État de l'échiquier
  status: GameStatus;
  isGameOver: boolean;
  winner?: User;
  loser?: User;
}
export interface IMove {
  valid: boolean;
  details?: IMoveDetails;
}

export interface IValidMove extends IMove {
  valid: true;
  details: NonNullable<IMove['details']>;
}

export interface IEndGameDetails {
  fen: string;
  status: GameStatus;
}

export interface IMoveRequest {
  from: string;
  to: string;
}
