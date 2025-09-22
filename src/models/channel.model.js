const sequelize = require('../config/sequelize');
const { DataTypes } = require('sequelize');

const Channel = sequelize.define('Channel', {
  name: { type: DataTypes.STRING, allowNull: false },
  youtube_channel_id: { type: DataTypes.STRING, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'channels',
  underscored: true,
});

module.exports = Channel;
