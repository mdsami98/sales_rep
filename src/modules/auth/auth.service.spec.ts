import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findUserByEmail: jest.fn(),
    findUserByEmailWithPassword: jest.fn(),
    createUser: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.expiresIn': '1d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  localRegister
  // ═══════════════════════════════════════════════════════════════════════

  describe('localRegister', () => {
    const registerDto = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'Password@123',
    };

    const createdUser = {
      id: 'uuid-123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    };

    it('should register a new user successfully', async () => {
      mockUsersService.findUserByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(createdUser);

      const result = await service.localRegister(registerDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.findUserByEmail).toHaveBeenCalledWith(
        'john@example.com',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.createUser).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({ data: createdUser });
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUsersService.findUserByEmail.mockResolvedValue({
        id: 'existing-uuid',
        email: 'john@example.com',
      });

      await expect(service.localRegister(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.localRegister(registerDto)).rejects.toThrow(
        'User already exists',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('should call findUserByEmail before creating', async () => {
      mockUsersService.findUserByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(createdUser);

      await service.localRegister(registerDto);

      const findOrder =
        mockUsersService.findUserByEmail.mock.invocationCallOrder[0];
      const createOrder =
        mockUsersService.createUser.mock.invocationCallOrder[0];
      expect(findOrder).toBeLessThan(createOrder);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  localLogin
  // ═══════════════════════════════════════════════════════════════════════

  describe('localLogin', () => {
    const loginDto = {
      email: 'john@example.com',
      password: 'Password@123',
    };

    const userWithPassword = {
      id: 'uuid-123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password_hash: '$2a$10$hashedpassword',
    };

    it('should login successfully and return user with accessToken', async () => {
      mockUsersService.findUserByEmailWithPassword.mockResolvedValue(
        userWithPassword,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.localLogin(loginDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.findUserByEmailWithPassword).toHaveBeenCalledWith(
        'john@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'Password@123',
        '$2a$10$hashedpassword',
      );
      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user).toEqual(userWithPassword);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersService.findUserByEmailWithPassword.mockResolvedValue(null);

      await expect(service.localLogin(loginDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.localLogin(loginDto)).rejects.toThrow(
        'User not found',
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUsersService.findUserByEmailWithPassword.mockResolvedValue(
        userWithPassword,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.localLogin(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.localLogin(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should generate token with correct payload', async () => {
      mockUsersService.findUserByEmailWithPassword.mockResolvedValue(
        userWithPassword,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('mock-jwt-token');

      await service.localLogin(loginDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'uuid-123', email: 'john@example.com' },
        { secret: 'test-secret', expiresIn: '1d' },
      );
    });

    it('should call signAsync exactly once (one access token)', async () => {
      mockUsersService.findUserByEmailWithPassword.mockResolvedValue(
        userWithPassword,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('mock-jwt-token');

      await service.localLogin(loginDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  generateTokens (private — tested indirectly via localLogin)
  // ═══════════════════════════════════════════════════════════════════════

  describe('generateTokens (via localLogin)', () => {
    const loginDto = {
      email: 'john@example.com',
      password: 'Password@123',
    };

    const userWithPassword = {
      id: 'uuid-123',
      email: 'john@example.com',
      password_hash: '$2a$10$hashedpassword',
    };

    it('should read jwt.secret from ConfigService', async () => {
      mockUsersService.findUserByEmailWithPassword.mockResolvedValue(
        userWithPassword,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.localLogin(loginDto);

      expect(mockConfigService.get).toHaveBeenCalledWith('jwt.secret');
      expect(mockConfigService.get).toHaveBeenCalledWith('jwt.expiresIn');
    });

    it('should return the token from JwtService.signAsync', async () => {
      mockUsersService.findUserByEmailWithPassword.mockResolvedValue(
        userWithPassword,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('specific-jwt-token-abc');

      const result = await service.localLogin(loginDto);

      expect(result.accessToken).toBe('specific-jwt-token-abc');
    });
  });
});