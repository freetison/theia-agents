import {
  Controller,
  Post,
  Sse,
  Param,
  Body,
  Req,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';
import type { Request } from 'express';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { isErr } from '@theia-core/result';
import { AGENTS_SERVICE, type IAgentsService } from '../types';

interface RunAgentsDto {
  profileId: string;
  problem: string;
}

@ApiTags('agents')
@ApiHeader({ name: 'X-Tenant-Id', required: true })
@Controller('agents')
export class AgentsController {
  constructor(@Inject(AGENTS_SERVICE) private readonly agents: IAgentsService) {}

  @Post('run')
  @ApiOperation({ summary: 'Start a new agent-run session' })
  async run(@Body() dto: RunAgentsDto, @Req() req: Request) {
    const result = await this.agents.run({
      sessionId: crypto.randomUUID(),
      profileId: dto.profileId,
      problem: dto.problem,
      tenantId: req.tenantId,
    });

    if (isErr(result)) {
      throw new HttpException(result.error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { started: true };
  }

  @Sse('sessions/:sessionId/progress')
  @ApiOperation({ summary: 'SSE stream: agent progress for a session' })
  progress(@Param('sessionId') sessionId: string): Observable<{ data: string }> {
    const progress$ = from(this.agents.streamProgress(sessionId));
    return progress$.pipe(map((event) => ({ data: JSON.stringify(event) })));
  }
}
