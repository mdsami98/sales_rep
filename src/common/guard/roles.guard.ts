import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Step 1 — Read required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // method level first
      context.getClass(),   // then class level
    ]);

    // Step 2 — No @Roles() decorator means any authenticated user can pass
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Step 3 — Get user from request (set by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: any = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user found.');
    }

    // Step 4 — Check if user role matches required roles
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required: [${requiredRoles.join(', ')}] — Your role: [${user.role}]`,
      );
    }

    return true;
  }
}