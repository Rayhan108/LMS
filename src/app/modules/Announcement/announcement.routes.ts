import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middleware/auth';
import { upload } from '../../middleware/multer';
import validateRequest from '../../middleware/validateRequest';
import { AnnouncementValidations } from './announcement.validation';
import { AnnouncementControllers } from './announcement.controller';

const router = express.Router();

const parseBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.body) req.body = JSON.parse(req.body.body);
  next();
};

// Announcement operations
router.post(
  '/create',
  auth('teacher', 'assistant'),
  upload.single('document'),
  parseBody,
  validateRequest(AnnouncementValidations.createAnnouncementSchema),
  AnnouncementControllers.createAnnouncement
);

router.get(
  '/course/:courseId',
  auth('teacher', 'assistant', 'student'),
  AnnouncementControllers.getCourseAnnouncements
);

router.delete(
  '/:id',
  auth('teacher', 'assistant', 'superAdmin'),
  AnnouncementControllers.deleteAnnouncement
);

// Comment operations
router.post(
  '/comment',
  auth('teacher', 'assistant', 'student'),
  validateRequest(AnnouncementValidations.createCommentSchema),
  AnnouncementControllers.addComment
);

export const AnnouncementRoutes = router;