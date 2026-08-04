import { Types } from "mongoose";

export type TSubmissionStatus = 'in time' | 'late' | 'don\'t submit' | 'offline';

export interface ISubmission {
  task: Types.ObjectId;
  student: Types.ObjectId;
  course: Types.ObjectId;
  answerPdf?: string; // Optional for offline submissions
  submissionStatus: TSubmissionStatus;
  marks?: number;
  totalMarks?: number;
  percentage?: number;
  feedback?: string;
  correctAnswerPdf?: string; 
  isMarked: boolean;
}