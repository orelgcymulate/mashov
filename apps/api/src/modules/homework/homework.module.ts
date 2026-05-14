import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Homework, HomeworkSchemaDef } from './homework.schema';
import { HomeworkService } from './homework.service';
import { HomeworkController } from './homework.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Homework.name, schema: HomeworkSchemaDef }])],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService, MongooseModule],
})
export class HomeworkModule {}
