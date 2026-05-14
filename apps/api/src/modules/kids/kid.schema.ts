import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type KidDocument = HydratedDocument<Kid>;

@Schema({ collection: 'kids', timestamps: true })
export class Kid {
  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  color!: string;
}

export const KidSchemaDef = SchemaFactory.createForClass(Kid);
