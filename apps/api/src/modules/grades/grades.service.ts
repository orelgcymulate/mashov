import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GradeCreate, GradeUpdate } from '@mashov/shared';
import { Grade, GradeDocument } from './grade.schema';

@Injectable()
export class GradesService {
  constructor(@InjectModel(Grade.name) private readonly model: Model<GradeDocument>) {}

  list(kidId?: string): Promise<GradeDocument[]> {
    const filter: Record<string, unknown> = {};
    if (kidId) filter.kidId = new Types.ObjectId(kidId);
    return this.model.find(filter).sort({ eventDate: -1 }).exec();
  }

  async getById(id: string): Promise<GradeDocument> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('grade_not_found');
    return doc;
  }

  create(input: GradeCreate): Promise<GradeDocument> {
    return this.model.create(input);
  }

  async update(id: string, patch: GradeUpdate): Promise<GradeDocument> {
    const doc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    if (!doc) throw new NotFoundException('grade_not_found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('grade_not_found');
  }
}
