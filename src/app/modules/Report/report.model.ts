import { model, Schema } from "mongoose";
import { IStudentProgress } from "./report.interface";

const studentProgressSchema = new Schema<IStudentProgress>({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['on track', 'behind', 'attention', 'critical'], 
    default: 'on track' 
  },
  attendanceRate: { type: Number, default: 0 },
  homeworkCompletedRate: { type: Number, default: 0 },
  avgGrade: { type: Number, default: 0 },
  overdueRate: { type: Number, default: 0 },
  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure one progress record per student per course
studentProgressSchema.index({ course: 1, student: 1 }, { unique: true });

export const StudentProgressModel = model<IStudentProgress>('StudentProgress', studentProgressSchema);