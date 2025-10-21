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
    if (!video) return res.status(404).send("Video not found");

    const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;

    // Ambil info setiap request (jangan cache)
    const info = await ytdl.getInfo(youtubeUrl);

    // Pilih format dengan kombinasi audio+video (mp4)
    let format = ytdl.chooseFormat(info.formats, {
      quality: "highest",
      filter: (f) => f.hasVideo && f.hasAudio && f.container === "mp4",
    });

    // 🔸 Fallback: cari format lain yang masih punya audio (kadang webm)
    if (!format || !format.url) {
      format = ytdl.chooseFormat(info.formats, {
        quality: "highest",
        filter: (f) => f.hasVideo && f.hasAudio,
      });
    }

    // 🔸 Fallback terakhir: video only
    if (!format || !format.url) {
      format = ytdl.chooseFormat(info.formats, {
        quality: "highestvideo",
        filter: "videoonly",
      });
    }

    if (!format || !format.url) {
      console.error("No playable format found for:", video.youtube_video_id);
      return res.status(410).send("Video not available");
    }

    // Range streaming support
    const range = req.headers.range;
    const videoSize = Number(format.contentLength || 0);

    if (range && videoSize) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;

      const chunkSize = end - start + 1;
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(206, headers);

      ytdl(youtubeUrl, {
        format,
        range: { start, end },
        requestOptions: {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          },
        },
      }).pipe(res);
    } else {
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Accept-Ranges", "bytes");

      ytdl(youtubeUrl, {
        format,
        requestOptions: {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          },
        },
      }).pipe(res);
    }
  } catch (err) {
    console.error("streamVideo error:", err);
    if (!res.headersSent)
      res
        .status(err.statusCode === 410 ? 410 : 500)
        .send(err.statusCode === 410 ? "Video not available" : "Server error");
  }
};

module.exports = {
    listVideos,
    updateCategory,
    syncNow,
    getVideos,
    streamVideo
};
