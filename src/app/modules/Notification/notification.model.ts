import { model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
    role: { type: String, default: null },   
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['task', 'class', 'announcement', 'result','general'], 
    required: true 
  },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const NotificationModel = model<INotification>('Notification', notificationSchema);