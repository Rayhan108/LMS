import { z } from 'zod';

const createCourseSchema = z.object({
  className: z.string('Class name is required'),
  subjectName: z.string('Subject name is required'),
  status: z.enum(['Active', 'Pending', 'Complete']).optional(),
  teacher: z.string().optional(),
  assistant: z.string().optional(),
  students: z.array(z.string()).optional(),
});

const updateCourseSchema = z.object({
  className: z.string().optional(),
  subjectName: z.string().optional(),
  status: z.enum(['Active', 'Pending', 'Complete']).optional(),
  teacher: z.string().optional(),
  assistant: z.string().optional(),
  students: z.array(z.string()).optional(),
});

export const CourseValidations = {
  createCourseSchema,
  updateCourseSchema,
};