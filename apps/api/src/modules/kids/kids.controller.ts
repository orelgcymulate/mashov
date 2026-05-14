import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UsePipes } from '@nestjs/common';
import { KidCreate, KidCreateSchema, KidUpdate, KidUpdateSchema } from '@mashov/shared';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { KidsService } from './kids.service';

@Controller('kids')
export class KidsController {
  constructor(private readonly svc: KidsService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(KidCreateSchema))
  create(@Body() body: KidCreate) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(KidUpdateSchema))
  update(@Param('id') id: string, @Body() body: KidUpdate) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.svc.remove(id);
  }
}
