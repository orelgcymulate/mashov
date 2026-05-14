import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScheduleSlotCreate, ScheduleSlotUpdate } from '@mashov/shared';
import { ScheduleSlot, ScheduleSlotDocument } from './schedule.schema';

@Injectable()
export class ScheduleService {
  constructor(@InjectModel(ScheduleSlot.name) private readonly model: Model<ScheduleSlotDocument>) {}

  list(kidId?: string): Promise<ScheduleSlotDocument[]> {
    const filter: Record<string, unknown> = {};
    if (kidId) filter.kidId = new Types.ObjectId(kidId);
    return this.model.find(filter).sort({ day: 1, lesson: 1 }).exec();
  }

  async getById(id: string): Promise<ScheduleSlotDocument> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('slot_not_found');
    return doc;
  }

  create(input: ScheduleSlotCreate): Promise<ScheduleSlotDocument> {
    return this.model.create(input);
  }

  async update(id: string, patch: ScheduleSlotUpdate): Promise<ScheduleSlotDocument> {
    const doc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    if (!doc) throw new NotFoundException('slot_not_found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('slot_not_found');
  }
}
