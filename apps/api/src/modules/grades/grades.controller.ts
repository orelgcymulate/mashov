import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { GradeCreate, GradeCreateSchema, GradeUpdate, GradeUpdateSchema } from '@mashov/shared';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { GradesService } from './grades.service';

@Controller('grades')
export class GradesController {
  constructor(private readonly svc: GradesService) {}

  @Get()
  list(@Query('kidId') kidId?: string) {
    return this.svc.list(kidId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(GradeCreateSchema))
  create(@Body() body: GradeCreate) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(GradeUpdateSchema))
  update(@Param('id') id: string, @Body() body: GradeUpdate) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.svc.remove(id);
  }
}
