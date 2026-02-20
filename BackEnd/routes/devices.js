const express = require('express');
const { createDevice, deleteDevice } = require('../controllers/devicesController');

const router = express.Router();

router.post('/', createDevice);
router.delete('/:device_id', deleteDevice);

module.exports = router;
