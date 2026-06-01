import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';
import type { Request } from 'express';
import { isErr } from '@theia-core/result';
import { PROFILES_SERVICE, type IProfilesService, type CreateProfileInput } from '../types';

@ApiTags('profiles')
@ApiHeader({ name: 'X-Tenant-Id', required: true })
@Controller('profiles')
export class ProfilesController {
  constructor(@Inject(PROFILES_SERVICE) private readonly profiles: IProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'List profiles (global + tenant-specific)' })
  async findAll(@Req() req: Request) {
    const result = await this.profiles.findAll(req.tenantId);
    if (isErr(result)) {
      throw new HttpException(result.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return result.value;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a profile by ID' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    const result = await this.profiles.findById(id, req.tenantId);
    if (isErr(result)) {
      throw new HttpException(result.error.message, HttpStatus.NOT_FOUND);
    }
    return result.value;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new profile' })
  async create(@Req() req: Request, @Body() body: CreateProfileInput) {
    const result = await this.profiles.create(body, req.tenantId);
    if (isErr(result)) {
      throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST);
    }
    return result.value;
  }
}
