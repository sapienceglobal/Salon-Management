import express from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as attendanceController from './attendance.controller.js';

const router = express.Router();

router.use(authenticate); // Ensure user is authenticated

router.get('/', attendanceController.getAttendance);
router.post('/mark', attendanceController.markAttendance);
router.post('/import', attendanceController.importAttendance);

export default router;
