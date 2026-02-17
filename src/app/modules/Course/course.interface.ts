import { Types } from 'mongoose';

export type TCourseStatus = 'Active' | 'Pending' | 'Complete';

export interface ICourse {
  className: string;
  subjectName: string;
  image?: string;
  status: TCourseStatus;
  teacherId?: Types.ObjectId;
  assistantId?: Types.ObjectId;
  students: Types.ObjectId[];
  totalEnrolled: number; 
}