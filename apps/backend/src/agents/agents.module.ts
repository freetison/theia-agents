import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsCatalogController } from './agents-catalog.controller';
import { AgentEngineService } from './agent-engine.service';
import { SessionStreamRegistry } from './session-stream.registry';
import { AGENTS_SERVICE } from '../types';

@Module({
  controllers: [AgentsController, AgentsCatalogController],
  providers: [
    SessionStreamRegistry,
    {
      provide: AGENTS_SERVICE,
      useClass: AgentEngineService,
    },
  ],
  exports: [AGENTS_SERVICE],
})
export class AgentsModule {}
