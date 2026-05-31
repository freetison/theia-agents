import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { PROMPTS_SERVICE } from '../types';

@Module({
  controllers: [PromptsController],
  providers: [
    {
      provide: PROMPTS_SERVICE,
      useClass: PromptsService,
    },
  ],
  exports: [PROMPTS_SERVICE],
})
export class PromptsModule {}
