import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { TenantMiddleware } from './middleware/tenant.middleware';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { SessionsModule } from './sessions/sessions.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PromptsModule } from './prompts/prompts.module';
import { AgentsModule } from './agents/agents.module';

// DATABASE_URL is read here (main module bootstrap) — acceptable per principles
const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://theia:theia_dev_pass@localhost:5432/theia_dev';

@Module({
  imports: [
    DatabaseModule.forRoot(DATABASE_URL),
    HealthModule,
    SessionsModule,
    ProfilesModule,
    PromptsModule,
    AgentsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).exclude('health').forRoutes('*');
  }
}
