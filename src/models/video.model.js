// src/models/video.model.js
module.exports = (sequelize, DataTypes) => {
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
    }, {
        tableName: 'videos',
        underscored: true,
    });

    Video.associate = (models) => {
        Video.belongsTo(models.Channel, { foreignKey: 'channel_id' });
    };

    return Video;
};
