import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { GameStatus } from '../shared/types/game.types';

export type GameDocument = HydratedDocument<Game>;

@Schema()
export class Game {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  players: string[];

  @Prop({ required: true })
  status: GameStatus;

  @Prop({ required: true })
  fen: string;

  @Prop({ required: true })
  currentPlayer: string;
}

export const GameSchema = SchemaFactory.createForClass(Game);
