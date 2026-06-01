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
    const fromHeader = Array.isArray(raw) ? raw[0] : raw;
    // EventSource (SSE) cannot set headers — accept query param as fallback
    const fromQuery = req.query && typeof req.query['tenantId'] === 'string' ? req.query['tenantId'] : undefined;
    const tenantId = fromHeader ?? fromQuery;

    if (!tenantId || tenantId.trim() === '') {
      throw new BadRequestException('Missing required header: X-Tenant-Id');
    }

    req.tenantId = tenantId.trim();
    next();
  }
}
