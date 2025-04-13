import { Game, GameDocument } from '../schemas/game.schema';
import {
  IMove,
  IMoveDetails,
  IValidMove,
} from '../shared/interfaces/engine.interface';
import {
  LOSER_EMAIL,
  mockUser,
  usersMock,
  WINNER_EMAIL,
} from '../user/user.service.mock';
import { GameService } from './game.service';

export const GameServiceMock = {
  provide: GameService,
  useValue: {
    createGame: jest.fn(),
    getGame: jest.fn(),
    joinGame: jest.fn(),
    makeMove: jest.fn(),
    buildUpdatePayload: jest.fn(),
    buildEndPayload: jest.fn(),
    undoMove: jest.fn(),
    getGameWithPlayers: jest.fn(),
    isLegalMove: jest.fn(),
    canJoinGame: jest.fn(),
  },
};

export const mockMove = (
  valid = true,
  details?: Partial<IMoveDetails>,
): IMove =>
  ({
    valid,
    details,
  }) as IMove;

export const mockMoveDetails = (
  details: Partial<IMoveDetails> = {},
): IMoveDetails => details as IMoveDetails;

export const mockValidMove = (
  details: Partial<IMoveDetails> = {},
): IValidMove =>
  ({
    valid: true,
    details,
  }) as IValidMove;

export const mockGame = (
  id = 'game123',
  currentSocketId = 'test',
  elo = 3000,
  email = WINNER_EMAIL,
  gamertag = 'test',
  status = 'pending',
  players = usersMock,
): GameDocument =>
  ({
    id,
    currentSocketId,
    elo,
    email,
    gamertag,
    status,
    players,
  }) as unknown as GameDocument;

export const mockGameDoc = (mock?: Partial<Game>): GameDocument =>
  ({
    fen: mock?.fen || 'Ventus',
    id: mock?.id || WINNER_EMAIL,
    status: mock?.status || 'pending',
    winner: mock?.winner,
    currentPlayer: mock?.currentPlayer || mockUser(),
    players: mock?.players || [
      mockUser('player1', 3000, WINNER_EMAIL, 'player1'),
      mockUser('player2', 3000, LOSER_EMAIL, 'player2'),
    ],

    save: jest.fn().mockResolvedValue(true),
  }) as unknown as GameDocument;
