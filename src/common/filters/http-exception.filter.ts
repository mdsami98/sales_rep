import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  method: string;
  timestamp: string;
}

@Catch()  // ✅ catches everything — HttpException + unexpected errors
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { statusCode, message, error } = this.getErrorDetails(exception);

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    // ✅ log 5xx errors only — no noise for 4xx
    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} → ${statusCode}`);
    }

    response.status(statusCode).json(errorResponse);
  }

  private getErrorDetails(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    // ✅ Handle NestJS HttpExceptions (400, 401, 403, 404, 409 etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // class-validator errors return an object with message array
      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        return {
          statusCode: status,
          message: (exceptionResponse as any).message,
          error: (exceptionResponse as any).error ?? exception.name,
        };
      }

      return {
        statusCode: status,
        message: exception.message,
        error: exception.name,
      };
    }

    // ✅ Handle unexpected errors (DB crash, null pointer etc.)
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
    };
  }
}