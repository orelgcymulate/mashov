import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Grade, GradeSchemaDef } from './grade.schema';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Grade.name, schema: GradeSchemaDef }])],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService, MongooseModule],
})
export class GradesModule {}
