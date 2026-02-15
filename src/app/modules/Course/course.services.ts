import { JwtPayload } from 'jsonwebtoken';
import { CourseModel } from './course.model';
import { ICourse, TCourseStatus } from './course.interface';
import { USER_ROLE } from '../Auth/auth.constant';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

const createCourseIntoDB = async (payload: ICourse) => {
      const isExists = await CourseModel.findOne({
    className: payload.className,
    subjectName: payload.subjectName,
  });

  if (isExists) {
    throw new AppError(httpStatus.CONFLICT, 'This subject is already exists in this class!');
  }
  return await CourseModel.create(payload);
};

const updateCourseInfoInDB = async (id: string, payload: Partial<ICourse>) => {

  if (payload.className || payload.subjectName) {
    const currentCourse = await CourseModel.findById(id);
    if (!currentCourse) throw new AppError(httpStatus.NOT_FOUND, 'Course not found');

    const checkClassName = payload.className || currentCourse.className;
    const checkSubjectName = payload.subjectName || currentCourse.subjectName;


    const isExists = await CourseModel.findOne({
      _id: { $ne: id }, 
      className: checkClassName,
      subjectName: checkSubjectName,
    });

    if (isExists) {
      throw new AppError(httpStatus.CONFLICT, 'This subject is already exists in this class!');
    }
  }

  return await CourseModel.findByIdAndUpdate(id, payload, { 
    new: true, 
    runValidators: true 
  });
};


const assignTeacherInDB = async (id: string, teacherId: string) => {
  return await CourseModel.findByIdAndUpdate(id, { teacher: teacherId }, { new: true });
};

const assignAssistantInDB = async (id: string, assistantId: string) => {
  return await CourseModel.findByIdAndUpdate(id, { assistant: assistantId }, { new: true });
};


const addStudentToCourseInDB = async (id: string, studentId: string) => {
  const course = await CourseModel.findById(id);
  if (!course) throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  
  if (course.students.includes(studentId as any)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Student already enrolled');
  }

  return await CourseModel.findByIdAndUpdate(
    id,
    { 
      $addToSet: { students: studentId },
      $inc: { totalEnrolled: 1 } 
    },
    { new: true }
  );
};


const removeStudentFromCourseInDB = async (id: string, studentId: string) => {
  const course = await CourseModel.findById(id);
  if (!course) throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  
  if (!course.students.includes(studentId as any)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Student not found in this course');
  }

  return await CourseModel.findByIdAndUpdate(
    id,
    { 
      $pull: { students: studentId },
      $inc: { totalEnrolled: -1 } 
    },
    { new: true }
  );
};

const deleteCourseFromDB = async (id: string) => {
  return await CourseModel.findByIdAndDelete(id);
};

const getAllCoursesFromDB = async (user: JwtPayload, query: Record<string, unknown>) => {
  let filter: any = {};
  if (user.role === USER_ROLE.teacher) filter.teacher = user.userId;
  else if (user.role === USER_ROLE.assistant) filter.assistant = user.userId;
  else if (user.role === USER_ROLE.student) filter.students = { $in: [user.userId] };

  const courseQuery = new QueryBuilder(CourseModel.find(filter).populate('teacher assistant students'), query)
    .search(['className', 'subjectName'])
    .filter().sort().paginate().fields();

  const result = await courseQuery.modelQuery;
  const meta = await courseQuery.countTotal();
  return {meta, result };
};

export const CourseServices = {
  createCourseIntoDB,
  updateCourseInfoInDB,
  assignTeacherInDB,
  assignAssistantInDB,
  addStudentToCourseInDB,
  removeStudentFromCourseInDB,
  deleteCourseFromDB,
  getAllCoursesFromDB,
};