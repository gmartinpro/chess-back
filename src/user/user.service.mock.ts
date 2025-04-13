import { User, UserDocument } from '../schemas/user.schema';
import { UserService } from './user.service';

export const UserServiceMock = {
  provide: UserService,
  useValue: {
    findAndUpdatePlayerSocket: jest.fn(),
    getOpponent: jest.fn(),
  },
};

export const mockUser = (
  currentSocketId = 'test',
  elo = 3000,
  email = WINNER_EMAIL,
  gamertag = 'test',
): UserDocument =>
  ({
    currentSocketId,
    elo,
    email,
    gamertag,
  }) as unknown as UserDocument;

export const WINNER_EMAIL = 'winner@gmail.com';
export const LOSER_EMAIL = 'loser@gmail.com';

export const mockUserDoc = (mock?: Partial<User>): Partial<UserDocument> => ({
  currentSocketId: mock?.currentSocketId || 'Ventus',
  elo: mock?.elo || 3000,
  email: mock?.email || WINNER_EMAIL,
  gamertag: mock?.gamertag || 'test',
  save: jest.fn().mockResolvedValue(true),
});

export const usersMock = [mockUser(), mockUser('Vitani', 2, LOSER_EMAIL)];
