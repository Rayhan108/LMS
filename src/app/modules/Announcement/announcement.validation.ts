import { z } from 'zod';

const createAnnouncementSchema = z.object({
  courseId: z.string("Course ID is required" ),
  details: z.string("Details are required" ),
  link: z.string().url().optional().or(z.literal('')),
});

const createCommentSchema = z.object({
  announcementId: z.string(),
  comment: z.string(),
  parentCommentId: z.string().optional(), // Needed when teacher replies
});

export const AnnouncementValidations = {
  createAnnouncementSchema,
  createCommentSchema
};