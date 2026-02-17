import { Types } from "mongoose";

export type TAttendanceStatus = 'absent' | 'late' | 'on time';

export interface IAttendance {
  course: Types.ObjectId;
  student: Types.ObjectId;
  date: string; // YYYY-MM-DD
  status: TAttendanceStatus;
  markedBy: Types.ObjectId;
}