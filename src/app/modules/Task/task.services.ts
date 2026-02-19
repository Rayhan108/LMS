import QueryBuilder from "../../builder/QueryBuilder";
import { sendNotificationToCourse } from "../../utils/sendNotification";
import { SubmissionModel } from "../Submission/submission.model";
import { ITask } from "./task.interface";
import { TaskModel } from "./task.model";

const createTaskIntoDB = async (payload: ITask) => {
  const result = await TaskModel.create(payload);
    await sendNotificationToCourse(
    payload.course.toString(),
    `New ${payload.type.toUpperCase()}! 📝`,
    `A new ${payload.type} "${payload.title}" has been posted.`,
    'task'
  );
  return result;
};

const getAllTasksFromDB = async (query: Record<string, unknown>) => {
  const taskQuery = new QueryBuilder(
    TaskModel.find().populate('course createdBy'),
    query
  )
    .search(['title', 'type'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await taskQuery.modelQuery;
  const meta = await taskQuery.countTotal();
  return { meta, result };
};


const getTasksByCourseFromDB = async (courseId: string, query: Record<string, unknown>) => {
  // 1. Create a copy of the query
  const queryObj = { ...query };

  // 2. Remove 'status' from queryObj because it's a virtual field and QueryBuilder will fail to find it in DB
  const statusFilter = queryObj.status;
  delete queryObj.status;

  // 3. Initialize QueryBuilder
  const taskQuery = new QueryBuilder(
    TaskModel.find({ course: courseId }),
    queryObj
  )
    .search(['title']) // Title 
    .filter()         // 'type' (homework/exam)
    .sort()
    .paginate()
    .fields();

  // 4. Execute the query
  let result = await taskQuery.modelQuery;

  // 5. Manually filter by virtual 'status' (active / time over) if provided in query
  if (statusFilter) {
    result = result.filter((task: any) => task.status === statusFilter);
  }

  const meta = await taskQuery.countTotal();
  
  return { meta, result };
};




// Fetch single task details with conditional submission info
const getSingleTaskWithUserStatus = async (taskId: string, userId: string, role: string) => {
  // 1. Fetch the task with teacher details
  const task = await TaskModel.findById(taskId).populate({
    path: 'createdBy',
    select: 'fullName image'
  }).lean();

  if (!task) return null;

  // 2. If the user is NOT a student, return the task without submissionInfo
  if (role !== 'student') {
    return task;
  }

  // 3. Logic for students only: determine submission status
  let submissionStatus = "pending"; 
  let isSubmitted = false;

  const submission = await SubmissionModel.findOne({ task: taskId, student: userId });
  
  if (submission) {
    isSubmitted = true;
    submissionStatus = "submitted";
  } else {
    const now = new Date();
    const endDateTime = new Date(`${task.endDate} ${task.endTime}`);
    
    // If deadline passed and not submitted, mark as "missing"
    if (now > endDateTime) {
      submissionStatus = "missing";
    }
  }

  // 4. Return task with submissionInfo only for students
  return {
    ...task,
    submissionInfo: {
      isSubmitted,
      status: submissionStatus
    }
  };
};









export const TaskServices = {
  createTaskIntoDB,
  getAllTasksFromDB,
  getTasksByCourseFromDB,getSingleTaskWithUserStatus
};