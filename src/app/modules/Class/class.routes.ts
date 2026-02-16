import auth from "../../middleware/auth";
import express, { NextFunction, Request, Response } from 'express';
import { upload } from "../../middleware/multer";
import { ClassController } from "./class.controller";
const router = express.Router();

const parseBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.body) req.body = JSON.parse(req.body.body);
  next();
};
router.post('/add', auth('teacher', 'assistant'), upload.single('document'), parseBody, ClassController.createClass);
router.get('/:courseId', auth('teacher', 'assistant', 'student'), ClassController.getClassesByCourse);
export const ClassRoutes=router