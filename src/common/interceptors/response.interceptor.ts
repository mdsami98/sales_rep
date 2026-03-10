import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
  error: string | null;
  path: string;
  method: string;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((res) => {
        // If the service returns { data, meta, message }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const isWrapped = res && typeof res === 'object' && 'data' in res;

        return {
          success: true,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          statusCode: response.statusCode,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          message: isWrapped ? res.message || 'Success' : 'Success',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: isWrapped ? res.data : res,
          ...(isWrapped && res.meta ? { meta: res.meta } : {}),
          error: null,
          path: request.url,
          method: request.method,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}