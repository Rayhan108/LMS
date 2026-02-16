import { z } from 'zod';
export const ClassValidation = z.object({
  course: z.string(),
  title: z.string(),
  date: z.string().transform(v => new Date(v)),
  time: z.string(),
  details: z.string(),
  link: z.string().url(),
});