import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserService {
  logger: Logger;
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.logger = new Logger(UserService.name);
  }

  async findOne(query: any): Promise<User | null> {
    return await this.userModel.findOne(query).exec();
  }

  async create(user: {
    password: string;
    gamertag: string;
  }): Promise<User | null> {
    this.logger.log('Creating user.');
    const newUser = new this.userModel(user);
    return await newUser.save();
  }
}
