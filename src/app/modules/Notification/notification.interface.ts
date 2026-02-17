import { Types } from "mongoose";

export interface INotification {
  receiver: Types.ObjectId; // User who receives the notification
  title: string;
  message: string;
  type: 'task' | 'class' | 'announcement' | 'result' | 'general'
  isRead: boolean;
}