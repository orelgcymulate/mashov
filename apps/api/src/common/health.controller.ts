import { Controller, Get } from '@nestjs/common';
import { Public } from '../modules/auth/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health(): { ok: boolean } {
    return { ok: true };
  }
}
