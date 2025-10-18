const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channelId: {
    type: String,
    required: true,
    unique: true
  },
  channelName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  subscriberCount: {
    type: Number,
    default: 0
  },
  videoCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  publishedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
channelSchema.index({ userId: 1, channelId: 1 });
channelSchema.index({ lastSynced: 1 });

module.exports = mongoose.model('Channel', channelSchema);