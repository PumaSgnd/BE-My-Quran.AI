// src/models/channel.model.js
module.exports = (sequelize, DataTypes) => {
    const Channel = sequelize.define('Channel', {
        youtube_channel_id: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        tableName: 'channels',
        underscored: true,
    });

    Channel.associate = (models) => {
        Channel.hasMany(models.Video, { foreignKey: 'channel_id' });
    };

    return Channel;
};
