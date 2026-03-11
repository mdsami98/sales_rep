import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { UserRole } from "src/common/enums/user-role.enum";
// import { Roles } from "src/common/decorators/roles.decorator";
// import { UserRole } from "src/common/enums/user-role.enum";

@Controller('users')
export class UsersController {
  constructor() {}

  @Roles(UserRole.ADMIN)
  @Get('/me')
  getUser(@CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}