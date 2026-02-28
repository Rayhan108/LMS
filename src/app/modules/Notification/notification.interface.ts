import { Types } from "mongoose";

export interface INotification {
  user: Types.ObjectId; // User who receives the notification
  role?:string;
  title: string;
  message: string;
  type: 'task' | 'class' | 'announcement' | 'result' | 'general'
  isRead: boolean;
}