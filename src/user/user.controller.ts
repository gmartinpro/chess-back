import { Controller, Post, Request, Logger } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../schemas/user.schema';

@Controller('user')
export class UserController {
  logger: Logger;
  constructor(private readonly userService: UserService) {
    this.logger = new Logger(UserController.name);
  }

  @Post('create')
  async create(
    @Request() req: { body: { gamertag: string; password: string } },
  ): Promise<User | null> {
    const newUser = req.body;
    try {
      const query = { gamertag: newUser.gamertag, password: newUser.password };
      const isUser = await this.userService.findOne(query);
      if (isUser) throw new ConflictException('User Already Exist');
      const user = await this.userService.create(newUser);
      return user;
    } catch (err) {
      this.logger.error('Something went wrong in signup:', err);
      throw err;
    }
  }
}
