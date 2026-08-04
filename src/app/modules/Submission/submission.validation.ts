import { z } from 'zod';

const createSubmissionSchema = z.object({
  task: z.string({ message: "Task ID is required" }),
  course: z.string({ message: "Course ID is required" }),
});

const updateSubmissionSchema = z.object({
  task: z.string().optional(),
  course: z.string().optional(),
});
 
const markSubmissionSchema = z.object({
  marks: z.number({ message: "Marks are required" }).min(0),
  totalMarks: z.number({ message: "Total marks are required" }).min(1),
  feedback: z.string().optional(),
});

const offlineMarkSubmissionSchema = z.object({
  task: z.string({ message: "Task ID is required" }),
  student: z.string({ message: "Student ID is required" }),
  course: z.string({ message: "Course ID is required" }),
  marks: z.number({ message: "Marks are required" }).min(0),
  totalMarks: z.number({ message: "Total marks are required" }).min(1),
  feedback: z.string().optional(),
});

export const SubmissionValidations = {
  createSubmissionSchema,
  markSubmissionSchema,
  updateSubmissionSchema,
  offlineMarkSubmissionSchema
};