// Analyze Channel Endpoint (supports handle, channel ID, or link)
const axios = require('axios');
const mongoose = require('mongoose');
const Channel = require('./models/Channel');
const { google } = require('googleapis');
const AWS = require('aws-sdk');
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});


// AWS S3 setup for thumbnail storage
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// YouTube API setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// ============ MODELS ============

// Channel Model using Mongoose
// Usage: Channel.create(), Channel.findOne(), Channel.findByIdAndUpdate(), etc.

// Video Model using Mongoose
const Video = require('./models/Video');
// Usage: Video.create(), Video.find(), Video.findOneAndUpdate(), etc.

// Analytics Model
// Analytics Model using Mongoose
const Analytics = require('./models/Analytics');
// Usage: Analytics.create(), Analytics.find(), Analytics.findOne(), etc.


// ============ SERVICES ============

// YouTube API Service
class YouTubeService {
  static async getChannelData(channelId) {
    try {
      console.log('[YouTubeService] Fetching channel data for:', channelId);
      const response = await youtube.channels.list({
        part: 'snippet,statistics',
        id: channelId
      });

      if (!response.data || !Array.isArray(response.data.items)) {
        console.error('[YouTubeService] Invalid response from YouTube API:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response from YouTube API');
      }

      if (response.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      const channel = response.data.items[0];
      return {
        channelId: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        viewCount: parseInt(channel.statistics.viewCount),
        videoCount: parseInt(channel.statistics.videoCount),
        thumbnailUrl: channel.snippet.thumbnails.high.url
      };
    } catch (error) {
      console.error('[YouTubeService] Error fetching channel data for', channelId, ':', error);
      throw error;
    }
  }

  static async getChannelVideos(channelId, maxResults = 50) {
    try {
      const response = await youtube.search.list({
        part: 'snippet',
        channelId: channelId,
        maxResults: maxResults,
        order: 'date',
        type: 'video'
      });

      const videoIds = response.data.items.map(item => item.id.videoId);
      
      const videosResponse = await youtube.videos.list({
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(',')
      });

      return videosResponse.data.items.map(video => ({
        videoId: video.id,
        channelId: channelId,
        title: video.snippet.title,
        description: video.snippet.description,
        duration: video.contentDetails.duration,
        viewCount: parseInt(video.statistics.viewCount || 0),
        likeCount: parseInt(video.statistics.likeCount || 0),
        commentCount: parseInt(video.statistics.commentCount || 0),
        publishedAt: video.snippet.publishedAt,
        isShort: this.isShortVideo(video.contentDetails.duration),
        thumbnailUrl: video.snippet.thumbnails.high.url
      }));
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw error;
    }
  }

  static isShortVideo(duration) {
    // Parse ISO 8601 duration format (PT1M30S = 1 minute 30 seconds)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds <= 60; // YouTube Shorts are 60 seconds or less
  }

  static async getAnalyticsData(channelId, startDate, endDate) {
    try {
      const youtubeAnalytics = google.youtubeAnalytics({
        version: 'v2',
        auth: process.env.YOUTUBE_OAUTH_TOKEN
      });

      const response = await youtubeAnalytics.reports.query({
        ids: `channel==${channelId}`,
        startDate: startDate,
        endDate: endDate,
        metrics: 'views,estimatedWatchTime,impressions,ctr,estimatedRevenue,subscribersGained',
        dimensions: 'day'
      });

      return response.data.rows.map(row => ({
        date: row[0],
        views: row[1],
        watchTime: row[2],
        impressions: row[3],
        ctr: row[4],
        revenue: row[5],
        subscriberGain: row[6]
      }));
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }
}

// ML Prediction Service
class MLService {
  static async loadModel() {
    try {
      const model = await tf.loadLayersModel('file://./models/performance_predictor.json');
      return model;
    } catch (error) {
      console.error('Error loading ML model:', error);
      return null;
    }
  }

  static async predictPerformance(videoFeatures) {
    const model = await this.loadModel();
    if (!model) {
      throw new Error('ML model not available');
    }

    const tensor = tf.tensor2d([videoFeatures]);
    const prediction = model.predict(tensor);
    const result = await prediction.data();
    
    tensor.dispose();
    prediction.dispose();
    
    return result[0];
  }

  static async analyzeOptimalContentMix(channelData) {
    // Analyze historical performance to recommend optimal content mix
    const shortsPerformance = channelData.filter(video => video.isShort);
    const longformPerformance = channelData.filter(video => !video.isShort);

    const shortsAvgViews = shortsPerformance.reduce((sum, video) => sum + video.views, 0) / shortsPerformance.length;
    const longformAvgViews = longformPerformance.reduce((sum, video) => sum + video.views, 0) / longformPerformance.length;

    const shortsAvgRevenue = shortsPerformance.reduce((sum, video) => sum + video.revenue, 0) / shortsPerformance.length;
    const longformAvgRevenue = longformPerformance.reduce((sum, video) => sum + video.revenue, 0) / longformPerformance.length;

    // Calculate optimal ratio based on performance metrics
    const shortsScore = (shortsAvgViews * 0.3) + (shortsAvgRevenue * 0.7);
    const longformScore = (longformAvgViews * 0.3) + (longformAvgRevenue * 0.7);

    const totalScore = shortsScore + longformScore;
    const shortsRatio = shortsScore / totalScore;
    const longformRatio = longformScore / totalScore;

    return {
      recommendedShortsPerWeek: Math.round(shortsRatio * 10),
      recommendedLongformPerWeek: Math.round(longformRatio * 10),
      confidence: Math.min(shortsPerformance.length, longformPerformance.length) / 10
    };
  }
}


// ============ ROUTES ============
// Analyze Channel Endpoint (supports handle, channel ID, or link)
app.post('/api/analyze-channel', async (req, res) => {
  try {
    const { channel } = req.body;

    let channelId = channel;
    let handle = null;

    // If input is a full YouTube URL, extract handle or channel ID
    if (channel.startsWith('http')) {
      // Match /channel/CHANNEL_ID
      const channelIdMatch = channel.match(/youtube\.com\/channel\/([\w-]+)/i);
      if (channelIdMatch) {
        channelId = channelIdMatch[1];
      } else {
        // Match @handle
        const handleMatch = channel.match(/youtube\.com\/@([\w.-]+)/i);
        if (handleMatch) {
          handle = handleMatch[1];
        }
      }
    } else if (channel.startsWith('@')) {
      // If input is a handle
      handle = channel.substring(1);
    }

    // If a handle was found, resolve it to a channel ID using YouTube Data API v3 (forHandle) or fallback to scraping
    if (handle) {
      let resolved = false;
      // Try forHandle param (if supported by googleapis)
      try {
        if (youtube.channels && youtube.channels.list) {
          const apiResp = await youtube.channels.list({
            part: 'id',
            forHandle: handle
          });
          if (apiResp.data && apiResp.data.items && apiResp.data.items.length > 0) {
            channelId = apiResp.data.items[0].id;
            resolved = true;
          }
        }
      } catch (err) {
        // Ignore and fallback
      }
      // Fallback: scrape channel page HTML for channelId
      if (!resolved) {
        try {
          const axios = require('axios');
          const htmlResp = await axios.get(`https://www.youtube.com/@${handle}`);
          const html = htmlResp.data;
          // Look for canonical channel URL: <link rel="canonical" href="https://www.youtube.com/channel/UC...">
          const match = html.match(/<link rel="canonical" href="https:\/\/www.youtube.com\/channel\/([^"]+)/);
          if (match && match[1]) {
            channelId = match[1];
            resolved = true;
          } else {
            return res.status(404).json({ error: 'Channel not found for handle (scrape fallback)', details: handle });
          }
        } catch (err) {
          return res.status(404).json({ error: 'Failed to resolve handle to channel ID (scrape fallback)', details: err.message });
        }
      }
    }

    // Try to fetch channel info using YouTubeService
    let channelInfo = null;
    let analytics = null;
    try {
      channelInfo = await YouTubeService.getChannelData(channelId);
      // Example: fetch analytics for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      analytics = await Analytics.find({
        channelId: channelInfo.channelId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
    } catch (err) {
      return res.status(404).json({ error: 'Channel not found or analytics unavailable', details: err.message });
    }

    // Summarize analytics and videos for all dashboard sections
    let totalViews = 0;
    let totalVideos = 0;
    let topVideo = null;
    let avgViews = 0;
    let videos = [];
    let shorts = [];
    let longform = [];
    let performanceTrends = [];
    let formatMetrics = [];
    let audienceData = [];
    let contentMixData = [];
    let recommendations = [];

    // Try to use DB analytics, else fallback to live YouTube data
    if (analytics && analytics.length > 0) {
      totalViews = analytics.reduce((sum, a) => sum + (a.metrics.views || 0), 0);
      totalVideos = analytics.reduce((sum, a) => sum + (a.metrics.videos || 0), 0);
      avgViews = totalViews / analytics.length;
      let allTopVideos = analytics.flatMap(a => a.topVideos || []);
      if (allTopVideos.length > 0) {
        topVideo = allTopVideos.reduce((max, v) => v.views > (max?.views || 0) ? v : max, null);
      }
      // Use analytics to build trends (if available)
      performanceTrends = analytics.map(a => ({
        date: a.date,
        shortsViews: a.metrics.shortsViews || 0,
        longformViews: a.metrics.longformViews || 0,
        shortsRevenue: a.metrics.shortsRevenue || 0,
        longformRevenue: a.metrics.longformRevenue || 0
      }));
    } else {
      // Fallback: fetch live video stats from YouTube Data API
      try {
        videos = await YouTubeService.getChannelVideos(channelId, 30);
        totalVideos = videos.length;
        totalViews = videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
        avgViews = totalVideos > 0 ? totalViews / totalVideos : 0;
        topVideo = videos.reduce((max, v) => v.viewCount > (max?.viewCount || 0) ? v : max, null);
        // Split shorts and longform
        shorts = videos.filter(v => v.isShort);
        longform = videos.filter(v => !v.isShort);
        // Build performance trends (last 5 videos by date)
        performanceTrends = videos.slice(0, 5).map(v => ({
          date: v.publishedAt.split('T')[0],
          shortsViews: v.isShort ? v.viewCount : 0,
          longformViews: !v.isShort ? v.viewCount : 0,
          shortsRevenue: v.isShort ? Math.floor((v.viewCount || 0) / 1000 * 2) : 0,
          longformRevenue: !v.isShort ? Math.floor((v.viewCount || 0) / 1000 * 2) : 0
        }));
      } catch (err) {
        return res.status(404).json({ error: 'Channel not found or analytics unavailable', details: err.message });
      }
    }

    // Format metrics (Shorts vs Long-form)
    if (shorts.length > 0 || longform.length > 0) {
      formatMetrics = [
        {
          format: 'Shorts',
          avgViews: shorts.length ? Math.round(shorts.reduce((s, v) => s + v.viewCount, 0) / shorts.length) : 0,
          avgEngagement: shorts.length ? Math.round(shorts.reduce((s, v) => s + v.likeCount, 0) / shorts.length) : 0,
          avgRevenue: 0,
          retention: 0
        },
        {
          format: 'Long-form',
          avgViews: longform.length ? Math.round(longform.reduce((s, v) => s + v.viewCount, 0) / longform.length) : 0,
          avgEngagement: longform.length ? Math.round(longform.reduce((s, v) => s + v.likeCount, 0) / longform.length) : 0,
          avgRevenue: 0,
          retention: 0
        }
      ];
    }

    // Audience data (mocked, as YouTube API does not provide this directly)
    audienceData = [
      { name: 'Shorts Only', value: shorts.length ? Math.round((shorts.length / totalVideos) * 100) : 0, color: '#ff6b6b' },
      { name: 'Long-form Only', value: longform.length ? Math.round((longform.length / totalVideos) * 100) : 0, color: '#4ecdc4' },
      { name: 'Both Formats', value: shorts.length && longform.length ? 100 - Math.round((shorts.length / totalVideos) * 100) - Math.round((longform.length / totalVideos) * 100) : 0, color: '#45b7d1' }
    ];

    // Content mix data (mocked, could be improved with more analytics)
    contentMixData = [
      { week: 'Week 1', shorts: shorts.length, longform: longform.length, performance: Math.round(avgViews) }
    ];

    // Recommendations (mocked, could be improved with more analytics)
    recommendations = [
      {
        type: 'optimal-mix',
        title: 'Optimal Content Mix',
        description: `Based on your data, publish ${shorts.length} Shorts and ${longform.length} long-form videos per month for maximum reach and revenue.`,
        impact: '+23% expected growth',
        priority: 'high'
      }
    ];

    res.json({
      success: true,
      channel: {
        title: channelInfo.title,
        channelId: channelInfo.channelId,
        subscribers: channelInfo.subscriberCount,
        totalViews: channelInfo.viewCount,
        videoCount: channelInfo.videoCount,
        thumbnailUrl: channelInfo.thumbnailUrl
      },
      analyticsSummary: {
        totalViews,
        avgViews: Math.round(avgViews),
        totalVideos,
        topVideo: topVideo ? {
          videoId: topVideo.videoId,
          title: topVideo.title,
          views: topVideo.viewCount || topVideo.views,
          publishedAt: topVideo.publishedAt
        } : null
      },
      performanceData: performanceTrends,
      formatMetrics,
      audienceData,
      contentMixData,
      recommendations,
      videos: videos.length ? videos : undefined
    });
  } catch (error) {
    console.error('Analyze channel error:', error);
    res.status(500).json({ error: 'Failed to analyze channel' });
  }
});

