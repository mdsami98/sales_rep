import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/request";
import { RegisterResponseDto } from "./dto/response";
import { Public } from "src/common/decorators/public.decorator";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('/local/register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return await this.authService.localRegister(registerDto);
  }

  @Public()
  @Post('/local/login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.localLogin(loginDto);
  }

  // @Post('/logout')
  // async logout(@Body() logoutDto: LogoutDto) {
  //   return await this.authService.logout(logoutDto);
  // }

  // @Post('/refresh')
  // async refresh(@Body() refreshDto: RefreshDto) {
  //   return await this.authService.refresh(refreshDto);
  // }

}