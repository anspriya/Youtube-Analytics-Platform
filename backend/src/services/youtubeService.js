const axios = require('axios');

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  async getChannelDetails(channelId) {
    try {
      const response = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: channelId,
          key: this.apiKey
        }
      });

      return response.data.items?.[0] || null;
    } catch (error) {
      console.error('YouTube API error:', error.response?.data || error.message);
      return null;
    }
  }

  async getChannelAnalytics(channelId) {
    try {
      // Note: This is a simplified version. In a real implementation,
      // you would use YouTube Analytics API which requires OAuth2
      const channelData = await this.getChannelDetails(channelId);
      
      if (!channelData) return null;

      // Get recent videos for additional metrics
      const videos = await this.getChannelVideos(channelId, 50);
      
      return {
        metrics: {
          views: parseInt(channelData.statistics.viewCount) || 0,
          subscribers: parseInt(channelData.statistics.subscriberCount) || 0,
          videos: parseInt(channelData.statistics.videoCount) || 0,
          estimatedRevenue: this.calculateEstimatedRevenue(channelData.statistics),
          watchTime: this.calculateWatchTime(videos),
          averageViewDuration: this.calculateAverageViewDuration(videos),
          likes: this.calculateTotalLikes(videos),
          comments: this.calculateTotalComments(videos),
          shares: 0 // Not available in public API
        },
        demographics: {
          ageGroups: this.generateMockDemographics('age'),
          genders: this.generateMockDemographics('gender'),
          topCountries: this.generateMockDemographics('country')
        },
        topVideos: this.formatTopVideos(videos.slice(0, 10))
      };
    } catch (error) {
      console.error('Get channel analytics error:', error);
      return null;
    }
  }

  async getChannelVideos(channelId, maxResults = 50) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          channelId,
          type: 'video',
          order: 'date',
          maxResults,
          key: this.apiKey
        }
      });

      const videoIds = response.data.items.map(item => item.id.videoId);
      
      // Get video statistics
      const statsResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'statistics,contentDetails',
          id: videoIds.join(','),
          key: this.apiKey
        }
      });

      // Combine video data with statistics
      return response.data.items.map((video, index) => ({
        ...video,
        statistics: statsResponse.data.items[index]?.statistics || {},
        contentDetails: statsResponse.data.items[index]?.contentDetails || {}
      }));
    } catch (error) {
      console.error('Get channel videos error:', error);
      return [];
    }
  }

  calculateEstimatedRevenue(statistics) {
    // Rough estimation: $1-3 per 1000 views
    const views = parseInt(statistics.viewCount) || 0;
    return Math.floor((views / 1000) * 2);
  }

  calculateWatchTime(videos) {
    // Mock calculation - in real implementation, use YouTube Analytics API
    return videos.reduce((total, video) => {
      const views = parseInt(video.statistics?.viewCount) || 0;
      const duration = this.parseDuration(video.contentDetails?.duration) || 0;
      return total + (views * duration / 60); // Convert to minutes
    }, 0);
  }

  calculateAverageViewDuration(videos) {
    // Mock calculation - typically 40-60% of video duration
    const totalDuration = videos.reduce((total, video) => {
      return total + (this.parseDuration(video.contentDetails?.duration) || 0);
    }, 0);
    
    return videos.length > 0 ? (totalDuration / videos.length) * 0.5 : 0;
  }

  calculateTotalLikes(videos) {
    return videos.reduce((total, video) => {
      return total + (parseInt(video.statistics?.likeCount) || 0);
    }, 0);
  }

  calculateTotalComments(videos) {
    return videos.reduce((total, video) => {
      return total + (parseInt(video.statistics?.commentCount) || 0);
    }, 0);
  }

  parseDuration(duration) {
    if (!duration) return 0;
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  generateMockDemographics(type) {
    // Generate mock demographic data since it's not available in public API
    switch (type) {
      case 'age':
        return [
          { range: '18-24', percentage: 25 },
          { range: '25-34', percentage: 35 },
          { range: '35-44', percentage: 20 },
          { range: '45-54', percentage: 12 },
          { range: '55+', percentage: 8 }
        ];
      case 'gender':
        return [
          { type: 'male', percentage: 60 },
          { type: 'female', percentage: 35 },
          { type: 'other', percentage: 5 }
        ];
      case 'country':
        return [
          { country: 'United States', percentage: 40 },
          { country: 'India', percentage: 20 },
          { country: 'United Kingdom', percentage: 10 },
          { country: 'Canada', percentage: 8 },
          { country: 'Australia', percentage: 5 }
        ];
      default:
        return [];
    }
  }

  formatTopVideos(videos) {
    return videos.map(video => ({
      videoId: video.id.videoId,
      title: video.snippet.title,
      views: parseInt(video.statistics?.viewCount) || 0,
      duration: this.parseDuration(video.contentDetails?.duration) || 0,
      publishedAt: new Date(video.snippet.publishedAt)
    }));
  }
}

module.exports = new YouTubeService();