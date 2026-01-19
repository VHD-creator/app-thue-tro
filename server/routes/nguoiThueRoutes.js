const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// Tenant routes
router.post('/tenants', tenantController.createTenant);
router.get('/tenants', tenantController.getTenants);

// Room routes
router.post('/rooms', tenantController.createRoom);
router.get('/rooms', tenantController.getRooms);

module.exports = router;