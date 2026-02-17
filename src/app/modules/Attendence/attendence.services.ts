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


// src/app/modules/Attendance/attendance.service.ts

const getAttendanceStatsFromDB = async (courseId: string, studentId?: string) => {
  const matchQuery: any = { course: new mongoose.Types.ObjectId(courseId) };
  

  if (studentId) {
    matchQuery.student = new mongoose.Types.ObjectId(studentId);
  }

  const stats = await AttendanceModel.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  // set default value
  const counts = {
    absent: stats.find(s => s._id === 'absent')?.count || 0,
    late: stats.find(s => s._id === 'late')?.count || 0,
    onTime: stats.find(s => s._id === 'on time')?.count || 0,
  };

  const total = counts.absent + counts.late + counts.onTime;

  // percentage calc (Division by zero )
  const calculatePercentage = (value: number) => 
    total > 0 ? parseFloat(((value / total) * 100).toFixed(2)) : 0;

  return {
    course: courseId,
    student: studentId || "All Students",
    totalDays: total,
    counts,
    percentages: {
      absent: calculatePercentage(counts.absent),
      late: calculatePercentage(counts.late),
      onTime: calculatePercentage(counts.onTime),
      attendanceRate: calculatePercentage(counts.onTime + counts.late) 
    }
  };
};

export const AttendanceServices = {
  markAttendanceInDB,
  getAllAttendanceFromDB,
  getStudentAttendanceFromDB,
  getAttendanceStatsFromDB
};