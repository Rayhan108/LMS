import { Router } from 'express';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../Auth/auth.constant';
import { NotificationController } from './notification.controller';

const router = Router();


router.get(
  '/my-notifications',
  auth(USER_ROLE.teacher, USER_ROLE.superAdmin, USER_ROLE.student,USER_ROLE.parent,USER_ROLE.assistant),
  NotificationController.getMyNotifications
);
router.get(
  '/admin-notifications',
  auth(USER_ROLE.superAdmin),
  NotificationController.getMyNotifications
);


router.patch(
  '/mark-as-read',
  auth(USER_ROLE.teacher, USER_ROLE.superAdmin, USER_ROLE.student,USER_ROLE.parent,USER_ROLE.assistant),
  NotificationController.markAsRead
);

router.patch(
  '/mark-as-read/:id',
  auth(USER_ROLE.teacher, USER_ROLE.superAdmin, USER_ROLE.student,USER_ROLE.parent,USER_ROLE.assistant),
  NotificationController.markSingleAsRead
);
export const NotificationRoutes = router;