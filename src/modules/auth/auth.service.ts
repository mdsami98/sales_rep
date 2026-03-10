import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { LoginDto, RegisterDto } from "./dto/request";
import { RegisterResponseDto } from "./dto/response";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "./strategies/jwt.strategy";
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService) { }

  async localRegister(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    // return registerDto;
    const user = await this.usersService.findUserByEmail(registerDto.email);
    if (user) {
      throw new ConflictException('User already exists');
    }
    return await this.usersService.createUser(registerDto);
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
    const tokens = await this.generateTokens({ sub: user.id, email: user.email });
    return {
      user,
      ...tokens,
    }
  }


  // async logout(logoutDto: LogoutDto) {
  //   return await this.userRepository.delete(logoutDto);
  // }

  // async refresh(refreshDto: RefreshDto) {
  //   return await this.userRepository.findOneBy(refreshDto);
  // }


  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

}