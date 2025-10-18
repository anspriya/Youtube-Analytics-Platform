const express = require('express');

const {
  getAnalytics,
  getDashboard,
  syncAnalytics
} = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth); // All analytics routes require authentication

router.get('/dashboard', getDashboard);
router.get('/:channelId', getAnalytics);
router.post('/:channelId/sync', syncAnalytics);

module.exports = router;