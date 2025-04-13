import { Injectable, NotFoundException } from '@nestjs/common';
import { EngineService } from '../../engine/service/engine.service';
import {
  IEndGameDetails,
  IMove,
  IMoveRequest,
  IValidMove,
} from '../../shared/interfaces/engine.interface';
import { nanoid } from 'nanoid';
import { InjectModel } from '@nestjs/mongoose';
import { Game, GameDocument } from '../../schemas/game.schema';
import { Model } from 'mongoose';
import { UserService } from '../../user/service/user.service';
import { User } from '../../schemas/user.schema';
import {
  GameNotFoundException,
  IllegalMoveException,
} from '../exception/game.exception';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    private readonly engine: EngineService,
    private readonly userService: UserService,
  ) {}

  /**
   * Creates a new game and adds the player to it.
   * @param email The email of the host.
   * @param socketId The socket ID of the host.
   */
  async createGame(email: string, socketId: string): Promise<Game> {
    const user = await this.userService.findAndUpdatePlayerSocket(
      email,
      socketId,
    );

    const gameId = nanoid(6);
    const game = await this.gameModel.create({
      id: gameId,
      players: [user],
      status: 'pending',
      fen: this.engine.newGame(gameId),
      currentPlayer: user,
    });

    return game;
  }

  /**
   * Retrieves a game by its ID.
   * @param gameId The ID of the game.
   */
  async getGame(gameId: string): Promise<GameDocument | null> {
    return this.gameModel.findOne({ id: gameId }).exec();
  }

  /**
   * Joins a game as a player.
   * @param gameId The ID of the game to join.
   * @param email The email of the player.
   * @param socketId The socket ID of the player.
   */
  async joinGame(
    gameId: string,
    email: string,
    socketId: string,
  ): Promise<GameDocument | null> {
    const [user, game] = await Promise.all([
      this.userService.findAndUpdatePlayerSocket(email, socketId),
      this.getGameWithPlayers(gameId),
    ]);
    if (!game || !this.canJoinGame(game)) {
      throw new NotFoundException(
        `Game with id ${gameId} not found or already full : ${!game?.players.length ? 'no' : game?.players.length} player(s) inside`,
      );
    }

    game.players.push(user);
    game.status = 'playing';
    await game.save();
    return game;
  }

  /**
   * Makes a move in the game.
   * @param game The game object.
   * @param move The move to be made.
   * @param opponent The opponent user.
   * @param email The email of the player making the move.
   */
  makeMove(
    game: GameDocument,
    move: IMoveRequest,
    opponent: User,
    email: string,
  ): { move: IValidMove; game: GameDocument } {
    const gameToUpdate = game;
    if (!gameToUpdate) {
      throw new GameNotFoundException();
    }

    const madeMove = this.engine.makeMove(gameToUpdate.id, move);

    if (!this.isLegalMove(madeMove)) {
      throw new IllegalMoveException();
    }

    const isGameOver = madeMove.details.isGameOver;

    return {
      move: madeMove,
      game: isGameOver
        ? this.buildEndPayload(game, madeMove.details, email)
        : this.buildUpdatePayload(game, madeMove, opponent),
    };
  }

  /**
   * Builds the payload for updating the game state after a move.
   * @param game The game object.
   * @param move The move made.
   * @param opponent The opponent user.
   */
  buildUpdatePayload(
    game: GameDocument,
    move: IValidMove,
    opponent: User,
  ): GameDocument {
    const gameToUpdate = game;
    const { details } = move;
    gameToUpdate.fen = details.fen;
    gameToUpdate.status = details.status;
    gameToUpdate.currentPlayer = opponent;
    return gameToUpdate;
  }

  /**
   * Builds the payload for ending the game.
   * @param game The game object.
   * @param moveDetails The details of the move made.
   * @param winnerEmail The email of the winner.
   */
  buildEndPayload(
    game: GameDocument,
    moveDetails: IEndGameDetails,
    winnerEmail: string,
  ): GameDocument {
    const gameToUpdate = game;
    const winner = game.players.find((player) => player.email === winnerEmail);
    const { fen, status } = moveDetails;
    gameToUpdate.fen = fen;
    gameToUpdate.status = status;
    if (winner && (status === 'checkmate' || status === 'resign')) {
      gameToUpdate.winner = winner;
    }
    return gameToUpdate;
  }

  /**
   * Retrieves a game with its players.
   * @param gameId The ID of the game.
   */
  async getGameWithPlayers(gameId: string): Promise<GameDocument | null> {
    return this.gameModel.findOne({ id: gameId }).populate('players').exec();
  }

  /**
   * Undoes the last move made in the game.
   * @param game The game object.
   */
  undoMove(game: Game): void {
    this.engine.undoMove(game.id);
  }

  /**
   * Checks if a move is legal.
   * @param move The move to check.
   */
  isLegalMove(move: IMove): move is IValidMove {
    return !!move.valid && !!move.details;
  }

  /**
   * Checks if a game can be joined.
   * @param game The game object.
   */
  private canJoinGame(game: GameDocument): boolean {
    return game.players.length < 2 && game.status === 'pending';
  }
}
