class AnalyticsService {
  calculateDateRange(period, customStart, customEnd) {
    const end = customEnd ? new Date(customEnd) : new Date();
    let start;

    if (customStart) {
      start = new Date(customStart);
    } else {
      switch (period) {
        case '7d':
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    return { start, end };
  }

  processAnalyticsData(analytics, period) {
    if (!analytics.length) return [];

    // Group data by date
    const groupedData = this.groupByDate(analytics, period);
    
    // Calculate growth rates
    const processedData = groupedData.map((data, index) => {
      const previousData = groupedData[index + 1];
      return {
        ...data,
        growth: this.calculateGrowth(data, previousData)
      };
    });

    return processedData;
  }

  groupByDate(analytics, period) {
    const grouped = {};
    
    analytics.forEach(record => {
      const dateKey = this.getDateKey(record.date, period);
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          metrics: {
            views: 0,
            subscribers: 0,
            videos: 0,
            estimatedRevenue: 0,
            watchTime: 0,
            likes: 0,
            comments: 0
          }
        };
      }

      // Aggregate metrics
      Object.keys(record.metrics).forEach(key => {
        if (grouped[dateKey].metrics.hasOwnProperty(key)) {
          grouped[dateKey].metrics[key] += record.metrics[key] || 0;
        }
      });
    });

    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  getDateKey(date, period) {
    const d = new Date(date);
    
    switch (period) {
      case '7d':
      case '30d':
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
      case '90d':
        // Group by week
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      case '1y':
        // Group by month
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0];
    }
  }

  calculateGrowth(current, previous) {
    if (!previous) return {};

    const growth = {};
    Object.keys(current.metrics).forEach(key => {
      const currentValue = current.metrics[key] || 0;
      const previousValue = previous.metrics[key] || 0;
      
      if (previousValue === 0) {
        growth[key] = currentValue > 0 ? 100 : 0;
      } else {
        growth[key] = ((currentValue - previousValue) / previousValue) * 100;
      }
    });

    return growth;
  }

  calculateDashboardMetrics(channels, analytics, period) {
    const totalChannels = channels.length;
    const totalSubscribers = channels.reduce((sum, c) => sum + c.subscriberCount, 0);
    const totalViews = channels.reduce((sum, c) => sum + c.viewCount, 0);
    const totalVideos = channels.reduce((sum, c) => sum + c.videoCount, 0);

    // Calculate recent analytics data
    const recentAnalytics = this.processAnalyticsData(analytics, period);
    
    // Calculate top performing channels
    const channelPerformance = channels.map(channel => {
      const channelAnalytics = analytics.filter(a => a.channelId === channel.channelId);
      const totalChannelViews = channelAnalytics.reduce((sum, a) => sum + (a.metrics.views || 0), 0);
      
      return {
        ...channel.toObject(),
        recentViews: totalChannelViews,
        performance: this.calculateChannelPerformance(channelAnalytics)
      };
    }).sort((a, b) => b.recentViews - a.recentViews);

    return {
      totalChannels,
      totalSubscribers,
      totalViews,
      totalVideos,
      channels: channelPerformance,
      analyticsData: recentAnalytics,
      summary: this.calculateSummaryMetrics(recentAnalytics)
    };
  }

  calculateChannelPerformance(analytics) {
    if (!analytics.length) return { score: 0, trend: 'stable' };

    const recent = analytics.slice(0, 7); // Last 7 records
    const older = analytics.slice(7, 14); // Previous 7 records

    if (!older.length) return { score: 50, trend: 'stable' };

    const recentAvg = recent.reduce((sum, a) => sum + (a.metrics.views || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, a) => sum + (a.metrics.views || 0), 0) / older.length;

    const growth = olderAvg === 0 ? 0 : ((recentAvg - olderAvg) / olderAvg) * 100;
    
    let trend = 'stable';
    if (growth > 10) trend = 'up';
    else if (growth < -10) trend = 'down';

    const score = Math.max(0, Math.min(100, 50 + growth));

    return { score: Math.round(score), trend };
  }

  calculateSummaryMetrics(analyticsData) {
    if (!analyticsData.length) return {};

    const latest = analyticsData[0];
    const previous = analyticsData[1];

    if (!previous) return latest.metrics;

    const summary = {};
    Object.keys(latest.metrics).forEach(key => {
      const current = latest.metrics[key] || 0;
      const prev = previous.metrics[key] || 0;
      const change = prev === 0 ? 0 : ((current - prev) / prev) * 100;

      summary[key] = {
        current,
        previous: prev,
        change: Math.round(change * 100) / 100,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      };
    });

    return summary;
  }
}

module.exports = new AnalyticsService();