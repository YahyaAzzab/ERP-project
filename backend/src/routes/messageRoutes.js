const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.use(authMiddleware);

router.get('/destinataires', messageController.listRecipients);
router.get('/reception', messageController.getInbox);
router.get('/envoyes', messageController.getSent);
router.get('/:id', messageController.getMessageById);
router.post('/', messageController.sendMessage);
router.patch('/:id/lu', messageController.markAsRead);

module.exports = router;
