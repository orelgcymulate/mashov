import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { BehaviorCreate, BehaviorCreateSchema, BehaviorUpdate, BehaviorUpdateSchema } from '@mashov/shared';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { BehaviorService } from './behavior.service';

@Controller('behavior')
export class BehaviorController {
  constructor(private readonly svc: BehaviorService) {}

  @Get()
  list(@Query('kidId') kidId?: string) {
    return this.svc.list(kidId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(BehaviorCreateSchema))
  create(@Body() body: BehaviorCreate) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(BehaviorUpdateSchema))
  update(@Param('id') id: string, @Body() body: BehaviorUpdate) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.svc.remove(id);
  }
}
