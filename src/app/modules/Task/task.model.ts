import { model, Schema } from "mongoose";
import { ITask } from "./task.interface";

const taskSchema = new Schema<ITask>({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['homework', 'exam'], required: true },
  startDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endDate: { type: String, required: true },
  endTime: { type: String, required: true },
  details: { type: String, required: true },
  document: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for dynamic status
taskSchema.virtual('status').get(function() {
  const now = new Date();
  const endDateTime = new Date(`${this.endDate}T${this.endTime}`);
  return now > endDateTime ? 'time over' : 'active';
});

export const TaskModel = model<ITask>('Task', taskSchema);