import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CourseServices } from './course.services';
import uploadImage from '../../middleware/upload';
import AppError from '../../errors/AppError';

const createCourse = catchAsync(async (req, res) => {
  const image = req.file ? await uploadImage(req) : undefined;
  const result = await CourseServices.createCourseIntoDB({ ...req.body, image });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Course created', data: result });
});

const updateCourseInfo = catchAsync(async (req, res) => {
  const image = req.file ? await uploadImage(req) : undefined;
  const payload = { ...req.body };
  if (image) payload.image = image;
  const result = await CourseServices.updateCourseInfoInDB(req.params.id as string, payload);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Course info updated', data: result });
});



const assignTeacher = catchAsync(async (req, res) => {
  const result = await CourseServices.assignTeacherInDB(req.params.id as string, req.body.teacherId);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Teacher assigned', data: result });
});

const assignAssistant = catchAsync(async (req, res) => {
  const result = await CourseServices.assignAssistantInDB(req.params.id as string, req.body.assistantId);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Assistant assigned', data: result });
});

const addStudent = catchAsync(async (req, res) => {
  const result = await CourseServices.addStudentToCourseInDB(req.params.id as string, req.body.studentId);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Student added', data: result });
});

const removeStudent = catchAsync(async (req, res) => {
  const result = await CourseServices.removeStudentFromCourseInDB(req.params.id as string, req.body.studentId);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Student removed', data: result });
});

const deleteCourse = catchAsync(async (req, res) => {
  await CourseServices.deleteCourseFromDB(req.params.id as string);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Course deleted', data: null });
});

const getAllCourses = catchAsync(async (req, res) => {
  const result = await CourseServices.getAllCoursesFromDB(req.query);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Courses retrieved', data: result });
});
const getMyCourses = catchAsync(async (req, res) => {
  const result = await CourseServices.getMyCoursesFromDB(req.user,req.query);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Courses retrieved', data: result });
});

const addMultipleStudents = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { studentIds } = req.body; // Expecting an array of strings

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please provide an array of student IDs');
  }

  const result = await CourseServices.addMultipleStudentsToCourseInDB(id as string, studentIds);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${studentIds.length} students added to the course successfully`,
    data: result,
  });
});
const removeMultipleStudents = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { studentIds } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please provide an array of student IDs to remove');
  }

  const result = await CourseServices.removeMultipleStudentsFromCourseInDB(id as string, studentIds);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${studentIds.length} students removed from the course successfully`,
    data: result,
  });
});
const getTeacherDashboardStats = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await CourseServices.getTeacherDashboardStatsFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Teacher dashboard statistics retrieved successfully',
    data: result,
  });
});


export const CourseControllers = {
  createCourse,
  updateCourseInfo,

  assignTeacher,
  assignAssistant,
  addStudent,
  removeStudent,
  deleteCourse,
  getAllCourses,
  getMyCourses,addMultipleStudents,removeMultipleStudents,getTeacherDashboardStats
};