// Authentication Routes
app.post('/api/auth/youtube', async (req, res) => {
  try {
    const { code } = req.body;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens securely (in production, use proper token management)
    res.json({ 
      success: true, 
      message: 'YouTube account connected successfully',
      tokens: tokens
    });
  } catch (error) {
    console.error('YouTube auth error:', error);
    res.status(400).json({ error: 'Authentication failed' });
  }
});

// Channel Routes
app.post('/api/channels', async (req, res) => {
  try {
    const { channelId } = req.body;
    
    // Fetch channel data from YouTube and save to database
    const channelData = await YouTubeService.getChannelData(channelId);
    const channel = await Channel.create(channelData);
    res.json(channel);
  } catch (error) {
    console.error('Channel creation error:', error);
    res.status(500).json({ error: 'Failed to add channel' });
  }
});

app.get('/api/channels/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    res.json(channel);
  } catch (error) {
    console.error('Channel fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

app.put('/api/channels/:channelId/sync', async (req, res) => {
  try {
    const { channelId } = req.params;
    
    // Fetch latest data from YouTube
    const channelData = await YouTubeService.getChannelData(channelId);
    const channel = await Channel.updateStats(channelId, channelData);
    
    // Fetch and update videos
    const videos = await YouTubeService.getChannelVideos(channelId);
    
    for (const video of videos) {
      const existingVideo = await Video.findById(video.videoId);
      if (existingVideo) {
        await Video.updateStats(video.videoId, video);
      } else {
        await Video.create(video);
      }
    }
    

    
    res.json({ success: true, channel, videosUpdated: videos.length });
  } catch (error) {
    console.error('Channel sync error:', error);
    res.status(500).json({ error: 'Failed to sync channel' });
  }
});

// Analytics Routes
app.get('/api/analytics/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { startDate, endDate } = req.query;
    
    const analytics = await Analytics.getChannelAnalytics(channelId, startDate, endDate);
    res.json(analytics);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/analytics/:channelId/comparison', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { startDate, endDate } = req.query;
    
    const comparison = await Analytics.getFormatComparison(channelId, startDate, endDate);
    
    res.json(comparison);
  } catch (error) {
    console.error('Format comparison error:', error);
    res.status(500).json({ error: 'Failed to fetch format comparison' });
  }
});

