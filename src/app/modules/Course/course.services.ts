import { JwtPayload } from 'jsonwebtoken';
import { CourseModel } from './course.model';
import { ICourse, TCourseStatus } from './course.interface';
import { USER_ROLE } from '../Auth/auth.constant';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { UserModel } from '../User/user.model';

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
  const teacher = await UserModel.findById(teacherId);
  
  if (!teacher) {
    throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found!');
  }
  
  if (teacher.role !== 'teacher') {
    throw new AppError(httpStatus.BAD_REQUEST, `The user you are trying to assign is a ${teacher.role}, not a teacher!`);
  }

  return await CourseModel.findByIdAndUpdate(id, { teacherId: teacherId }, { new: true });
};


const assignAssistantInDB = async (id: string, assistantId: string) => {
  const assistant = await UserModel.findById(assistantId);
  
  if (!assistant) {
    throw new AppError(httpStatus.NOT_FOUND, 'Assistant not found!');
  }
  
  if (assistant.role !== 'assistant') {
    throw new AppError(httpStatus.BAD_REQUEST, `The user you are trying to assign is a ${assistant.role}, not an assistant!`);
  }

  return await CourseModel.findByIdAndUpdate(id, { assistantId: assistantId }, { new: true });
};


const addStudentToCourseInDB = async (id: string, studentId: string) => {
  const course = await CourseModel.findById(id);
  if (!course) throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  
  const student = await UserModel.findById(studentId);
  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found!');
  }

  if (student.role !== 'student') {
    throw new AppError(httpStatus.BAD_REQUEST, `This user is a ${student.role}. Only students can be added to a course!`);
  }

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

const addMultipleStudentsToCourseInDB = async (id: string, studentIds: string[]) => {
  // 1. Check if course exists
  const course = await CourseModel.findById(id);
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  // 2. Validate all student IDs (Role must be student and must exist)
  const validStudents = await UserModel.find({
    _id: { $in: studentIds },
    role: 'student',
    status: 'in-progress'
  });

  if (validStudents.length !== studentIds.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST, 
      'Some users are not valid students or are not approved yet.'
    );
  }

  // 3. Update course: Add students uniquely using $addToSet
  const result = await CourseModel.findByIdAndUpdate(
    id,
    { 
      $addToSet: { students: { $each: studentIds } } 
    },
    { new: true }
  );

  // 4. Update totalEnrolled count
  if (result) {
    result.totalEnrolled = result.students.length;
    await result.save();
  }

  return result;
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



const getAllCoursesFromDB = async (query: Record<string, unknown>) => {
  const courseQuery = new QueryBuilder(
    CourseModel.find().populate('teacherId assistantId students'),
    query
  )
    .search(['className', 'subjectName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await courseQuery.modelQuery;
  const meta = await courseQuery.countTotal();
  return { meta, result };
};


// const getMyCoursesFromDB = async (user: JwtPayload, query: Record<string, unknown>) => {
//   const { userId, role } = user;
//   let filter: any = {};

//   if (role === USER_ROLE.teacher) {
//     filter.teacher = userId;
//   } else if (role === USER_ROLE.assistant) {
//     filter.assistant = userId;
//   } else if (role === USER_ROLE.student) {
//     filter.students = { $in: [userId] };
//   } else {
//      throw new AppError(httpStatus.FORBIDDEN, "You don't have access to courses");
//   }

//   const courseQuery = new QueryBuilder(
//     CourseModel.find(filter).populate('teacher assistant students'),
//     query
//   )
//     .search(['className', 'subjectName'])
//     .filter()
//     .sort()
//     .paginate()
//     .fields();

//   const result = await courseQuery.modelQuery;
//   const meta = await courseQuery.countTotal();
//   return { meta, result };
// };


const getMyCoursesFromDB = async (user: JwtPayload, query: Record<string, unknown>) => {
  const { userId, role } = user;
  let filter: any = {};

  if (role === USER_ROLE.teacher) filter.teacherId = userId;
  else if (role === USER_ROLE.assistant) filter.assistantId = userId;
  else if (role === USER_ROLE.student) filter.students = { $in: [userId] };


  const courseQuery = new QueryBuilder(
    CourseModel.find(filter),
    query
  )
    .search(['className', 'subjectName'])
    .filter()
    .sort()
    .paginate();

 
  if (role === USER_ROLE.student) {
    courseQuery.modelQuery.select('-students'); 
  }

 
  let populateOptions: any = [
    { path: 'teacherId', select: 'firstName lastName fullName image email' },
    { path: 'assistantId', select: 'firstName lastName fullName image email' }
  ];

  if (role === USER_ROLE.teacher || role === USER_ROLE.assistant) {
    populateOptions.push({
      path: 'students',
      select: 'firstName lastName fullName image email contact'
    });
  }

  courseQuery.modelQuery.populate(populateOptions);

  const result = await courseQuery.modelQuery;
  const meta = await courseQuery.countTotal();

  return { meta, result };
};


const removeMultipleStudentsFromCourseInDB = async (id: string, studentIds: string[]) => {
  // 1. Check if course exists
  const course = await CourseModel.findById(id);
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  // 2. Remove students using $pull with $in
  const result = await CourseModel.findByIdAndUpdate(
    id,
    { 
      $pull: { students: { $in: studentIds } } 
    },
    { new: true }
  );

  // 3. Update totalEnrolled count based on remaining students
  if (result) {
    result.totalEnrolled = result.students.length;
    await result.save();
  }

  return result;
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
  getMyCoursesFromDB,
  addMultipleStudentsToCourseInDB,removeMultipleStudentsFromCourseInDB
};