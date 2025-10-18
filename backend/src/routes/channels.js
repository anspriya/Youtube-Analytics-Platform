const express = require('express');
const {
  addChannel,
  getChannels,
  updateChannel,
  removeChannel
} = require('../controllers/channelController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth); // All channel routes require authentication

router.post('/', addChannel);
router.get('/', getChannels);
router.put('/:channelId', updateChannel);
router.delete('/:channelId', removeChannel);

module.exports = router;