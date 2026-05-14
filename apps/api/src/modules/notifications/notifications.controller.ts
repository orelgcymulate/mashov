import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import {
  NotificationCreate,
  NotificationCreateSchema,
  NotificationUpdate,
  NotificationUpdateSchema,
} from '@mashov/shared';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  list(@Query('kidId') kidId?: string) {
    return this.svc.list(kidId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(NotificationCreateSchema))
  create(@Body() body: NotificationCreate) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(NotificationUpdateSchema))
  update(@Param('id') id: string, @Body() body: NotificationUpdate) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.svc.remove(id);
  }
}
