const Analytics = require('../models/Analytics');
const Channel = require('../models/Channel');
const youtubeService = require('../services/youtubeService');
const analyticsService = require('../services/analyticsService');

const getAnalytics = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { startDate, endDate, period = '7d' } = req.query;

    // Verify channel ownership
    const channel = await Channel.findOne({
      userId: req.userId,
      channelId,
      isActive: true
    });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Calculate date range
    const dateRange = analyticsService.calculateDateRange(period, startDate, endDate);

    // Fetch analytics data
    const analytics = await Analytics.find({
      channelId,
      date: {
        $gte: dateRange.start,
        $lte: dateRange.end
      }
    }).sort({ date: -1 });

    // Process and format data
    const processedData = analyticsService.processAnalyticsData(analytics, period);

    res.json({
      channelId,
      period,
      dateRange,
      analytics: processedData
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching analytics' });
  }
};



const getDashboard = async (req, res) => {
  try {
    // You could extract `period` and use it for time-based logic
    const period = req.query.period || '30d';

    const channels = await Channel.find({ userId: req.userId, isActive: true });

    const dashboardData = await Promise.all(
      channels.map(async (channel) => {
        const analytics = await youtubeService.getChannelAnalytics(channel.channelId);
        return {
          channelId: channel.channelId,
          channelName: channel.channelName,
          metrics: analytics?.metrics || {},
        };
      })
    );

    res.json({ data: dashboardData });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
};

module.exports = { getDashboard };


const syncAnalytics = async (req, res) => {
  try {
    const { channelId } = req.params;

    // Verify channel ownership
    const channel = await Channel.findOne({
      userId: req.userId,
      channelId,
      isActive: true
    });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Fetch latest analytics from YouTube API
    const analyticsData = await youtubeService.getChannelAnalytics(channelId);
    
    if (!analyticsData) {
      return res.status(400).json({ 
        message: 'Unable to fetch analytics data from YouTube' 
      });
    }

    // Save analytics data
    const analytics = new Analytics({
      channelId,
      date: new Date(),
      metrics: analyticsData.metrics,
      demographics: analyticsData.demographics,
      topVideos: analyticsData.topVideos
    });

    await analytics.save();

    // Update channel last sync time
    channel.lastSynced = new Date();
    await channel.save();

    res.json({
      message: 'Analytics synced successfully',
      analytics
    });
  } catch (error) {
    console.error('Sync analytics error:', error);
    res.status(500).json({ message: 'Server error while syncing analytics' });
  }
};

module.exports = {
  getAnalytics,
  getDashboard,
  syncAnalytics
};