// ML Prediction Routes
app.post('/api/ml/predict-performance', async (req, res) => {
  try {
    const { videoFeatures } = req.body;
    const prediction = await MLService.predictPerformance(videoFeatures);
    
    res.json({ predictedViews: prediction });
  } catch (error) {
    console.error('ML prediction error:', error);
    res.status(500).json({ error: 'Prediction service unavailable' });
  }
});

app.get('/api/ml/optimal-mix/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const videos = await Video.findByChannel(channelId);
    const analytics = await Analytics.getChannelAnalytics(channelId, 
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
    
    const channelData = videos.map(video => {
      const videoAnalytics = analytics.find(a => a.video_id === video.video_id);
      const performance = videoAnalytics ? videoAnalytics.views : 0;
      // Analyze video content for repurposing potential
      const segments = analyzeVideoForSegments(video);
      const repurposingPotential = calculateRepurposingPotential(segments, performance);
      return {
        videoId: video.video_id,
        title: video.title,
        segments,
        repurposingPotential
      };
    }).filter(video => video.repurposingPotential.score > 0.5)
      .sort((a, b) => b.repurposingPotential.score - a.repurposingPotential.score);
    res.json(recommendation);
  } catch (error) {
    console.error('Optimal mix analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze optimal content mix' });
  }
});

