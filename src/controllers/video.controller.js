// src/controllers/video.controller.js
const { Op } = require('sequelize');
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
});

exports.listVideos = async (req, res, next) => {
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

exports.updateCategory = async (req, res, next) => {
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

exports.syncNow = async (req, res, next) => {
    try {
        const result = await syncAllActiveChannels();
        res.json({ status: 'success', synced: result });
    } catch (err) {
        next(err);
    }
};

async function getVideos(req, res) {
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
}

module.exports = {
  listVideos,
  updateCategory,
  syncNow,
  getVideos,
};