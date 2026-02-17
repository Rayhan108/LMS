import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AttendanceServices } from "./attendence.services";

const markAttendance = catchAsync(async (req, res) => {

  const attendanceData = req.body.attendances 
    ? req.body.attendances 
    : [req.body];

  const payload = attendanceData.map((item: any) => ({
    ...item,
    markedBy: req.user.userId
  }));

  const result = await AttendanceServices.markAttendanceInDB(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance recorded successfully',
    data: result
  });
});

const getAllAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceServices.getAllAttendanceFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance records retrieved',
    data: result
  });
});

const getMyAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceServices.getStudentAttendanceFromDB(
    req.user.userId,
    req.query
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your attendance records retrieved',
    data: result
  });
});

const getOverallStats = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await AttendanceServices.getAttendanceStatsFromDB(courseId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course attendance statistics retrieved',
    data: result
  });
});

export const AttendanceControllers = {
  markAttendance,
  getAllAttendance,
  getMyAttendance,
  getOverallStats
};