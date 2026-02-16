import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import uploadImage from "../../middleware/upload";
import { SubmissionServices } from "./submission.services";


const submitTask = catchAsync(async (req, res) => {
  const answerPdf = await uploadImage(req);
  const result = await SubmissionServices.submitTaskIntoDB({
    ...req.body,
    student: req.user.userId,
    answerPdf
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Task submitted successfully',
    data: result
  });
});

const markSubmission = catchAsync(async (req, res) => {
  const { id } = req.params;
  let correctAnswerPdf;
  if (req.file) {
    correctAnswerPdf = await uploadImage(req);
  }

  const result = await SubmissionServices.markSubmissionInDB(id as string, {
    ...req.body,
    correctAnswerPdf
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Submission marked successfully',
    data: result
  });
});

const getSubmissionsByTask = catchAsync(async (req, res) => {
  const result = await SubmissionServices.getSubmissionsByTaskFromDB(req.params.taskId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Submissions retrieved',
    data: result
  });
});

export const SubmissionControllers = {
  submitTask,
  markSubmission,
  getSubmissionsByTask
};