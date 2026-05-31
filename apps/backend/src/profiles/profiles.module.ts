import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { PROFILES_SERVICE } from '../types';

@Module({
  controllers: [ProfilesController],
  providers: [
    {
      provide: PROFILES_SERVICE,
      useClass: ProfilesService,
    },
  ],
  exports: [PROFILES_SERVICE],
})
export class ProfilesModule {}
