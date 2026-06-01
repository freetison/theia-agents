import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  HttpException,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';
import type { Request } from 'express';
import { isErr } from '@theia-core/result';
import { SESSIONS_SERVICE, type ISessionsService } from '../types';

interface CreateSessionDto {
  profileId: string;
  problem: string;
}

@ApiTags('sessions')
@ApiHeader({ name: 'X-Tenant-Id', required: true })
@Controller('sessions')
export class SessionsController {
  constructor(@Inject(SESSIONS_SERVICE) private readonly sessions: ISessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List sessions for the current tenant' })
  async findAll(@Req() req: Request) {
    const result = await this.sessions.findAll(req.tenantId);
    if (isErr(result)) {
      throw new HttpException(result.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return result.value;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a session by ID' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    const result = await this.sessions.findById(id, req.tenantId);
    if (isErr(result)) {
      throw new HttpException(result.error.message, HttpStatus.NOT_FOUND);
    }
    return result.value;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new session and queue agent run' })
  async create(@Body() dto: CreateSessionDto, @Req() req: Request) {
    const result = await this.sessions.create(req.tenantId, dto.profileId, dto.problem);
    if (isErr(result)) {
      throw new HttpException(result.error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return result.value;
  }
}
