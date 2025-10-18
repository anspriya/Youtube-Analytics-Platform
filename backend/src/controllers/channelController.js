const Channel = require('../models/Channel');
const youtubeService = require('../services/youtubeService');
const { validateChannel } = require('../middleware/validation');

const addChannel = async (req, res) => {
  try {
    const { error } = validateChannel(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { channelId } = req.body;

    // Check if channel already exists for this user
    const existingChannel = await Channel.findOne({
      userId: req.userId,
      channelId
    });

    if (existingChannel) {
      return res.status(400).json({ 
        message: 'Channel already added to your account' 
      });
    }

    // Fetch channel data from YouTube API
    const channelData = await youtubeService.getChannelDetails(channelId);
    if (!channelData) {
      return res.status(404).json({ message: 'Channel not found on YouTube' });
    }

    // Create new channel record
    const channel = new Channel({
      userId: req.userId,
      channelId,
      channelName: channelData.snippet.title,
      description: channelData.snippet.description,
      subscriberCount: parseInt(channelData.statistics.subscriberCount) || 0,
      videoCount: parseInt(channelData.statistics.videoCount) || 0,
      viewCount: parseInt(channelData.statistics.viewCount) || 0,
      thumbnailUrl: channelData.snippet.thumbnails.default?.url || '',
      country: channelData.snippet.country || '',
      publishedAt: new Date(channelData.snippet.publishedAt)
    });

    await channel.save();

    res.status(201).json({
      message: 'Channel added successfully',
      channel
    });
  } catch (error) {
    console.error('Add channel error:', error);
    res.status(500).json({ message: 'Server error while adding channel' });
  }
};

const getChannels = async (req, res) => {
  try {
    const channels = await Channel.find({ 
      userId: req.userId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({ channels });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ message: 'Server error while fetching channels' });
  }
};

const updateChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const channel = await Channel.findOne({
      userId: req.userId,
      channelId,
      isActive: true
    });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Fetch latest data from YouTube API
    const channelData = await youtubeService.getChannelDetails(channelId);
    if (!channelData) {
      return res.status(404).json({ message: 'Channel not found on YouTube' });
    }

    // Update channel data
    channel.channelName = channelData.snippet.title;
    channel.description = channelData.snippet.description;
    channel.subscriberCount = parseInt(channelData.statistics.subscriberCount) || 0;
    channel.videoCount = parseInt(channelData.statistics.videoCount) || 0;
    channel.viewCount = parseInt(channelData.statistics.viewCount) || 0;
    channel.thumbnailUrl = channelData.snippet.thumbnails.default?.url || '';
    channel.lastSynced = new Date();

    await channel.save();

    res.json({
      message: 'Channel updated successfully',
      channel
    });
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({ message: 'Server error while updating channel' });
  }
};

const removeChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const channel = await Channel.findOne({
      userId: req.userId,
      channelId,
      isActive: true
    });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    channel.isActive = false;
    await channel.save();

    res.json({ message: 'Channel removed successfully' });
  } catch (error) {
    console.error('Remove channel error:', error);
    res.status(500).json({ message: 'Server error while removing channel' });
  }
};

module.exports = {
  addChannel,
  getChannels,
  updateChannel,
  removeChannel
};