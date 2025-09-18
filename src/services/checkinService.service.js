const db = require('../models');                 // ⬅️
const { UserDailyCheckin, sequelize } = db;
const { now, todayStr } = require('./time.service');

function rules(mission) { return mission.milestone_rules || { cycleDays: 28, dayRewards: {}, milestones: [7, 14, 21, 28] }; }

async function getCheckinStatus(userId, mission, t) {
    const today = todayStr();
    const claimed = await UserDailyCheckin.findOne({ where: { user_id: userId, checkin_date: today }, transaction: t });
    const last = await UserDailyCheckin.findOne({ where: { user_id: userId }, order: [['checkin_date', 'DESC']], transaction: t });

    let dayIndex = 1, streak = 0;
    if (last) {
        const lastDate = new Date(`${last.checkin_date}T00:00:00+07:00`);
        const diff = Math.floor((now().toJSDate() - lastDate) / 86400000);
        if (diff === 1) { dayIndex = (last.day_index % (rules(mission).cycleDays || 28)) + 1; streak = last.streak_count + 1; }
        else if (diff === 0) { dayIndex = last.day_index; streak = last.streak_count; }
        else { dayIndex = 1; streak = 1; }
    }
    const rewardToday = rules(mission).dayRewards?.[String(dayIndex)] ?? mission.base_reward ?? 10;
    return { claimable: !claimed, dayIndex, streak, rewardToday };
}

async function doCheckin(userId, mission, addStarsFn) {
    return sequelize.transaction(async (t) => {
        const status = await getCheckinStatus(userId, mission, t);
        if (!status.claimable) return { already: true, ...status };

        const today = todayStr();
        const [row, created] = await UserDailyCheckin.findOrCreate({
            where: { user_id: userId, checkin_date: today },
            defaults: { day_index: status.dayIndex, streak_count: status.streak || 1, reward_stars: status.rewardToday },
            transaction: t
        });
        if (!created) return { already: true, ...status };

        const { balance } = await addStarsFn(userId, status.rewardToday, { dayIndex: status.dayIndex }, 'checkin', `checkin-${today}`);
        const isMilestone = (rules(mission).milestones || [7, 14, 21, 28]).includes(status.dayIndex);
        return { claimed: true, dayIndex: status.dayIndex, streak: status.streak, reward: { stars: status.rewardToday, milestone: isMilestone }, wallet: { stars: balance } };
    });
}

module.exports = { getCheckinStatus, doCheckin };
