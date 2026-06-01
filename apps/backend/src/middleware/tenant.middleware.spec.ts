import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { TenantMiddleware } from '../middleware/tenant.middleware';
import type { Request, Response } from 'express';

function makeReq(headerValue?: string | string[], queryTenantId?: string): Request {
  return {
    headers: headerValue !== undefined ? { 'x-tenant-id': headerValue } : {},
    query: queryTenantId !== undefined ? { tenantId: queryTenantId } : {},
  } as unknown as Request;
}

describe('TenantMiddleware', () => {
  const middleware = new TenantMiddleware();
  const next = vi.fn();
  const res = {} as Response;

  it('attaches tenantId when header is present', () => {
    const req = makeReq('tenant-abc');
    middleware.use(req, res, next);
    expect(req.tenantId).toBe('tenant-abc');
    expect(next).toHaveBeenCalled();
  });

  it('trims whitespace from tenantId', () => {
    const req = makeReq('  tenant-xyz  ');
    middleware.use(req, res, next);
    expect(req.tenantId).toBe('tenant-xyz');
  });

  it('uses first value when header is an array', () => {
    const req = makeReq(['first-tenant', 'ignored']);
    middleware.use(req, res, next);
    expect(req.tenantId).toBe('first-tenant');
  });

  it('accepts tenantId from query param (SSE fallback)', () => {
    const req = makeReq(undefined, 'tenant-from-query');
    middleware.use(req, res, next);
    expect(req.tenantId).toBe('tenant-from-query');
    expect(next).toHaveBeenCalled();
  });

  it('prefers header over query param when both present', () => {
    const req = makeReq('tenant-header', 'tenant-query');
    middleware.use(req, res, next);
    expect(req.tenantId).toBe('tenant-header');
  });

  it('throws BadRequestException when header is missing', () => {
    const req = makeReq();
    expect(() => middleware.use(req, res, next)).toThrow(BadRequestException);
  });

  it('throws BadRequestException when header is empty string', () => {
    const req = makeReq('');
    expect(() => middleware.use(req, res, next)).toThrow(BadRequestException);
  });

  it('throws BadRequestException when header is only whitespace', () => {
    const req = makeReq('   ');
    expect(() => middleware.use(req, res, next)).toThrow(BadRequestException);
  });
});
