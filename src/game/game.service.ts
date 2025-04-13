import { Injectable, NotFoundException } from '@nestjs/common';
import { EngineService } from '../engine/engine.service';
import { IMove, IMoveRequest } from '../shared/interfaces/engine.interface';
import { nanoid } from 'nanoid';
import { InjectModel } from '@nestjs/mongoose';
import { Game, GameDocument } from '../schemas/game.schema';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UserService } from '../user/user.service';
import { GameStatus } from '../shared/types/game.types';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly engine: EngineService,
    private readonly userService: UserService,
  ) {}

  async createGame(email: string, socketId: string): Promise<Game> {
    const user = await this.userService.findAndUpdatePlayerSocket(
      email,
      socketId,
    );

    const gameId = nanoid(6);
    const game = new this.gameModel({
      id: gameId,
      players: [user],
      status: 'pending',
      fen: this.engine.newGame(gameId),
      currentPlayer: user,
    });

    await game.save();

    return game;
  }

  async getGame(gameId: string): Promise<GameDocument | null> {
    return this.gameModel.findOne({ id: gameId }).exec();
  }

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
        `Game with id ${gameId} not found or already full : ${game?.players.length ?? 'no'} player(s) inside`,
      );
    }
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    game.players.push(user);
    game.status = 'playing';
    return game.save();
  }

  makeMove(
    game: GameDocument,
    move: IMoveRequest,
    opponent: User,
  ): { move: IMove; game: GameDocument } | null {
    const gameToUpdate = game;
    if (!gameToUpdate) {
      return null;
    }

    const madeMove = this.engine.makeMove(gameToUpdate.id, move);

    if (madeMove.valid && madeMove.details) {
      gameToUpdate.fen = madeMove.details.fen;
      gameToUpdate.status = madeMove.details.status;
      gameToUpdate.currentPlayer = opponent;
    }
    return { move: madeMove, game: gameToUpdate };
  }

  async undoIllegalMove(gameId: string): Promise<void> {
    const game = await this.getGame(gameId);
    if (game) {
      this.engine.undoIllegalMove(gameId);
    }
  }

  async getGameWithPlayers(gameId: string): Promise<GameDocument | null> {
    return this.gameModel.findOne({ id: gameId }).populate('players').exec();
  }

  private canJoinGame(game: GameDocument): boolean {
    return game.players.length < 2 && game.status === 'pending';
  }

  isGameOver(status: GameStatus): boolean {
    return ['stalemate', 'draw', 'checkmate'].includes(status);
  }
}
