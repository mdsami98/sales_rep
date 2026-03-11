import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/request';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    localRegister: jest.fn(),
    localLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  POST /auth/local/register
  // ═══════════════════════════════════════════════════════════════════════

  describe('register', () => {
    const registerDto: RegisterDto = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'Password@123',
    };

    const mockUser = {
      id: 'uuid-123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    };

    // localRegister returns { data: createdUser }
    // controller does: const { data } = await ...; return data;
    // so controller returns the user directly

    it('should call authService.localRegister with the dto', async () => {
      mockAuthService.localRegister.mockResolvedValue({ data: mockUser });

      await controller.register(registerDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.localRegister).toHaveBeenCalledWith(registerDto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.localRegister).toHaveBeenCalledTimes(1);
    });

    it('should return the created user data (unwrapped from { data })', async () => {
      mockAuthService.localRegister.mockResolvedValue({ data: mockUser });

      const result = await controller.register(registerDto);

      // Controller destructures { data } and returns data directly
      expect(result).toEqual(mockUser);
      expect(result).toHaveProperty('id', 'uuid-123');
      expect(result).toHaveProperty('email', 'john@example.com');
    });

    it('should propagate ConflictException when user exists', async () => {
      mockAuthService.localRegister.mockRejectedValue(
        new ConflictException('User already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.register(registerDto)).rejects.toThrow(
        'User already exists',
      );
    });

    it('should propagate unexpected errors', async () => {
      mockAuthService.localRegister.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  POST /auth/local/login
  // ═══════════════════════════════════════════════════════════════════════

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john@example.com',
      password: 'Password@123',
    };

    // localLogin returns { user, accessToken }
    const mockLoginResponse = {
      user: {
        id: 'uuid-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-access',
    };

    it('should call authService.localLogin with the dto', async () => {
      mockAuthService.localLogin.mockResolvedValue(mockLoginResponse);

      await controller.login(loginDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.localLogin).toHaveBeenCalledWith(loginDto);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.localLogin).toHaveBeenCalledTimes(1);
    });

    it('should return user and access token', async () => {
      mockAuthService.localLogin.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockLoginResponse);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('email', 'john@example.com');
    });

    it('should propagate NotFoundException when user not found', async () => {
      mockAuthService.localLogin.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should propagate UnauthorizedException for invalid password', async () => {
      mockAuthService.localLogin.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });
});