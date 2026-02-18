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
    .search(['title']) // Title দিয়ে সার্চ করা যাবে
    .filter()         // 'type' (homework/exam) ফিল্টার এখানে অটোমেটিক হবে
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

export const TaskServices = {
  createTaskIntoDB,
  getAllTasksFromDB,
  getTasksByCourseFromDB
};