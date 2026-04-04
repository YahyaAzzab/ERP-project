const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', notificationController.getMyNotifications);
router.get('/count', notificationController.getUnreadCount);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
