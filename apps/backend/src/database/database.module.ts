import { Module, type DynamicModule } from '@nestjs/common';
import { createDb } from './connection';
import { ProfilesRepo } from './repos/profiles.repo';
import { PromptsRepo } from './repos/prompts.repo';
import { RoutingRepo } from './repos/routing.repo';
import { SessionsRepo } from './repos/sessions.repo';
import { AgentOutputsRepo } from './repos/agent-outputs.repo';
import {
  DATABASE_CONNECTION,
  PROFILE_REPO,
  PROMPT_REPO,
  ROUTING_REPO,
  SESSION_REPO,
  AGENT_OUTPUT_REPO,
} from '../types';

@Module({})
export class DatabaseModule {
  static forRoot(connectionString: string): DynamicModule {
    const dbProvider = {
      provide: DATABASE_CONNECTION,
      useValue: createDb(connectionString),
    };

    return {
      module: DatabaseModule,
      providers: [
        dbProvider,
        { provide: PROFILE_REPO, useClass: ProfilesRepo },
        { provide: PROMPT_REPO, useClass: PromptsRepo },
        { provide: ROUTING_REPO, useClass: RoutingRepo },
        { provide: SESSION_REPO, useClass: SessionsRepo },
        { provide: AGENT_OUTPUT_REPO, useClass: AgentOutputsRepo },
      ],
      exports: [
        DATABASE_CONNECTION,
        PROFILE_REPO,
        PROMPT_REPO,
        ROUTING_REPO,
        SESSION_REPO,
        AGENT_OUTPUT_REPO,
      ],
      global: true,
    };
  }
}
