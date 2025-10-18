const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  channelId: {
    type: String,
    required: true,
    ref: 'Channel'
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    views: { type: Number, default: 0 },
    subscribers: { type: Number, default: 0 },
    videos: { type: Number, default: 0 },
    estimatedRevenue: { type: Number, default: 0 },
    watchTime: { type: Number, default: 0 }, // in minutes
    averageViewDuration: { type: Number, default: 0 }, // in seconds
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  demographics: {
    ageGroups: [{
      range: String, // e.g., "18-24"
      percentage: Number
    }],
    genders: [{
      type: String, // male, female, other
      percentage: Number
    }],
    topCountries: [{
      country: String,
      percentage: Number
    }]
  },
  topVideos: [{
    videoId: String,
    title: String,
    views: Number,
    duration: Number,
    publishedAt: Date
  }]
}, {
  timestamps: true
});

// Compound index for efficient date range queries
analyticsSchema.index({ channelId: 1, date: -1 });
analyticsSchema.index({ date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);