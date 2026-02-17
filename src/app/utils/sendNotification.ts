import admin from 'firebase-admin';
import { NotificationModel } from '../modules/Notification/notification.model';
import { UserModel } from '../modules/User/user.model';
import { CourseModel } from '../modules/Course/course.model';

export const sendPushNotification = async (
  receiverId: string,
  title: string,
  message: string,
  type: 'task' | 'class' | 'announcement' | 'result'
) => {
  try {
    // 1. Save to Database for in-app notification list
    await NotificationModel.create({
      receiver: receiverId,
      title,
      message,
      type
    });

    // 2. Send Push Notification via FCM
    const user = await UserModel.findById(receiverId).select('fcmToken');
    
    if (user && user.fcmToken) {
      const payload = {
        notification: { title, body: message },
        token: user.fcmToken,
      };
      await admin.messaging().send(payload);
    }
  } catch (error) {
    console.error("FCM Notification Error:", error);
  }
};


export const sendNotificationToCourse = async (
  courseId: string,
  title: string,
  message: string,
  type: 'task' | 'class' | 'announcement' | 'result'
) => {
  const course = await CourseModel.findById(courseId).populate('students');
  if (course && course.students) {
    // Send notifications to all students in parallel
    await Promise.all(
      course.students.map((student: any) => 
        sendPushNotification(student._id.toString(), title, message, type)
      )
    );
  }
};