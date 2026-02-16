import { z } from 'zod';

const createTaskValidationSchema = z.object({
  course: z.string( "Course ID is required"),
  title: z.string("Title is required"),
  type: z.enum(['homework', 'exam']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  details: z.string( "Details are required"),
});

export const TaskValidations = {
  createTaskValidationSchema,
};