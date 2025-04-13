import { BadRequestException, NotFoundException } from '@nestjs/common';

export class GameNotFoundException extends NotFoundException {
  constructor(gameId?: string) {
    super(gameId ? `Game with id ${gameId} not found` : 'Game not found');
  }
}

export class OpponentNotFoundException extends NotFoundException {
  constructor() {
    super('Opponent not found');
  }
}

export class IllegalMoveException extends BadRequestException {
  constructor() {
    super('Illegal move');
  }
}
