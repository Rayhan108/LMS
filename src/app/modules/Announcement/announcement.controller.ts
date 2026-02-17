import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import uploadImage from "../../middleware/upload";
import { AnnouncementServices } from "./announcement.services";


const createAnnouncement = catchAsync(async (req, res) => {
  let pdfUrl;
  if (req.file) {
    pdfUrl = await uploadImage(req);
  }

  const result = await AnnouncementServices.createAnnouncementIntoDB({
    ...req.body,
    document: pdfUrl,
    createdBy: req.user.userId
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Announcement posted successfully',
    data: result
  });
});

const getCourseAnnouncements = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await AnnouncementServices.getAnnouncementsByCourseFromDB(courseId as string, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Announcements retrieved successfully',
    data: result
  });
});

const addComment = catchAsync(async (req, res) => {
  const result = await AnnouncementServices.addCommentIntoDB({
    ...req.body,
    user: req.user.userId
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Comment added successfully',
    data: result
  });
});

const deleteAnnouncement = catchAsync(async (req, res) => {
  await AnnouncementServices.deleteAnnouncementFromDB(req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Announcement deleted successfully',
    data: null
  });
});

export const AnnouncementControllers = {
  createAnnouncement,
  getCourseAnnouncements,
  addComment,
  deleteAnnouncement
};