import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { GameStatus } from '../shared/types/game.types';
import { User } from './user.schema';

export type GameDocument = HydratedDocument<Game>;

@Schema()
export class Game {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  players: User[];

  @Prop({ required: true })
  status: GameStatus;

  @Prop({ required: true })
  fen: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  currentPlayer: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  winner: User;
}

export const GameSchema = SchemaFactory.createForClass(Game);
