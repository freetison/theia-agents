import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { TenantMiddleware } from './middleware/tenant.middleware';
import { HealthModule } from './health/health.module';
import { SessionsModule } from './sessions/sessions.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PromptsModule } from './prompts/prompts.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [HealthModule, SessionsModule, ProfilesModule, PromptsModule, AgentsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply tenant middleware to all routes except /health
    consumer.apply(TenantMiddleware).exclude('health').forRoutes('*');
  }
}
