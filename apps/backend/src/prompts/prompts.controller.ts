import {
  Controller,
  Get,
  Param,
  Req,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';
import type { Request } from 'express';
import { isErr } from '@theia-core/result';
import { PROMPTS_SERVICE, type IPromptsService } from '../types';

@ApiTags('prompts')
@ApiHeader({ name: 'X-Tenant-Id', required: true })
@Controller('prompts')
export class PromptsController {
  constructor(@Inject(PROMPTS_SERVICE) private readonly prompts: IPromptsService) {}

  @Get('agents/:agentName')
  @ApiOperation({ summary: 'Get current prompt for an agent (tenant cascade)' })
  async findByAgent(@Param('agentName') agentName: string, @Req() req: Request) {
    const result = await this.prompts.findByAgent(agentName, req.tenantId);
    if (isErr(result)) {
      throw new HttpException(result.error.message, HttpStatus.NOT_FOUND);
    }
    return result.value;
  }
}
