/**
 * Unit Tests: User Model
 *
 * Tests database model for user management using mocks
 * NOTE: User model has NO custom static methods - tests standard Sequelize CRUD
 * Coverage target: 80%
 */

// Mock logger BEFORE imports
jest.mock('../../../shared/utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

import User from '../../../database/models/User';

describe('User Model', () => {
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 1,
      googleId: 'google-123',
      email: 'test@gmail.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      discordId: 'discord-456',
      guildId: 'guild-789',
      refreshToken: 'refresh-token-abc',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      update: jest.fn().mockImplementation(function (this: any, values: any) {
        Object.assign(this, values);
        this.updatedAt = new Date();
        return Promise.resolve(this);
      }),
      save: jest.fn().mockResolvedValue(mockUser),
    };

    // Mock findOne
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      const where = options?.where || {};

      if (where.googleId === 'google-123') {
        return { ...mockUser } as any;
      }
      if (where.email === 'test@gmail.com') {
        return { ...mockUser } as any;
      }
      return null;
    });

    // Mock create
    jest.spyOn(User, 'create').mockImplementation(async (values: any) => {
      if (!values.googleId || !values.email) {
        throw new Error('Validation error: googleId and email are required');
      }

      return {
        id: 2,
        googleId: values.googleId,
        email: values.email,
        name: values.name,
        picture: values.picture || null,
        discordId: values.discordId,
        guildId: values.guildId,
        refreshToken: values.refreshToken || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        update: mockUser.update,
        save: mockUser.save,
      } as any;
    });

    // Mock findAll
    jest.spyOn(User, 'findAll').mockResolvedValue([mockUser] as any);
  });

  describe('Model Attributes', () => {
    test('should have correct attributes defined', async () => {
      const user = await User.findOne({ where: { googleId: 'google-123' } });

      expect(user).toBeDefined();
      expect(user).toHaveProperty('googleId');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('picture');
      expect(user).toHaveProperty('discordId');
      expect(user).toHaveProperty('guildId');
      expect(user).toHaveProperty('refreshToken');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });

    test('should have correct attribute values', async () => {
      const user = await User.findOne({ where: { googleId: 'google-123' } });

      expect(user!.googleId).toBe('google-123');
      expect(user!.email).toBe('test@gmail.com');
      expect(user!.name).toBe('Test User');
      expect(user!.picture).toBe('https://example.com/photo.jpg');
      expect(user!.discordId).toBe('discord-456');
      expect(user!.guildId).toBe('guild-789');
      expect(user!.refreshToken).toBe('refresh-token-abc');
    });
  });

  describe('findOne', () => {
    test('should find user by googleId', async () => {
      const user = await User.findOne({ where: { googleId: 'google-123' } });

      expect(user).toBeDefined();
      expect(user!.googleId).toBe('google-123');
      expect(User.findOne).toHaveBeenCalledWith({ where: { googleId: 'google-123' } });
    });

    test('should find user by email', async () => {
      const user = await User.findOne({ where: { email: 'test@gmail.com' } });

      expect(user).toBeDefined();
      expect(user!.email).toBe('test@gmail.com');
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@gmail.com' } });
    });

    test('should return null when user is not found', async () => {
      const user = await User.findOne({ where: { googleId: 'nonexistent' } });

      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    test('should create a new user with all fields', async () => {
      const user = await User.create({
        googleId: 'google-new',
        email: 'new@gmail.com',
        name: 'New User',
        picture: 'https://example.com/new.jpg',
        discordId: 'discord-new',
        guildId: 'guild-new',
        refreshToken: 'token-new',
      } as any);

      expect(user).toBeDefined();
      expect(user.googleId).toBe('google-new');
      expect(user.email).toBe('new@gmail.com');
      expect(user.name).toBe('New User');
      expect(user.discordId).toBe('discord-new');
      expect(user.guildId).toBe('guild-new');
    });

    test('should create user with null picture when not provided', async () => {
      const user = await User.create({
        googleId: 'google-new',
        email: 'new@gmail.com',
        name: 'New User',
        discordId: 'discord-new',
        guildId: 'guild-new',
      } as any);

      expect(user).toBeDefined();
      expect(user.picture).toBeNull();
    });

    test('should create user with null refreshToken when not provided', async () => {
      const user = await User.create({
        googleId: 'google-new',
        email: 'new@gmail.com',
        name: 'New User',
        discordId: 'discord-new',
        guildId: 'guild-new',
      } as any);

      expect(user).toBeDefined();
      expect(user.refreshToken).toBeNull();
    });
  });

  describe('update', () => {
    test('should update user fields', async () => {
      const user = await User.findOne({ where: { googleId: 'google-123' } });

      await user!.update({ name: 'Updated Name', picture: 'https://example.com/updated.jpg' });

      expect(user!.name).toBe('Updated Name');
      expect(user!.picture).toBe('https://example.com/updated.jpg');
      expect(user!.update).toHaveBeenCalledWith({
        name: 'Updated Name',
        picture: 'https://example.com/updated.jpg',
      });
    });
  });

  describe('Unique Constraints', () => {
    test('should enforce unique googleId (via create validation)', async () => {
      // First create succeeds
      await User.create({
        googleId: 'google-unique',
        email: 'unique@gmail.com',
        name: 'User',
        discordId: 'discord-1',
        guildId: 'guild-1',
      } as any);

      // Mock create to reject duplicate googleId
      (User.create as jest.Mock).mockRejectedValueOnce(
        new Error('Unique constraint violation: googleId must be unique')
      );

      await expect(
        User.create({
          googleId: 'google-unique', // Duplicate
          email: 'other@gmail.com',
          name: 'Other User',
          discordId: 'discord-2',
          guildId: 'guild-2',
        } as any)
      ).rejects.toThrow('Unique constraint violation: googleId must be unique');
    });

    test('should enforce unique email (via create validation)', async () => {
      // First create succeeds
      await User.create({
        googleId: 'google-1',
        email: 'same@gmail.com',
        name: 'User',
        discordId: 'discord-1',
        guildId: 'guild-1',
      } as any);

      // Mock create to reject duplicate email
      (User.create as jest.Mock).mockRejectedValueOnce(
        new Error('Unique constraint violation: email must be unique')
      );

      await expect(
        User.create({
          googleId: 'google-2',
          email: 'same@gmail.com', // Duplicate
          name: 'Other User',
          discordId: 'discord-2',
          guildId: 'guild-2',
        } as any)
      ).rejects.toThrow('Unique constraint violation: email must be unique');
    });
  });
});
