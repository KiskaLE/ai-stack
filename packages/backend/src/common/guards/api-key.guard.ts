
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private reflector: Reflector, private configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers['authorization'];
        const validApiKey = this.configService.get<string>('apiKey');

        if (!validApiKey) {
            console.warn('API_KEY environment variable is not set. All authenticated requests will fail.');
            throw new UnauthorizedException('Server configuration error');
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.split(' ')[1];

        if (token !== validApiKey) {
            throw new UnauthorizedException('Invalid API Key');
        }

        return true;
    }
}
