import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CourseServices } from './course.services';
import uploadImage from '../../middleware/upload';

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
  const result = await CourseServices.assignTeacherInDB(req.params.id as string, req.body.teacher);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Teacher assigned', data: result });
});

const assignAssistant = catchAsync(async (req, res) => {
  const result = await CourseServices.assignAssistantInDB(req.params.id as string, req.body.assistant);
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
  const result = await CourseServices.getAllCoursesFromDB(req.user, req.query);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Courses retrieved', data: result });
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
};