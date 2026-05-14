import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { HomeworkCreate, HomeworkCreateSchema, HomeworkUpdate, HomeworkUpdateSchema } from '@mashov/shared';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { HomeworkService } from './homework.service';

@Controller('homework')
export class HomeworkController {
  constructor(private readonly svc: HomeworkService) {}

  @Get()
  list(@Query('kidId') kidId?: string, @Query('done') done?: string) {
    return this.svc.list({
      kidId,
      done: done === 'true' ? true : done === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(HomeworkCreateSchema))
  create(@Body() body: HomeworkCreate) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(HomeworkUpdateSchema))
  update(@Param('id') id: string, @Body() body: HomeworkUpdate) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.svc.remove(id);
  }
}
