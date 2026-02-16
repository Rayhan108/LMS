import { IClass } from "./class.interface";
import { ClassModel } from "./class.model";

const createClassIntoDB = async (payload: IClass) => await ClassModel.create(payload);
const getClassesByCourse = async (courseId: string) => await ClassModel.find({ course: courseId }).sort({ date: 1 });

export const ClassServices={createClassIntoDB,getClassesByCourse}