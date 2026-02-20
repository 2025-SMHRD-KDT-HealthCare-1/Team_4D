const express = require('express');
const { createSubject, deleteSubject } = require('../controllers/subjectsController');

const router = express.Router();

router.post('/', createSubject);
router.delete('/:subject_id', deleteSubject);

module.exports = router;
