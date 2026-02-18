import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import uploadImage from "../../middleware/upload";
import { TaskServices } from "./task.services";


const createTask = catchAsync(async (req, res) => {
  let pdfUrl;
  if (req.file) {
    pdfUrl = await uploadImage(req);
  }

  const result = await TaskServices.createTaskIntoDB({
    ...req.body,
    document: pdfUrl,
    createdBy: req.user.userId
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `${req.body.type} added successfully`,
    data: result
  });
});

const getTasksByCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  
  // Pass req.query to service for QueryBuilder
  const result = await TaskServices.getTasksByCourseFromDB(courseId as string, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tasks retrieved successfully',
    data: result
  });
});

export const TaskControllers = {
  createTask,
  getTasksByCourse
};