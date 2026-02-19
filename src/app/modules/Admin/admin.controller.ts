import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AdminServices } from "./admin.services";



const getDashboardStats = catchAsync(async (req, res) => {

  const year = Number(req.query.year) || new Date().getFullYear();
  
  const result = await AdminServices.getAdminDashboardStatsFromDB(year);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin dashboard statistics retrieved successfully',
    data: result
  });
});

export const AdminControllers = {
  getDashboardStats
};