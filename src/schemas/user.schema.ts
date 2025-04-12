import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Game } from './game.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  gamertag: string;

  @Prop({
    required: true,
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address',
    ],
  })
  email: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Game' })
  currentGame: Game;

  @Prop()
  currentSocketId: string;

  @Prop()
  elo: number;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }] })
  games: Game[];
}

export const UserSchema = SchemaFactory.createForClass(User);
