// src/models/video.model.js
const sequelize = require('../config/sequelize');
const { DataTypes } = require('sequelize');
const Channel = require('./channel.model');

const Video = sequelize.define('Video', {
  youtube_video_id: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  channel_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT },
  thumbnails_json: { type: DataTypes.JSONB },
  published_at: { type: DataTypes.DATE, allowNull: false },
  duration_iso: { type: DataTypes.STRING(32) },
  view_count: { type: DataTypes.BIGINT, defaultValue: 0 },
  like_count: { type: DataTypes.BIGINT, defaultValue: 0 },
  comment_count: { type: DataTypes.BIGINT, defaultValue: 0 },
  category: { 
    type: DataTypes.ARRAY(DataTypes.STRING), 
    allowNull: true, 
    defaultValue: ['Semua'] 
  },
}, {
  tableName: 'videos',
  underscored: true,
  schema: 'public',
});

// Relasi
Video.belongsTo(Channel, { foreignKey: 'channel_id' });
Channel.hasMany(Video, { foreignKey: 'channel_id' });

module.exports = Video;
