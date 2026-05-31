import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

declare module 'express' {
  interface Request {
    tenantId: string;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const raw = req.headers['x-tenant-id'];
    const tenantId = Array.isArray(raw) ? raw[0] : raw;

    if (!tenantId || tenantId.trim() === '') {
      throw new BadRequestException('Missing required header: X-Tenant-Id');
    }

    req.tenantId = tenantId.trim();
    next();
  }
}
