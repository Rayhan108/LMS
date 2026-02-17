import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ReportServices } from "./report.services";


const getMyReport = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await ReportServices.syncAndGetStudentProgress(courseId as string, req.user.userId as string);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report calculated and retrieved successfully',
    data: result
  });
});

const getCourseOverview = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await ReportServices.getCourseDashboardOverview(courseId as string);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course dashboard counts retrieved',
    data: result
  });
});

const getCourseStudentsStatus = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const result = await ReportServices.getStudentListWithStatus(courseId as string);
    
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Student status list retrieved',
        data: result
    });
});

const getOverallAcademicStats = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await ReportServices.getOverallCourseAcademicStats(courseId as string);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Overall course academic statistics retrieved successfully',
    data: result
  });
});

const getTabularReport = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { search } = req.query; // Supports the search bar in your UI
  
  const result = await ReportServices.getDetailedTabularReport(courseId as string, search as string);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Detailed tabular report retrieved successfully',
    data: result
  });
});

export const ReportControllers = {
  getMyReport,
  getCourseOverview,
  getCourseStudentsStatus,getOverallAcademicStats,getTabularReport
};