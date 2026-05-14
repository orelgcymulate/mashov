import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import {
  ScheduleSlotCreate,
  ScheduleSlotCreateSchema,
  ScheduleSlotUpdate,
  ScheduleSlotUpdateSchema,
} from '@mashov/shared';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly svc: ScheduleService) {}

  @Get()
  list(@Query('kidId') kidId?: string) {
    return this.svc.list(kidId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(ScheduleSlotCreateSchema))
  create(@Body() body: ScheduleSlotCreate) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(ScheduleSlotUpdateSchema))
  update(@Param('id') id: string, @Body() body: ScheduleSlotUpdate) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.svc.remove(id);
  }
}
