import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BehaviorCreate, BehaviorUpdate } from '@mashov/shared';
import { Behavior, BehaviorDocument } from './behavior.schema';

@Injectable()
export class BehaviorService {
  constructor(@InjectModel(Behavior.name) private readonly model: Model<BehaviorDocument>) {}

  list(kidId?: string): Promise<BehaviorDocument[]> {
    const filter: Record<string, unknown> = {};
    if (kidId) filter.kidId = new Types.ObjectId(kidId);
    return this.model.find(filter).sort({ date: -1 }).exec();
  }

  async getById(id: string): Promise<BehaviorDocument> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('event_not_found');
    return doc;
  }

  create(input: BehaviorCreate): Promise<BehaviorDocument> {
    return this.model.create(input);
  }

  async update(id: string, patch: BehaviorUpdate): Promise<BehaviorDocument> {
    const doc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    if (!doc) throw new NotFoundException('event_not_found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('event_not_found');
  }
}