// File Upload Routes (for thumbnails)
app.post('/api/upload/thumbnail', async (req, res) => {
  try {
    const { file, videoId } = req.body;
    
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `thumbnails/${videoId}.jpg`,
      Body: Buffer.from(file, 'base64'),
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    };
    
    const result = await s3.upload(uploadParams).promise();
    
    res.json({ 
      success: true, 
      thumbnailUrl: result.Location 
    });
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    res.status(500).json({ error: 'Failed to upload thumbnail' });
  }
});

// Content Planning Routes
app.get('/api/content/repurposing/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const longformVideos = await Video.findByChannel(channelId, false);
    const analytics = await Analytics.getChannelAnalytics(channelId, 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
    
    const repurposingOpportunities = longformVideos.map(video => {
      const videoAnalytics = analytics.find(a => a.video_id === video.video_id);
      const performance = videoAnalytics ? videoAnalytics.views : 0;
      // Analyze video content for repurposing potential
      const segments = analyzeVideoForSegments(video);
      const repurposingPotential = calculateRepurposingPotential(segments, performance);
      return {
        videoId: video.video_id,
        title: video.title,
        segments,
        repurposingPotential
      };
    }).filter(video => video.repurposingPotential.score > 0.5)
      .sort((a, b) => b.repurposingPotential.score - a.repurposingPotential.score);
    
    res.json(repurposingOpportunities);
  } catch (error) {
    console.error('Repurposing analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze repurposing opportunities' });
  }
});

