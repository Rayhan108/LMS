import express from 'express';
import auth from '../../middleware/auth';
import { ReportControllers } from './report.controller';

const router = express.Router();

// Student access for individual progress circles (Image 3)
router.get('/my-report/:courseId', auth('student'), ReportControllers.getMyReport);

// Teacher access for Dashboard Header Counts (Image 1)
router.get('/course-overview/:courseId', auth('teacher', 'assistant'), ReportControllers.getCourseOverview);

// Teacher access for Student Status List (Image 2)
router.get('/student-list/:courseId', auth('teacher', 'assistant'), ReportControllers.getCourseStudentsStatus);

router.get(
  '/overall-stats/:courseId',
  auth('teacher', 'assistant', 'superAdmin'),
  ReportControllers.getOverallAcademicStats
);
router.get(
  '/tabular-report/:courseId',
  auth('teacher', 'assistant', 'superAdmin'),
  ReportControllers.getTabularReport
);

export const ReportRoutes = router;