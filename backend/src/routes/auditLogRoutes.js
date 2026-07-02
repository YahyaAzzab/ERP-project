const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { getAuditLogs } = require('../controllers/auditLogController');

const router = express.Router();

router.get('/', authMiddleware, checkRole('ADMIN'), getAuditLogs);

module.exports = router;
