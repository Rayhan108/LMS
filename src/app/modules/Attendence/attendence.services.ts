import mongoose from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { IAttendance } from "./attendence.interface";
import { AttendanceModel } from "./attendence.model";



const markAttendanceInDB = async (attendances: IAttendance[]) => {
  const results = [];
  for (const data of attendances) {
    const res = await AttendanceModel.findOneAndUpdate(
      { course: data.course, student: data.student, date: data.date },
      data,
      { upsert: true, new: true }
    );
    results.push(res);
  }
  return results;
};


const getAllAttendanceFromDB = async (query: Record<string, unknown>) => {
  const attendanceQuery = new QueryBuilder(
    AttendanceModel.find(),
    query
  )
    .filter()
    .sort()
    .paginate()
    .fields();
 attendanceQuery.modelQuery.populate([
    {
      path: 'course',
      select: 'className subjectName'
    },
    {
      path: 'markedBy',
      select: 'fullName image' 
    }
  ]);
  const result = await attendanceQuery.modelQuery;
  const meta = await attendanceQuery.countTotal();
  return { meta, result };
};


const getStudentAttendanceFromDB = async (studentId: string, query: Record<string, unknown>) => {
  const attendanceQuery = new QueryBuilder(
    AttendanceModel.find({ student: studentId }),
    query
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  attendanceQuery.modelQuery.populate([
    {
      path: 'course',
      select: 'className subjectName'
    },
    {
      path: 'markedBy',
      select: 'fullName image' 
    }
  ]);

  const result = await attendanceQuery.modelQuery;
  const meta = await attendanceQuery.countTotal();
  return { meta, result };
};


const getAttendanceStatsFromDB = async (courseId: string) => {
  const stats = await AttendanceModel.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    absent: stats.find((s:any) => s._id === 'absent')?.count || 0,
    late: stats.find((s:any) => s._id === 'late')?.count || 0,
    onTime: stats.find((s:any) => s._id === 'on time')?.count || 0,
    total: stats.reduce((acc:any, curr:any) => acc + curr.count, 0)
  };
};

export const AttendanceServices = {
  markAttendanceInDB,
  getAllAttendanceFromDB,
  getStudentAttendanceFromDB,
  getAttendanceStatsFromDB
};