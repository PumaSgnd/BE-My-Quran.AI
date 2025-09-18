const db = require('../models');                 // ⬅️
const { Mission, MissionPeriod, UserMissionProgress, sequelize } = db;
const { dailyPeriodKey, weeklyPeriodKey, now } = require('./time.service');

const EVENT_MISSION_MAP = {
    quran_read: ['daily_read_10_verses', 'weekly_read_100_verses'],
    audio_listen: ['daily_listen_5_minutes', 'weekly_listen_30_minutes'],
    video_watch: ['daily_watch_video_1'],
    ad_rewarded: ['daily_watch_ad_1']
};

function periodKeyOf(p) { return p === 'daily' ? dailyPeriodKey() : p === 'weekly' ? weeklyPeriodKey() : 'event'; }

async function ensurePeriod(mission, t) {
    const key = periodKeyOf(mission.period);
    const found = await MissionPeriod.findOne({ where: { mission_id: mission.id, period_key: key }, transaction: t });
    if (found) return found;
    const dt = now(); let start, end;
    if (mission.period === 'daily') { start = dt.startOf('day').toJSDate(); end = dt.endOf('day').toJSDate(); }
    else if (mission.period === 'weekly') { start = dt.startOf('week').toJSDate(); end = dt.endOf('week').toJSDate(); }
    else { start = mission.active_from || dt.startOf('day').toJSDate(); end = mission.active_to || dt.plus({ years: 10 }).toJSDate(); }
    return MissionPeriod.create({ mission_id: mission.id, period_key: key, start_at: start, end_at: end }, { transaction: t });
}

async function ensureProgress(userId, missionPeriodId, t) {
    const [row] = await UserMissionProgress.findOrCreate({
        where: { user_id: userId, mission_period_id: missionPeriodId },
        defaults: { progress_value: 0, status: 'in_progress' },
        transaction: t
    });
    return row;
}

async function applyEvent(userId, event) {
    return sequelize.transaction(async (t) => {
        const codes = EVENT_MISSION_MAP[event.code] || [];
        if (!codes.length) return { appliedTo: [] };
        const missions = await Mission.findAll({ where: { is_active: true, code: codes }, transaction: t });

        const applied = [];
        for (const m of missions) {
            const period = await ensurePeriod(m, t);
            const prog = await ensureProgress(userId, period.id, t);
            if (prog.status === 'claimed') continue;

            let inc = 0;
            if (event.code === 'quran_read') inc = event.verses_count || 0;
            else if (event.code === 'audio_listen') inc = event.seconds || 0;
            else if (event.code === 'video_watch') inc = event.completed ? 1 : 0;
            else if (event.code === 'ad_rewarded') inc = 1;
            if (inc <= 0) continue;

            const next = (prog.progress_value || 0) + inc;
            const status = next >= m.target_value ? 'completed' : 'in_progress';
            await prog.update({ progress_value: next, status, last_event_at: sequelize.literal('NOW()') }, { transaction: t });
            applied.push({ missionId: m.code, progressBefore: prog.progress_value, progressAfter: next, status });
        }
        return { appliedTo: applied };
    });
}

async function claimMission(userId, missionCode, addStarsFn) {
    return sequelize.transaction(async (t) => {
        const mission = await Mission.findOne({ where: { code: missionCode, is_active: true }, transaction: t });
        if (!mission) throw new Error('Mission not found');
        const mp = await MissionPeriod.findOne({ where: { mission_id: mission.id, period_key: periodKeyOf(mission.period) }, transaction: t });
        if (!mp) throw new Error('Mission period not found');

        const prog = await UserMissionProgress.findOne({ where: { user_id: userId, mission_period_id: mp.id }, transaction: t, lock: t.LOCK.UPDATE });
        if (!prog) throw new Error('No progress for this mission');
        if (prog.status === 'claimed') return { alreadyClaimed: true };
        if (prog.status !== 'completed') throw new Error('Mission not completed');

        await prog.update({ status: 'claimed' }, { transaction: t });
        const { balance } = await addStarsFn(userId, mission.base_reward || 0, { missionCode }, 'mission_claim', mission.code);
        return { missionId: mission.code, reward: { stars: mission.base_reward || 0 }, wallet: { stars: balance } };
    });
}

module.exports = { applyEvent, claimMission };
