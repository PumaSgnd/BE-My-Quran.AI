// src/services/youtube.service.js
const axios = require('axios');
const sequelize = require('../config/sequelize');
const Video = require('../models/video.model');
const Channel = require('../models/channel.model');

const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

async function fetchLatestVideoIdsByChannel(channelId, maxResults = 25) {
    const { data } = await axios.get(`${YT_BASE}/search`, {
        params: {
            key: API_KEY,
            part: 'id',
            channelId,
            maxResults,
            order: 'date',
            type: 'video',
        },
    });
    return (data.items || []).map(it => it.id?.videoId).filter(Boolean);
}

async function fetchVideoDetails(ids) {
    if (!ids.length) return [];
    const { data } = await axios.get(`${YT_BASE}/videos`, {
        params: {
            key: API_KEY,
            part: 'snippet,contentDetails,statistics',
            id: ids.join(','),
            maxResults: ids.length,
        },
    });
    return data.items || [];
}

async function upsertVideosForChannel(channelRow, maxResults = 25) {
  const t = await sequelize.transaction();
  try {
    const ids = await fetchLatestVideoIdsByChannel(channelRow.youtube_channel_id, maxResults);
    const details = await fetchVideoDetails(ids);

    for (const v of details) {
      const { id: youtube_video_id, snippet, contentDetails, statistics } = v;

      await Video.upsert({
        youtube_video_id,
        channel_id: channelRow.id,
        title: snippet?.title || '',
        description: snippet?.description || '',
        thumbnails_json: snippet?.thumbnails || {},
        published_at: snippet?.publishedAt ? new Date(snippet.publishedAt) : new Date(),
        duration_iso: contentDetails?.duration || null,
        view_count: Number(statistics?.viewCount || 0),
        like_count: Number(statistics?.likeCount || 0),
        comment_count: Number(statistics?.commentCount || 0),
        category: sequelize.literal(`COALESCE("category", 'Semua')`),
      }, { transaction: t });
    }

    await t.commit();
    return { inserted_or_updated: details.length };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}


async function syncAllActiveChannels() {
    const channels = await Channel.findAll({ where: { is_active: true } });
    const result = [];
    for (const ch of channels) {
        const r = await upsertVideosForChannel(ch, 25);
        result.push({ channel: ch.name, ...r });
    }
    return result;
}

module.exports = {
    syncAllActiveChannels,
    upsertVideosForChannel,
};
