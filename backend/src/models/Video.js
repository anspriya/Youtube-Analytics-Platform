const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  duration: { type: String, default: '' },
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  publishedAt: { type: Date },
  isShort: { type: Boolean, default: false },
  thumbnailUrl: { type: String, default: '' },
}, {
  timestamps: true
});

videoSchema.index({ channelId: 1, publishedAt: -1 });

module.exports = mongoose.model('Video', videoSchema);
