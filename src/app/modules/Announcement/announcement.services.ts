import QueryBuilder from "../../builder/QueryBuilder";
import { sendNotificationToCourse, sendPushNotification } from "../../utils/sendNotification";
import { IAnnouncement, IComment } from "./announcement.interface";
import { AnnouncementModel, CommentModel } from "./announcement.model";

const createAnnouncementIntoDB = async (payload: IAnnouncement) => {
  const result = await AnnouncementModel.create(payload);

  // Notify all students in the course
  await sendNotificationToCourse(
    payload.courseId.toString(),
    'New Announcement! 📢',
    `New update from teacher: "${payload.details.substring(0, 40)}..."`,
    'announcement'
  );
  return result;
};

const getAnnouncementsByCourseFromDB = async (courseId: string, query: Record<string, unknown>) => {
  // Find announcements by courseId
  const announcementQuery = new QueryBuilder(
    AnnouncementModel.find({ courseId: courseId }),
    query
  ).sort().paginate();

  // Populate creator and nested comments with replies
  announcementQuery.modelQuery.populate([
    { path: 'createdBy', select: 'fullName image role' },
    { 
      path: 'comments', 
      strictPopulate: false, // Fixes the "StrictPopulateError"
      match: { parentCommentId: null }, // Only top-level comments
      populate: [
        { path: 'user', select: 'fullName image role' },
        { 
          path: 'replies', 
          strictPopulate: false, // Allows populating nested replies virtual
          populate: { path: 'user', select: 'fullName image role' } 
        }
      ] 
    }
  ]);

  const result = await announcementQuery.modelQuery;
  const meta = await announcementQuery.countTotal();
  return { meta, result };
};

const addCommentIntoDB = async (payload: IComment) => {
  const result = await CommentModel.create(payload);

  // If this is a reply (teacher/assistant replying to a student)
  if (payload.parentCommentId) {
    const parentComment = await CommentModel.findById(payload.parentCommentId);
    if (parentComment) {
      await sendPushNotification(
        parentComment.user.toString(),
        'New Reply on your comment! 💬',
        `Teacher replied to your comment in the course announcement.`,
        'announcement'
      );
    }
  }
  return await result.populate('user', 'fullName image role');
};



const deleteAnnouncementFromDB = async (id: string) => {
  await CommentModel.deleteMany({ announcementId: id }); // Delete associated comments first
  return await AnnouncementModel.findByIdAndDelete(id);
};

export const AnnouncementServices = {
  createAnnouncementIntoDB,
  getAnnouncementsByCourseFromDB,
  addCommentIntoDB,
  deleteAnnouncementFromDB
};