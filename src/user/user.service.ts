import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserService {
  logger: Logger;
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.logger = new Logger(UserService.name);
  }

  async findAndUpdatePlayerSocket(
    email: string,
    socketId: string,
  ): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException(
        `Utilisateur avec l'email ${email} non trouvé`,
      );
    }

    user.currentSocketId = socketId;
    await user.save();
    return user;
  }

  getOpponent(players: User[], email: string): User | null {
    return players.find((player) => player.email !== email) ?? null;
  }
}
