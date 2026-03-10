import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  sub: number;        // user primary key (id)
  username: string;   // username
  role: string;       // 'admin' | 'sales_rep'
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user?.[data];
    }
    return request.user;
  },
);