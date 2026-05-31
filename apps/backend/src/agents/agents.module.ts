import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AGENTS_SERVICE } from '../types';

@Module({
  controllers: [AgentsController],
  providers: [
    {
      provide: AGENTS_SERVICE,
      useClass: AgentsService,
    },
  ],
  exports: [AGENTS_SERVICE],
})
export class AgentsModule {}
