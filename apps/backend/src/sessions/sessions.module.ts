import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SESSIONS_SERVICE } from '../types';

@Module({
  controllers: [SessionsController],
  providers: [
    {
      provide: SESSIONS_SERVICE,
      useClass: SessionsService,
    },
  ],
  exports: [SESSIONS_SERVICE],
})
export class SessionsModule {}
