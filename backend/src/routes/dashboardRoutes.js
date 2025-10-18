const express = require('express');
const { getDashboard } = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET /api/dashboard?period=30d
router.get('/', getDashboard);

module.exports = router;
