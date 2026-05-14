import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KidCreate, KidUpdate } from '@mashov/shared';
import { Kid, KidDocument } from './kid.schema';

@Injectable()
export class KidsService {
  constructor(@InjectModel(Kid.name) private readonly model: Model<KidDocument>) {}

  list(): Promise<KidDocument[]> {
    return this.model.find().sort({ createdAt: 1 }).exec();
  }

  async getById(id: string): Promise<KidDocument> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('kid_not_found');
    return doc;
  }

  create(input: KidCreate): Promise<KidDocument> {
    return this.model.create(input);
  }

  async update(id: string, patch: KidUpdate): Promise<KidDocument> {
    const doc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    if (!doc) throw new NotFoundException('kid_not_found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('kid_not_found');
  }
}
