import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';
import { agentsCatalog, type AgentMeta } from '@theia/engine';

@ApiTags('agents')
@ApiHeader({ name: 'X-Tenant-Id', required: true })
@Controller('agents')
export class AgentsCatalogController {
  @Get()
  @ApiOperation({ summary: 'List all known agents (static catalog from engine)' })
  findAll(): AgentMeta[] {
    return agentsCatalog;
  }
}
