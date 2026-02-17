import { Schema, model } from 'mongoose';
import { ICourse } from './course.interface';

const courseSchema = new Schema<ICourse>(
  {
    className: { type: String, required: true,trim:true },
    subjectName: { type: String, required: true,trim:true },
    image: { type: String },
    status: { type: String, enum: ['Active', 'Pending', 'Complete'], default: 'Pending' },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    assistantId: { type: Schema.Types.ObjectId, ref: 'User' },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    totalEnrolled: { type: Number, default: 0 },
  },
  { timestamps: true }
);
courseSchema.index({ className: 1, subjectName: 1 }, { unique: true });
export const CourseModel = model<ICourse>('Course', courseSchema);