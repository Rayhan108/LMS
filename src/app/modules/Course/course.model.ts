import { Schema, model } from 'mongoose';
import { ICourse } from './course.interface';

const courseSchema = new Schema<ICourse>(
  {
    className: { type: String, required: true },
    subjectName: { type: String, required: true },
    image: { type: String },
    status: { type: String, enum: ['Active', 'Pending', 'Complete'], default: 'Pending' },
    teacher: { type: Schema.Types.ObjectId, ref: 'User' },
    assistant: { type: Schema.Types.ObjectId, ref: 'User' },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    totalEnrolled: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CourseModel = model<ICourse>('Course', courseSchema);