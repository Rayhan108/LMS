import QueryBuilder from "../../builder/QueryBuilder";
import { sendNotificationToCourse } from "../../utils/sendNotification";
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

const getTasksByCourseFromDB = async (courseId: string, type?: string) => {
  const filter: any = { course: courseId };
  if (type) filter.type = type;
  
  const result = await TaskModel.find(filter).sort({ endDate: 1, endTime: 1 });
  return result;
};

export const TaskServices = {
  createTaskIntoDB,
  getAllTasksFromDB,
  getTasksByCourseFromDB
};