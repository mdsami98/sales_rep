import { Controller, Get, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "src/common/guard/jwt-auth.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { RolesGuard } from "src/common/guard/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { UserRole } from "src/common/enums/user-role.enum";
// import { Roles } from "src/common/decorators/roles.decorator";
// import { UserRole } from "src/common/enums/user-role.enum";

@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) {

  }

  @Roles(UserRole.ADMIN)
  @Get("/user")
  async getUser(@CurrentUser() user: any) {
    return user;
  }
}