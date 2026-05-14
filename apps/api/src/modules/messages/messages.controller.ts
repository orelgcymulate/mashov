import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { MessageCreate, MessageCreateSchema, MessageUpdate, MessageUpdateSchema } from '@mashov/shared';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}

  @Get()
  list(@Query('kidId') kidId?: string) {
    return this.svc.list(kidId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(MessageCreateSchema))
  create(@Body() body: MessageCreate) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(MessageUpdateSchema))
  update(@Param('id') id: string, @Body() body: MessageUpdate) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.svc.remove(id);
  }
}
