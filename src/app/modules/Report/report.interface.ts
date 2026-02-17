import { Types } from "mongoose";

export type TStudentStatus = 'on track' | 'behind' | 'attention' | 'critical';

export interface IStudentProgress {
  course: Types.ObjectId;
  student: Types.ObjectId;
  status: TStudentStatus;
  attendanceRate: number;      // Percentage of days present
  homeworkCompletedRate: number; // Percentage of tasks submitted
  avgGrade: number;            // Average marks obtained
  overdueRate: number;         // Percentage of missed deadlines
  totalTasks: number;
  completedTasks: number;
    createdAt?: Date;
  updatedAt?: Date;
}