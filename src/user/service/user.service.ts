import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';

@Injectable()
export class UserService {
  logger: Logger;
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.logger = new Logger(UserService.name);
  }

  /**
   * Finds a user by email and updates their socket ID.
   * @param email
   * @param socketId
   */
  async findAndUpdatePlayerSocket(
    email: string,
    socketId: string,
  ): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    user.currentSocketId = socketId;
    await user.save();
    return user;
  }

  /**
   * Finds a user by their socket ID.
   * @param players
   * @param email
   */
  getOpponent(players: User[], email: string): User | null {
    if (players.map((player) => player.email).includes(email)) {
      return players.find((player) => player.email !== email) ?? null;
    }
    return null;
  }
}
