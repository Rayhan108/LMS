import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middleware/auth';
import { upload } from '../../middleware/multer';
import validateRequest from '../../middleware/validateRequest';
import { SubmissionValidations } from './submission.validation';
import { SubmissionControllers } from './submission.controller';

const router = express.Router();

const parseBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.body) req.body = JSON.parse(req.body.body);
  next();
};

router.post(
  '/task',
  auth('student'),
  upload.single('answerPdf'),
  parseBody,
  validateRequest(SubmissionValidations.createSubmissionSchema),
  SubmissionControllers.submitTask
);


router.patch(
  '/mark/:id',
  auth('teacher', 'assistant'),
  upload.single('correctAnswerPdf'),
  parseBody,
  validateRequest(SubmissionValidations.markSubmissionSchema),
  SubmissionControllers.markSubmission
);


router.get(
  '/task/:taskId',
  auth('teacher', 'assistant'),
  SubmissionControllers.getSubmissionsByTask
);

export const SubmissionRoutes = router;