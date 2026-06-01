import {
  Controller,
  Post,
  Sse,
  Param,
  Body,
  Req,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  @HttpCode(202)
  @ApiOperation({ summary: 'Start a new agent-run session (async, returns 202)' })
  run(@Body() dto: RunAgentsDto, @Req() req: Request): { sessionId: string; status: string } {
    const sessionId = crypto.randomUUID();
    setImmediate(() => {
      this.agents.run({
        sessionId,
        profileId: dto.profileId,
        problem: dto.problem,
        tenantId: req.tenantId,
      }).catch((e: unknown) => {
        console.error(`[AgentsController] run failed for session ${sessionId}:`, e);
      });
    });
    return { sessionId, status: 'accepted' };
  }

  @Sse('sessions/:sessionId/progress')
  @ApiOperation({ summary: 'SSE stream: agent progress for a session' })
  progress(@Param('sessionId') sessionId: string): Observable<{ data: string }> {
    return this.agents
      .streamProgress(sessionId)
      .pipe(map((event) => ({ data: JSON.stringify(event) })));
  }
}
