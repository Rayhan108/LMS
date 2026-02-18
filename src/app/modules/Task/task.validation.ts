import { z } from 'zod';

const createTaskValidationSchema = z.object({
  course: z.string( "Course ID is required"),
  title: z.string("Title is required"),
  type: z.enum(['homework', 'exam']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  startTime: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, "Invalid time format (e.g. 10:00 AM)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  endTime: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, "Invalid time format (e.g. 10:00 PM)"),
  details: z.string( "Details are required"),
});

export const TaskValidations = {
  createTaskValidationSchema,
};