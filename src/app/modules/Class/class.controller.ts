import uploadImage from "../../middleware/upload";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ClassServices } from "./class.services";
import httpStatus from 'http-status';

const createClass = catchAsync(async (req, res) => {
  const document = req.file ? await uploadImage(req) : undefined;
  const result = await ClassServices.createClassIntoDB({ ...req.body, document, createdBy: req.user.userId });
  sendResponse(res, { statusCode: 201, success: true, message: 'Class added', data: result });
});
const getClassesByCourse = catchAsync(async (req, res) => {

  const result = await ClassServices.getClassesByCourse(req.params.courseId as string);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Courses retrieved', data: result });
});

export const ClassController={
    createClass,getClassesByCourse
}