import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TaskModel } from "../Task/task.model";
import { ISubmission } from "./submission.interface";
import { SubmissionModel } from "./submission.model";
import { sendPushNotification } from "../../utils/sendNotification";

const submitTaskIntoDB = async (payload: Partial<ISubmission>) => {
  const task = await TaskModel.findById(payload.task);
  if (!task) throw new AppError(httpStatus.NOT_FOUND, "Task not found");

  const now = new Date();
  const endDateTime = new Date(`${task.endDate}T${task.endTime}`);
  payload.submissionStatus = now > endDateTime ? 'late' : 'in time';

  const result = await SubmissionModel.create(payload);
  return result;
};

const markSubmissionInDB = async (id: string, payload: Partial<ISubmission>) => {
  const submission = await SubmissionModel.findById(id);
  if (!submission) throw new AppError(httpStatus.NOT_FOUND, "Submission not found");

  const result = await SubmissionModel.findByIdAndUpdate(
    id,
    { ...payload, isMarked: true },
    { new: true }
  );
   if (result) {
    // Notify the specific student
    await sendPushNotification(
      result.student.toString(),
      'Result Published! 🎉',
      `Your marks for the task have been published. Check it now!`,
      'result'
    );
  }
  return result;
};

const getSubmissionsByTaskFromDB = async (taskId: string) => {
  return await SubmissionModel.find({ task: taskId }).populate('student', 'firstName lastName fullName image');
};

const getMySubmissionsFromDB = async (studentId: string, courseId: string) => {
  return await SubmissionModel.find({ student: studentId, course: courseId })
    .populate('task', 'title type');
};

export const SubmissionServices = {
  submitTaskIntoDB,
  markSubmissionInDB,
  getSubmissionsByTaskFromDB,
  getMySubmissionsFromDB
};