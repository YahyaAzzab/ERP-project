const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const clientController = require('../controllers/clientController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkRole('ADMIN', 'COMPTABLE'), clientController.getClients);
router.post('/', checkRole('ADMIN', 'COMPTABLE'), clientController.createClient);
router.get('/statistiques', checkRole('ADMIN', 'COMPTABLE'), clientController.getStatistiquesClients);
router.get('/:id', checkRole('ADMIN', 'COMPTABLE'), clientController.getClientById);
router.put('/:id', checkRole('ADMIN'), clientController.updateClient);
router.delete('/:id', checkRole('ADMIN'), clientController.deleteClient);

module.exports = router;
