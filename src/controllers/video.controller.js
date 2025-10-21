const { Op } = require('sequelize');
const ytdl = require('ytdl-core');
const Video = require('../models/video.model');
const Channel = require('../models/channel.model');
const { syncAllActiveChannels } = require('../services/youtube.service');

const mapVideo = (v) => ({
    id: v.id,
    youtube_video_id: v.youtube_video_id,
    title: v.title,
    description: v.description,
    thumbnails: v.thumbnails_json || {},
    published_at: v.published_at,
    duration_iso: v.duration_iso,
    stats: {
        view_count: Number(v.view_count || 0),
        like_count: Number(v.like_count || 0),
        comment_count: Number(v.comment_count || 0),
    },
    channel: v.Channel ? { id: v.Channel.id, name: v.Channel.name } : null,
    embed_url: `https://www.youtube.com/embed/${v.youtube_video_id}`,
    url: `https://www.youtube.com/watch?v=${v.youtube_video_id}`,
});

const listVideos = async (req, res, next) => {
    try {
        const { page = 1, limit = 12, channel, q, category } = req.query;

        const where = {};
        if (q) where.title = { [Op.iLike]: `%${q}%` };
        if (category && category.toLowerCase() !== 'semua') {
            where.category = category;
        }

        let include = [{ model: Channel }];
        if (channel) {
            const aliasMap = { uah: 'Ustadz Adi Hidayat', hanan: 'Hanan Attaki' };
            const filter = isNaN(Number(channel))
                ? { name: aliasMap[String(channel).toLowerCase()] || channel }
                : { id: Number(channel) };
            include = [{ model: Channel, where: filter, required: true }];
        }

        const offset = (Number(page) - 1) * Number(limit);
        const { rows, count } = await Video.findAndCountAll({
            where,
            include,
            order: [['published_at', 'DESC']],
            offset,
            limit: Number(limit),
        });

        res.json({ status: 'success', page: Number(page), total: count, data: rows.map(mapVideo) });
    } catch (err) {
        next(err);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { category } = req.body;

        const video = await Video.findByPk(id);
        if (!video) return res.status(404).json({ status: 'error', message: 'Video not found' });

        video.category = category;
        await video.save();

        res.json({ status: 'success', data: video });
    } catch (err) {
        next(err);
    }
};

const syncNow = async (req, res, next) => {
    try {
        const result = await syncAllActiveChannels();
        res.json({ status: 'success', synced: result });
    } catch (err) {
        next(err);
    }
};

const getVideos = async (req, res) => {
    try {
        const { category } = req.query;
        const where = {};
        if (category && category !== 'Semua') {
            where.category = category;
        }
        const videos = await Video.findAll({ where });
        res.json({ status: 'success', data: videos });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

const streamVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) return res.status(404).send('Video not found');

    const videoId = video.youtube_video_id;
    const info = await ytdl.getInfo(videoId);

    // Pilih format mp4 (video+audio)
    let format = ytdl.chooseFormat(info.formats, {
      quality: '18', // 360p aman untuk streaming stabil
      filter: (f) => f.mimeType?.includes('video/mp4') && f.hasAudio && f.hasVideo,
    });

    if (!format || !format.url) {
      format = ytdl.chooseFormat(info.formats, {
        quality: 'lowest',
        filter: (f) => f.hasAudio,
      });
    }

    if (!format || !format.url) {
      console.error('No valid format found for:', videoId);
      return res.status(410).send('Video not available');
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');

    console.log(`🎥 Streaming: ${video.title} (${video.youtube_video_id})`);

    const stream = ytdl(videoId, { format });
    stream.on('error', (err) => {
      console.error('ytdl streaming error:', err);
      if (!res.headersSent) res.status(500).send('Error streaming video');
    });

    stream.pipe(res);
  } catch (err) {
    console.error('streamVideo error:', err);
    if (!res.headersSent)
      res.status(500).send('Server error while streaming video');
  }
};

module.exports = {
    listVideos,
    updateCategory,
    syncNow,
    getVideos,
    streamVideo
};
