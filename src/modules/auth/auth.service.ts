import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/request';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './strategies/jwt.strategy';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async localRegister(registerDto: RegisterDto) {
    // return registerDto;
    const user = await this.usersService.findUserByEmail(registerDto.email);
    if (user) {
      throw new ConflictException('User already exists');
    }
    const createdUser = await this.usersService.createUser(registerDto);
    return {
      data: createdUser,
    };
  }

  async localLogin(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findUserByEmailWithPassword(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });
    return {
      user,
      ...tokens,
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expiresIn: this.configService.get<string>('jwt.expiresIn') as any,
      }),
    ]);

    return {
      accessToken,
    };
  }
}
