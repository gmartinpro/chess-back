import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserDocument } from '../../schemas/user.schema';
import { Model, Query } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import {
  mockUser,
  mockUserDoc,
  usersMock,
  WINNER_EMAIL,
} from './user.service.mock';

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<UserDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken('User'),
          useValue: {
            new: jest.fn().mockResolvedValue(mockUser()),
            constructor: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<UserDocument>>(getModelToken('User'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should findAndUpdatePlayerSocket ?', async () => {
    const findOneSpy = jest.spyOn(userModel, 'findOne');
    findOneSpy.mockReturnValueOnce(
      createMock<Query<UserDocument, UserDocument>>({
        exec: jest.fn().mockResolvedValueOnce(mockUserDoc()),
      }),
    );
    const mockUserData = mockUser('new-socket-id');
    const result = await service.findAndUpdatePlayerSocket(
      WINNER_EMAIL,
      'new-socket-id',
    );

    expect(result).toMatchObject({
      currentSocketId: mockUserData.currentSocketId,
      elo: mockUserData.elo,
      email: mockUserData.email,
      gamertag: mockUserData.gamertag,
    });
    expect(findOneSpy).toHaveBeenCalledWith({ email: WINNER_EMAIL });
  });

  it('should throw NotFoundException if user not found', async () => {
    const findOneSpy = jest.spyOn(userModel, 'findOne');
    findOneSpy.mockReturnValueOnce(
      createMock<Query<UserDocument, UserDocument>>({
        exec: jest.fn().mockResolvedValueOnce(null),
      }),
    );
    const result = service.findAndUpdatePlayerSocket(
      WINNER_EMAIL,
      'new-socket-id',
    );

    await expect(result).rejects.toThrow(
      new NotFoundException(`User with email ${WINNER_EMAIL} not found`),
    );
  });

  it('should return a players opponent', () => {
    const result = service.getOpponent(usersMock, usersMock[0].email);
    expect(result).toBe(usersMock[1]);
  });

  it('should return null if the email is none of the players', () => {
    const result = service.getOpponent(usersMock, '');
    expect(result).toBeNull();
  });

  it('should return null if there is only one player', () => {
    const result = service.getOpponent([usersMock[0]], usersMock[0].email);
    expect(result).toBeNull();
  });
});
