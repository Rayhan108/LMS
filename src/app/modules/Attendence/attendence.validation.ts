import { z } from 'zod';

const markAttendanceSchema = z.object({
  course: z.string("Course ID is required" ),
  student: z.string("Student ID is required" ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  status: z.enum(['absent', 'late', 'on time']),
});

// array validation for taking all student attendence
const bulkAttendanceSchema = z.object({
  attendances: z.array(markAttendanceSchema)
});

export const AttendanceValidations = {
  markAttendanceSchema,
  bulkAttendanceSchema
};