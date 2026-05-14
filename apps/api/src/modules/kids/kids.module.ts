import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Kid, KidSchemaDef } from './kid.schema';
import { KidsService } from './kids.service';
import { KidsController } from './kids.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Kid.name, schema: KidSchemaDef }])],
  controllers: [KidsController],
  providers: [KidsService],
  exports: [KidsService, MongooseModule],
})
export class KidsModule {}