app.get('/api/content/trending', async (req, res) => {
  try {
    // In a real implementation, this would connect to trending APIs
    // For now, return mock trending topics
    const trendingTopics = [
      {
        topic: '#MorningRoutine',
        category: 'Lifestyle',
        trendScore: 95,
        recommendedFormat: 'shorts',
        description: 'Show your daily morning routine in 60 seconds'
      },
      {
        topic: 'AI Tools Review',
        category: 'Technology',
        trendScore: 88,
        recommendedFormat: 'long-form',
        description: 'Comprehensive review of latest AI productivity tools'
      },
      {
        topic: 'Quick Recipe Hacks',
        category: 'Cooking',
        trendScore: 92,
        recommendedFormat: 'shorts',
        description: 'Fast cooking tips and kitchen hacks'
      },
      {
        topic: 'Sustainable Living',
        category: 'Lifestyle',
        trendScore: 78,
        recommendedFormat: 'long-form',
        description: 'Deep dive into eco-friendly lifestyle changes'
      }
    ];
    
    res.json(trendingTopics);
  } catch (error) {
    console.error('Trending topics error:', error);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

// Helper Functions
function analyzeVideoForSegments(video) {
  // In a real implementation, this would use NLP/AI to analyze video content
  // For now, return mock segments based on video characteristics
  const segments = [];
  
  if (video.title.toLowerCase().includes('tutorial') || video.title.toLowerCase().includes('guide')) {
    segments.push({
      type: 'tutorial_step',
      title: 'Key Tutorial Steps',
      shortsCount: 3,
      confidence: 0.8
    });
  }
  
  if (video.title.toLowerCase().includes('review')) {
    segments.push({
      type: 'review_highlight',
      title: 'Product Highlights',
      shortsCount: 2,
      confidence: 0.7
    });
  }
  
  if (video.title.toLowerCase().includes('workout') || video.title.toLowerCase().includes('exercise')) {
    segments.push({
      type: 'exercise_demo',
      title: 'Exercise Demonstrations',
      shortsCount: 4,
      confidence: 0.9
    });
  }
  
  return segments;
}

function calculateRepurposingPotential(segments, performance) {
  const totalSegments = segments.reduce((sum, segment) => sum + segment.shortsCount, 0);
  const avgConfidence = segments.reduce((sum, segment) => sum + segment.confidence, 0) / segments.length;
  const performanceScore = Math.min(performance / 100000, 1); // Normalize performance
  
  const score = (totalSegments * 0.4 + avgConfidence * 0.4 + performanceScore * 0.2);
  
  return {
    score,
    totalSegments,
    confidence: avgConfidence,
    performanceScore
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;